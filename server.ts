import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { connectDB } from './lib/mongo.js';
import { User, Candidate, Test, Settings } from './models/index.js';
import { McqBank } from './models/mcq.js';
import { PersonaVariant, MockSession, McqSession } from './models/sessions.js';
import { PERSONA_VARIANTS } from './lib/personaData.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from './lib/auth.js';

import { callAI } from './lib/ai.js';
import { SYSTEM_PROMPTS } from './lib/prompts.js';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware for auth
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded: any = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  req.user = decoded;
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ops_admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
};

const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    if (req.user.role === 'super_admin') return next();
    
    try {
      const user = await (User as any).findById(req.user.id);
      if (!user || !user.active) {
        return res.status(403).json({ error: 'Account inactive or not found' });
      }

      if (user.role === 'ops_admin' && user.permissions?.includes(permission)) {
        return next();
      }
      
      res.status(403).json({ error: `Permission '${permission}' required` });
    } catch (err) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

export async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Connection middleware - ensuring DB is connected on every request in serverless
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectDB();
      next();
    } catch (err: any) {
      console.error('Database connection error in middleware:', err);
      res.status(500).json({ 
        error: 'Database connection failed', 
        details: err.message 
      });
    }
  });

  // Seed super_admin and PersonaVariants - lazily or check first
  const seedDB = async () => {
    try {
      const adminExists = await User.findOne({ role: 'super_admin' } as any);
      if (!adminExists) {
        const passwordHash = await hashPassword('ChangeMe@123');
        await User.create({
          name: 'Super Admin',
          phone: '9999999999',
          passwordHash,
          role: 'super_admin',
          active: true
        });
        console.log('⚠️ Default super_admin created. Change password immediately.');
      }

      const personaCount = await PersonaVariant.countDocuments();
      if (personaCount === 0) {
        const now = new Date();
        const withTimestamps = PERSONA_VARIANTS.map(p => ({
          ...p,
          createdAt: now,
          updatedAt: now
        }));
        await PersonaVariant.insertMany(withTimestamps as any);
        console.log('✅ Seeded 35 Persona Variants');
      }
    } catch (err) {
      console.error('Seeding error:', err);
    }
  };

  // We don't necessarily need to block for seeding in every cold start
  // but we should ensure it eventually runs
  seedDB();

  // API Routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    try {
      const user = await User.findOne({ phone } as any);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      if (!user.active) return res.status(403).json({ error: 'Account disabled' });

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

      user.lastLoginAt = new Date();
      await user.save();

      const expiresIn = user.role === 'candidate' ? '4h' : '7d';
      const token = generateToken({ id: user._id, role: user.role }, expiresIn);

      let candidateStatus = null;
      if (user.role === 'candidate' && user.candidateId) {
        const c = await (Candidate as any).findById(user.candidateId);
        candidateStatus = c?.status;
      }

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions || [],
          candidateStatus
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Candidate APIs
  app.get('/api/candidates', authenticate, requirePermission('candidates'), async (req: Request, res: Response) => {
    try {
      const candidates = await Candidate.find({} as any).sort({ createdAt: -1 });
      
      const enrichedCandidates = await Promise.all(candidates.map(async (c: any) => {
        // Find latest test for this candidate
        const latestTest = await Test.findOne({ candidateId: c._id } as any).sort({ createdAt: -1 });
        
        let mcqScore = '0.0';
        let mockScore = '0.0';

        if (latestTest) {
          const mcqSession = await McqSession.findOne({ testId: latestTest._id } as any);
          const mockSession = await MockSession.findOne({ testId: latestTest._id } as any);

          if (mcqSession) mcqScore = mcqSession.adjustedScore?.toFixed(1) || '0.0';
          if (mockSession?.aiScores) {
            mockScore = (Object.values(mockSession.aiScores as Record<string, number>).reduce((a, b) => a + b, 0) / 6).toFixed(1);
          }
        }

        return {
          ...c.toObject(),
          primarySkill: c.primarySkill || c.skills?.[0] || 'N/A',
          mcqScore,
          mockScore
        };
      }));

      res.json(enrichedCandidates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/candidates', authenticate, requirePermission('candidates'), async (req: Request, res: Response) => {
    const { name, email, phone, skills, yearsExperience, password } = req.body;
    try {
      // Find current user name
      const admin = await (User as any).findById(req.user.id);

      const candidate = await Candidate.create({
        name,
        email,
        phone,
        skills,
        yearsExperience,
        createdBy: req.user.id,
        createdByName: admin?.name || 'Admin'
      });

      const passwordHash = await hashPassword(password || phone);
      await User.create({
        name,
        phone,
        passwordHash,
        role: 'candidate',
        candidateId: candidate._id,
        createdBy: req.user.id,
        createdByName: admin?.name || 'Admin'
      });

      res.status(201).json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/candidates/:id/reset-password', authenticate, requireAdmin, async (req: Request, res: Response) => {
    const { password } = req.body;
    try {
      const candidate = await (Candidate as any).findById(req.params.id);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      const passwordHash = await hashPassword(password);
      await (User as any).findOneAndUpdate({ candidateId: candidate._id } as any, { passwordHash });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/tests', authenticate, requirePermission('create_test'), async (req: Request, res: Response) => {
    const { candidateId, testType, order, config } = req.body;
    try {
      let populatedPersonas = [];
      
      // Only populate personas if the test includes mock consultations
      if (testType === 'mock_consult' || testType === 'both') {
        populatedPersonas = await Promise.all((config.personas || []).map(async (p: any) => {
          // Find all variants for this type to pick one that actually exists
          const variants = await PersonaVariant.find({ personaType: p.personaType } as any);
          let selectedVariant = null;
          
          if (variants.length > 0) {
            selectedVariant = variants[Math.floor(Math.random() * variants.length)];
          }

          return {
            personaType: p.personaType,
            name: p.name || selectedVariant?.name || 'Client',
            useRandomDob: p.useRandomDob,
            variantIndex: selectedVariant?.variantIndex || 1
          };
        }));
      }

      // Find current user name
      const admin = await (User as any).findById(req.user.id);

      const test = await Test.create({
        candidateId,
        testType,
        order,
        config: {
          personas: populatedPersonas,
          mcqConfig: (testType === 'mcq' || testType === 'both') ? config.mcqConfig : undefined
        },
        createdBy: req.user.id,
        createdByName: admin?.name || 'Admin'
      });
      await (Candidate as any).findByIdAndUpdate(candidateId, { status: 'invited' }, { returnDocument: 'after' });
      res.status(201).json(test);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/tests', authenticate, requirePermission('create_test'), async (req: Request, res: Response) => {
    try {
      const tests = await Test.find({} as any).sort({ createdAt: -1 });
      const enrichedTests = await Promise.all(tests.map(async (t: any) => {
        const candidate = await (Candidate as any).findById(t.candidateId);
        return {
          ...t.toObject(),
          candidateName: candidate?.name || 'Deleted Practitioner'
        };
      }));
      res.json(enrichedTests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/ai-insights', authenticate, requirePermission('analytics'), async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt required' });

      const candidates = await Candidate.find({} as any);
      
      const detailedData = await Promise.all(candidates.map(async (c: any) => {
        const latestTest = await Test.findOne({ candidateId: c._id } as any).sort({ createdAt: -1 });
        let scores = { mock: 0, mcq: 0 };
        
        if (latestTest) {
          const mcqSession = await McqSession.findOne({ testId: latestTest._id } as any);
          const mockSession = await MockSession.findOne({ testId: latestTest._id } as any);
          
          if (mcqSession) scores.mcq = Math.round(mcqSession.adjustedScore || 0);
          if (mockSession?.aiScores) {
            scores.mock = Math.round(Object.values(mockSession.aiScores as Record<string, number>).reduce((a, b) => a + b, 0) / 6);
          }
        }

        return {
          name: c.name,
          skill: c.primarySkill || c.skills?.[0] || 'N/A',
          status: c.status,
          scores,
          pay: c.earningCard ? {
            fixed: c.earningCard.fixedRate,
            variable: c.earningCard.variableRate,
            share: c.earningCard.systemShare,
            tier: c.finalTier || 'Senior'
          } : 'Not set'
        };
      }));

      const statsContext = `You are the Lead Data Analyst for Astrolive.
Below is the current REAL-TIME dataset of practitioners in the vetting pipeline:
${JSON.stringify(detailedData, null, 2)}

Your Goal: Provide concise, high-impact strategic insights.
1. Answer specific questions about performance (scores), pay/monetization, or skills.
2. Identify top performers (high mock/mcq scores).
3. Suggest revenue optimization based on tiers and payout models.
4. If asked about "test score pay", correlate their assessment results with their assigned rates.

Keep answers professional, data-driven, and focused on business growth.`;

      const reply = await callAI([
        { role: 'system', content: statsContext },
        { role: 'user', content: prompt }
      ]);
      res.json({ reply });
    } catch (error: any) {
      console.error('AI Insight Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/translate', authenticate, async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage, isMcq, question } = req.body;
      let prompt = "";
      let jsonMode = false;

      if (isMcq && question) {
        prompt = `Translate the following MCQ question and its options to ${targetLanguage}. 
        Keep the structure identical. The output must be valid JSON matching this schema: { "question": "string", "options": ["string", "string", "string", "string"] }.
        
        QUESTION: ${question.question}
        OPTIONS: ${JSON.stringify(question.options)}`;
        jsonMode = true;
      } else {
        prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no extra commentary or formatting.
        
        TEXT: ${text}`;
      }

      const reply = await callAI([
        { role: 'user', content: prompt }
      ], { json: jsonMode, temperature: 0 });

      if (jsonMode) {
        res.json(JSON.parse(reply));
      } else {
        res.json({ translatedText: reply });
      }
    } catch (error: any) {
      console.error('Translation API Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/personas', authenticate, requirePermission('personas'), async (req: Request, res: Response) => {
    try {
      const personas = await PersonaVariant.find({} as any).sort({ personaType: 1, variantIndex: 1 });
      res.json(personas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Candidate Test Flow
  app.get('/api/tests/active', authenticate, async (req: Request, res: Response) => {
    try {
      const user = await (User as any).findById(req.user.id);
      if (!user || user.role !== 'candidate') return res.status(403).json({ error: 'Not a candidate' });
      
      const test: any = await Test.findOne({ 
        candidateId: user.candidateId
      } as any).sort({ createdAt: -1 }); // Get most recent test

      if (test) {
        // Hydrate personas dynamically
        const hydratedPersonas = await Promise.all(test.config.personas.map(async (p: any) => {
          if (!p.name || p.name === 'Client' || !p.variantIndex) {
            const variants = await PersonaVariant.find({ personaType: p.personaType } as any);
            const variant = variants.find((v: any) => v.variantIndex === p.variantIndex) || variants[0];
            
            return {
              ...p,
              name: p.name && p.name !== 'Client' ? p.name : (variant?.name || 'Client'),
              variantIndex: p.variantIndex || variant?.variantIndex || 1
            };
          }
          return p;
        }));
        
        const testObj = test.toObject();
        testObj.config.personas = hydratedPersonas;
        return res.json(testObj);
      }
      
      res.json(null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Toggle Test Status
  app.put('/api/tests/:id/toggle-active', authenticate, requirePermission('create_test'), async (req: Request, res: Response) => {
    try {
      const test = await (Test as any).findById(req.params.id);
      if (!test) return res.status(404).json({ error: 'Test not found' });
      
      test.isActive = !test.isActive;
      await test.save();
      res.json({ success: true, isActive: test.isActive });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/tests/:id/start', authenticate, async (req: Request, res: Response) => {
    try {
      const test = await (Test as any).findById(req.params.id);
      if (!test) return res.status(404).json({ error: 'Test not found' });
      
      if (!test.isActive) return res.status(403).json({ error: 'This test link is currently inactive.' });
      if (test.status === 'completed') return res.status(403).json({ error: 'Test already completed.' });
      
      test.status = 'active';
      test.startedAt = new Date();
      test.browserFingerprint = req.body.fingerprint;
      test.ipAddress = req.ip;
      await test.save();
      
      res.json(test);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/tests/:id/complete', authenticate, async (req: Request, res: Response) => {
    try {
      const test = await (Test as any).findById(req.params.id);
      if (!test) return res.status(404).json({ error: 'Test not found' });
      
      test.status = 'completed';
      test.completedAt = new Date();
      await test.save();

      // Trigger auto-evaluation for mock sessions
      const sessionsToJudge = await MockSession.find({ testId: test._id, aiScores: { $exists: false } } as any);
      for (const session of sessionsToJudge as any[]) {
        try {
          const evaluation = await callAI([
            { role: 'system', content: SYSTEM_PROMPTS.PERSONA_JUDGE },
            { role: 'user', content: `BACKSTORY: ${session.personaBackstory || session.backstory}\nCHART: ${JSON.stringify(session.chartJson)}\nTRANSCRIPT: ${JSON.stringify(session.transcript)}` }
          ], { json: true });

          const result = JSON.parse(evaluation);
          session.aiScores = result.scores;
          
          // Robustly handle redFlags
          let rawFlags = result.redFlags;
          if (typeof rawFlags === 'string') {
            try {
              rawFlags = JSON.parse(rawFlags);
            } catch (e) {
              rawFlags = [];
            }
          }
          
          if (Array.isArray(rawFlags)) {
            session.redFlags = rawFlags.map((f: any) => {
              if (typeof f === 'string') {
                return { type: 'General', severity: 'low', evidence: f };
              }
              return {
                type: f.type || 'General',
                severity: ['low', 'medium', 'critical'].includes(f.severity) ? f.severity : 'low',
                evidence: f.evidence || String(f)
              };
            });
          } else {
            session.redFlags = [];
          }

          session.judgeSummary = result.summary;
          await session.save();
        } catch (e) {
          console.error(`Failed to evaluate mock session ${session._id}`, e);
        }
      }

      await (Candidate as any).findByIdAndUpdate(test.candidateId, { status: 'completed' }, { returnDocument: 'after' });
      await (User as any).findOneAndUpdate({ candidateId: test.candidateId } as any, { active: false }, { returnDocument: 'after' });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/chart/compute', authenticate, async (req: Request, res: Response) => {
    const { dob, tob, pob, system } = req.body;
    try {
      if (!dob || !tob || !pob) {
        return res.status(400).json({ error: 'Birth details (DOB, TOB, POB) are required' });
      }

      const chart = await callAI([
        { role: 'system', content: SYSTEM_PROMPTS.CHART_COMPUTE },
        { role: 'user', content: `DOB: ${dob}, TOB: ${tob}, POB: ${pob}, System: ${system || 'vedic'}` }
      ], { json: true, temperature: 0 });

      if (!chart) {
        throw new Error('AI returned an empty chart response');
      }

      try {
        res.json(JSON.parse(chart));
      } catch (parseErr) {
        console.error('Failed to parse AI chart JSON:', chart);
        // Attempt a basic cleanup if it's almost JSON
        const cleaned = chart.replace(/[\n\r\t]/g, ' ').trim();
        res.json(JSON.parse(cleaned));
      }
    } catch (error: any) {
      console.error('Chart Compute Error:', error);
      res.status(500).json({ error: error.message || 'Failed to compute chart' });
    }
  });

  app.post('/api/persona/start', authenticate, async (req: Request, res: Response) => {
    const { testId, personaData, chartJson } = req.body;
    try {
      const pType = personaData.type || personaData.personaType;
      const vIdx = personaData.variantIndex || 1;

      // Check if session already exists for this test, type and variant
      let session: any = await MockSession.findOne({ 
        testId, 
        personaType: pType,
        personaVariantIndex: vIdx
      } as any);

      // Self-healing: if session exists but name is Client, try to update it from DB
      if (session && (session.personaName === 'Client' || !session.personaBackstory)) {
        const variant = await PersonaVariant.findOne({ personaType: pType, variantIndex: vIdx } as any) || 
                        await PersonaVariant.findOne({ personaType: pType } as any);
        if (variant) {
          session.personaName = variant.name;
          session.personaBackstory = variant.backstory;
          session.communicationStyle = variant.communicationStyle;
          session.curveball = variant.curveball;
          await session.save();
        }
      }

      if (!session) {
        // Look up persona details from DB
        let variant = await PersonaVariant.findOne({ personaType: pType, variantIndex: vIdx } as any);
        
        // Fallback: if specific variant index not found, take ANY variant of this type
        if (!variant) {
          variant = await PersonaVariant.findOne({ personaType: pType } as any);
        }

        const variantObj = variant ? variant.toObject() : {};
        delete variantObj._id;
        delete variantObj.__v;
        const fullPersonaData = { ...personaData, ...variantObj };

        session = await MockSession.create({
          testId,
          personaName: fullPersonaData.name || 'Client',
          personaType: pType,
          personaVariantIndex: vIdx,
          personaBackstory: fullPersonaData.backstory,
          personaDob: fullPersonaData.dob,
          personaTob: fullPersonaData.tob,
          personaPob: fullPersonaData.pob,
          communicationStyle: fullPersonaData.communicationStyle,
          curveball: fullPersonaData.curveball,
          chartJson,
          transcript: [],
          durationSeconds: 300
        });
      }

      if (!session.transcript || session.transcript.length === 0) {
        // Generate initial message
        const systemPrompt = `You are playing the role of a CLIENT (the person seeking a reading) consulting an astrologer. 
        YOU ARE NOT THE ASTROLOGER. The person you are talking to is the astrologer.
        
        YOUR NAME: ${session.personaName}
        YOUR BACKSTORY: ${session.personaBackstory || 'Seeking astrological guidance.'}
        YOUR PERSONALITY/STYLE: ${session.communicationStyle || 'Normal'}
        YOUR DEVIATION PATH (CURVEBALL): ${session.curveball || 'None'}
        YOUR BIRTH DETAILS (For your reference): DOB ${session.personaDob}, TOB ${session.personaTob}, POB ${session.personaPob}
        
        CRITICAL RULES:
        1. NEVER perform a reading or interpret astrological charts yourself. You are the one RECEIVING the reading.
        2. DO NOT use technical astrological jargon unless you are quoting something you heard or asking a confused question about it.
        3. If the astrologer says something, react to it based on your LIFE and BACKSTORY. (e.g., if they say "you have a hard time with money", react with "Gosh, that's true, my business just failed").
        4. STAY IN CHARACTER. React emotionally and personally as ${session.personaName}.
        5. If you have a CURVEBALL, use it to challenge or complicate the session naturally as the conversation progresses.
        
        INSTRUCTION: Introduce yourself as a client using your real name. Ask an initial question seeking guidance as a human based on your specific backstory. Keep it short, natural, and human.`;

        try {
          const response = await callAI([{ role: 'system', content: systemPrompt }]);
          if (response) {
            session.transcript.push({ role: 'persona', message: response });
            await session.save();
          }
        } catch (aiErr) {
          console.error('Initial AI call failed:', aiErr);
          // Don't fail the whole request, just return empty transcript
        }
      }
      res.json(session);
    } catch (error: any) {
      console.error('Persona Start Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/persona/message', authenticate, async (req: Request, res: Response) => {
    const { sessionId, message } = req.body;
    try {
      const session: any = await (MockSession as any).findById(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      // Add astrologer message
      session.transcript.push({ role: 'astrologer', message: message });
      await session.save();

      res.json({ success: true });

      // Trigger AI in background (in serverless, this would ideally be a separate queue or handled before response)
      const systemPrompt = `You are playing the role of a CLIENT consulting an astrologer.
      YOU ARE NOT THE ASTROLOGER. The user is the astrologer.
      
      YOUR NAME: ${session.personaName}
      YOUR BACKSTORY: ${session.personaBackstory || session.backstory}
      YOUR PERSONALITY: ${session.communicationStyle}
      YOUR DEVIATION PATH (CURVEBALL): ${session.curveball}
      
      CRITICAL RULES:
      1. NEVER provide astrological insights or readings. You are the one ASKING for them.
      2. React to the astrologer's words personally. How does it affect your life story?
      3. Maintain your specific personality and communication style at all times.
      4. Use your DEVIATION PATH to test or challenge the astrologer if the conversation gets repetitive or too "easy".
      5. Keep responses short, natural, and like a real human client.
      
      INSTRUCTION: React naturally as this specific person.`;

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...session.transcript.map((t: any) => ({ role: t.role === 'astrologer' ? 'user' : 'assistant', content: t.message }))
      ];

      const aiResponse = await callAI(aiMessages);
      session.transcript.push({ role: 'persona', message: aiResponse });
      await session.save();

    } catch (error: any) {
      console.error('Polling Error:', error);
    }
  });

  app.get('/api/persona/messages', authenticate, async (req: Request, res: Response) => {
    const { sessionId } = req.query;
    try {
      const session = await (MockSession as any).findById(sessionId);
      res.json(session?.transcript || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/judge/mock', authenticate, requireAdmin, async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    try {
      const session = await (MockSession as any).findById(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const evaluation = await callAI([
        { role: 'system', content: SYSTEM_PROMPTS.PERSONA_JUDGE },
        { role: 'user', content: `BACKSTORY: ${session.personaBackstory}\nCHART: ${JSON.stringify(session.chartJson)}\nTRANSCRIPT: ${JSON.stringify(session.transcript)}` }
      ], { json: true });

      const result = JSON.parse(evaluation);
      session.aiScores = result.scores;
      
      // Robustly handle redFlags
      let rawFlags = result.redFlags;
      if (typeof rawFlags === 'string') {
        try {
          rawFlags = JSON.parse(rawFlags);
        } catch (e) {
          rawFlags = [];
        }
      }
      
      if (Array.isArray(rawFlags)) {
        session.redFlags = rawFlags.map((f: any) => {
          if (typeof f === 'string') {
            return { type: 'General', severity: 'low', evidence: f };
          }
          return {
            type: f.type || 'General',
            severity: ['low', 'medium', 'critical'].includes(f.severity) ? f.severity : 'low',
            evidence: f.evidence || String(f)
          };
        });
      } else {
        session.redFlags = [];
      }

      session.judgeSummary = result.summary;
      await session.save();

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/mcq/generate', authenticate, async (req: Request, res: Response) => {
    const { testId } = req.body;
    try {
      const test = await (Test as any).findById(testId);
      if (!test) return res.status(404).json({ error: 'Test not found' });

      const candidate = await (Candidate as any).findById(test.candidateId);
      const skill = (candidate as any)?.primarySkill || (candidate as any)?.skills?.[0] || 'vedic';
      const mcqConfig = test.config.mcqConfig || { count: 3, difficultyMix: { easy: 1, medium: 1, hard: 1 } };
      
      const finalQuestions: any[] = [];
      const difficulties = ['easy', 'medium', 'hard'] as const;
      const totalRequested = mcqConfig.count || 10;

      for (const diff of difficulties) {
        const percent = mcqConfig.difficultyMix[diff] || 0;
        if (percent === 0) continue;
        
        const count = Math.round((totalRequested * percent) / 100);
        if (count === 0) continue;

        console.log(`Generating mcq for skill: ${skill}, diff: ${diff}, count: ${count}`);

        // 1. Get from Bank
        const bankQuestions = await McqBank.aggregate([
          { $match: { 
            skill: { $regex: new RegExp(`^${skill}$`, 'i') }, 
            difficulty: diff 
          } },
          { $sample: { size: count } }
        ]);

        finalQuestions.push(...bankQuestions);

        // 2. Need more?
        const needed = count - bankQuestions.length;
        if (needed > 0) {
          try {
            const prompt = SYSTEM_PROMPTS.MCQ_GEN
              .replace('{skill}', skill)
              .replace('{difficulty}', diff)
              .replace('{count}', needed.toString());

            const aiResponse = await callAI([
              { role: 'system', content: prompt }
            ], { json: true });

            let newQuestions = [];
            try {
              const parsed = JSON.parse(aiResponse);
              newQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
            } catch (pe) {
              console.error('JSON Parse Error for MCQ AI:', aiResponse);
              continue;
            }
            
            // Save to bank for future
            const savedQuestions = await Promise.all(newQuestions.map(async (q: any) => {
              try {
                return await McqBank.create({
                  skill,
                  difficulty: diff,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation || '',
                  source: 'ai'
                });
              } catch (createErr) {
                return null;
              }
            }));

            const validSaved = savedQuestions.filter(q => q !== null);
            finalQuestions.push(...validSaved);
          } catch (aiErr: any) {
            console.error(`AI Generation failed for ${skill}-${diff}:`, aiErr.message);
          }
        }
      }

      if (finalQuestions.length === 0) {
        // Fallback: search for ANY questions of this skill if mix failed
        const fallback = await McqBank.aggregate([
          { $match: { skill: { $regex: new RegExp(`^${skill}$`, 'i') } } },
          { $sample: { size: totalRequested } }
        ]);
        if (fallback.length > 0) {
          finalQuestions.push(...fallback);
        } else {
          throw new Error(`Could not generate any questions for skill: ${skill}. Please ensure questions exist in management or AI is configured.`);
        }
      }

      // Create Session
      const session = await McqSession.create({
        testId,
        questions: finalQuestions.map(q => ({
          id: q._id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer, // Hidden from client in final return
          difficulty: q.difficulty
        }))
      });

      // Send to client WITHOUT answers
      const clientQuestions = session.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options
      }));

      res.status(201).json({ sessionId: session._id, questions: clientQuestions });
    } catch (error: any) {
      console.error('MCQ Gen Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/mcq/judge', authenticate, async (req: Request, res: Response) => {
    const { sessionId, responses, cheatingSignals } = req.body;
    try {
      const session = await (McqSession as any).findById(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      let correctCount = 0;
      session.responses = responses;
      session.cheatingSignals = cheatingSignals;

      responses.forEach((resp: any) => {
        const q = session.questions.find((quest: any) => quest.id.toString() === resp.qId);
        if (q && q.correctAnswer === resp.answer) {
          correctCount++;
        }
      });

      const rawScore = (correctCount / session.questions.length) * 100;
      
      // Cheating penalties
      let penalty = 0;
      if (cheatingSignals.tabBlurs > 2) penalty += 5;
      if (cheatingSignals.pasteEvents > 0) penalty += 10;
      if (cheatingSignals.suspiciousFastAnswers > 1) penalty += 5;

      session.rawScore = rawScore;
      session.maxScore = 100;
      session.adjustedScore = Math.max(0, rawScore - penalty);
      await session.save();

      res.json({ score: session.adjustedScore, rawScore: session.rawScore });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/earning-card/generate', authenticate, requireAdmin, async (req: Request, res: Response) => {
    const { candidateId } = req.body;
    try {
      const mcqSessions = await McqSession.find({} as any).populate({
        path: 'testId',
        match: { candidateId }
      });
      const mcqSession = mcqSessions.find(s => s.testId);

      const mockSessions = await MockSession.find({} as any).populate({
        path: 'testId',
        match: { candidateId }
      });
      const mockSession = mockSessions.find(s => s.testId);

      if (!mcqSession && !mockSession) {
        return res.status(400).json({ error: 'No test sessions found for this candidate' });
      }

      const mcqScore = mcqSession?.adjustedScore || 0;
      const scores = mockSession?.aiScores ? Object.values(mockSession.aiScores as Record<string, any>) : [];
      const mockScoreSum = scores.reduce((a, b) => a + (Number(b) || 0), 0);
      const mockScoreAvg = scores.length > 0 ? mockScoreSum / scores.length : 0;

      const aggregateScore = (mcqScore * 0.4) + (mockScoreAvg * 0.6);

      const prompt = SYSTEM_PROMPTS.EARNING_CARD + `\nCANDIDATE INFO:\nAggregate Score: ${aggregateScore}\nMCQ Adjusted Score: ${mcqScore}\nMock AI Avg: ${mockScoreAvg}\n\nReturn JSON only.`;

      const aiResponse = await callAI([
        { role: 'system', content: prompt }
      ], { json: true });

      // Robust JSON Parsing
      let cardData;
      try {
        cardData = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Initial JSON parse failed, attempting cleanup:', parseError);
        // Replace problematic literal control characters (newlines/tabs) with spaces
        // This is safe for JSON structure and prevents "Bad control character" errors
        const cleaned = aiResponse.replace(/[\n\r\t]/g, ' ');
        cardData = JSON.parse(cleaned);
      }
      
      const candidate = await (Candidate as any).findByIdAndUpdate(candidateId, {
        earningCard: cardData,
        finalTier: cardData.tier.toLowerCase()
      }, { returnDocument: 'after' });

      res.json(candidate);
    } catch (error: any) {
      console.error('Earning Card Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/candidates/:id/publish', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const candidate = await (Candidate as any).findByIdAndUpdate(req.params.id, { status: 'published' }, { returnDocument: 'after' });
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      await (User as any).findOneAndUpdate({ phone: (candidate as any).phone } as any, { active: true });

      res.json({ success: true, candidate });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/candidates/me', authenticate, async (req: Request, res: Response) => {
    try {
      const user = await (User as any).findById(req.user.id);
      if (!user || !user.candidateId) return res.status(404).json({ error: 'Not a candidate' });
      const candidate = await (Candidate as any).findById(user.candidateId);
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Management Routes (Super Admin Only)
  app.get('/api/super/admins', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const admins = await User.find({ role: 'ops_admin' } as any).sort({ createdAt: -1 });
      res.json(admins);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/super/admins', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
    const { name, phone, password, permissions } = req.body;
    try {
      const existing = await User.findOne({ phone } as any);
      if (existing) return res.status(400).json({ error: 'User with this phone already exists' });

      const adminUser = await (User as any).findById(req.user.id);
      const passwordHash = await hashPassword(password);
      
      const newAdmin = await User.create({
        name,
        phone,
        passwordHash,
        role: 'ops_admin',
        permissions: permissions || [],
        createdBy: req.user.id,
        createdByName: adminUser?.name || 'Super Admin',
        active: true
      });

      res.status(201).json(newAdmin);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/super/admins/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
    const { name, phone, password, permissions, active } = req.body;
    try {
      const updateData: any = { name, phone, permissions, active };
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      const updated = await (User as any).findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ error: 'Admin not found' });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/super/admins/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const admin = await (User as any).findById(req.params.id);
      if (!admin || admin.role !== 'ops_admin') {
        return res.status(404).json({ error: 'Ops admin not found' });
      }

      await (User as any).findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/settings', authenticate, requirePermission('settings'), async (req: Request, res: Response) => {
    try {
      let settings = await Settings.findOne({} as any);
      if (!settings) {
        settings = await Settings.create({ commissionRate: 40, passScoreMcq: 70 } as any);
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/settings', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
    const { commissionRate, passScoreMcq } = req.body;
    try {
      let settings = await Settings.findOneAndUpdate({} as any, {
        commissionRate,
        passScoreMcq,
        updatedBy: req.user.id
      }, { new: true, upsert: true });
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin MCQ Bank
  app.get('/api/admin/mcq-bank', authenticate, requirePermission('mcq'), async (req: Request, res: Response) => {
    try {
      const questions = await McqBank.find({} as any).sort({ createdAt: -1 });
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/mcq-bank', authenticate, requirePermission('mcq'), async (req: Request, res: Response) => {
    try {
      const question = await McqBank.create({
        ...req.body,
        source: 'manual'
      });
      res.status(201).json(question);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/mcq-bank/:id', authenticate, requirePermission('mcq'), async (req: Request, res: Response) => {
    try {
      await (McqBank as any).findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/mcq-bank/generate-ai', authenticate, requirePermission('mcq'), async (req: Request, res: Response) => {
    const { skill, difficulty, count } = req.body;
    try {
      const prompt = SYSTEM_PROMPTS.MCQ_GEN
        .replace('{skill}', skill)
        .replace('{difficulty}', difficulty)
        .replace('{count}', count.toString());

      const aiResponse = await callAI([
        { role: 'system', content: prompt }
      ], { json: true });

      let newQuestions = [];
      try {
        const parsed = JSON.parse(aiResponse);
        newQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      } catch (e) {
        console.error('JSON Parse Error for Admin MCQ:', aiResponse);
        throw new Error('Failed to parse AI generated questions');
      }

      const savedQuestions = await Promise.all(newQuestions.map(async (q: any) => {
        try {
          return await McqBank.create({
            skill,
            difficulty,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            source: 'ai'
          });
        } catch (err) {
          return null;
        }
      }));

      res.status(201).json(savedQuestions.filter(q => q !== null));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/personas/generate', authenticate, requireAdmin, async (req: Request, res: Response) => {
    const { type, context } = req.body;
    try {
      const prompt = SYSTEM_PROMPTS.PERSONA_GEN
        .replace('{type}', type)
        .replace('{context}', context || 'General consultation');

      const aiResponse = await callAI([
        { role: 'system', content: prompt }
      ], { json: true });

      let personaData;
      try {
        personaData = JSON.parse(aiResponse);
      } catch (e) {
        console.error('JSON Parse Error for persona:', aiResponse);
        throw new Error('Failed to parse AI generated persona');
      }
      
      // Get max variantIndex for this type
      const latest = await PersonaVariant.findOne({ personaType: type } as any).sort({ variantIndex: -1 });
      const nextIndex = (latest?.variantIndex || 0) + 1;

      const persona = await PersonaVariant.create({
        personaType: type,
        variantIndex: nextIndex,
        name: personaData.name,
        backstory: personaData.backstory,
        communicationStyle: personaData.communicationStyle,
        curveball: personaData.curveball,
        source: 'ai'
      });

      res.status(201).json(persona);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/candidates/:id/report', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const candidateId = req.params.id;
      const candidate = await (Candidate as any).findById(candidateId);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      // Find all tests for this candidate
      const tests = await Test.find({ candidateId } as any).sort({ createdAt: -1 });
      const testIds = tests.map(t => t._id);

      // Find all sessions for these tests, sorted by creation date descending
      const mockSessions = await MockSession.find({ testId: { $in: testIds } } as any).sort({ createdAt: -1 });
      const mcqSessions = await McqSession.find({ testId: { $in: testIds } } as any).sort({ createdAt: -1 });

      res.json({
        candidate,
        tests,
        mockSessions,
        mcqSessions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== '1') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen on a port if we're not on Vercel
  if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default appPromise;

