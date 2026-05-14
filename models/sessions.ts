import mongoose from 'mongoose';

const MockSessionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  personaType: String,
  personaVariantIndex: Number,
  personaBackstory: String,
  personaDob: Date,
  personaTob: String,
  personaPob: String,
  personaName: String,
  communicationStyle: String,
  curveball: String,
  chartJson: mongoose.Schema.Types.Mixed,
  transcript: [{
    role: { type: String, enum: ['persona', 'astrologer'] },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  durationSeconds: Number,
  messageCount: Number,
  aiScores: {
    knowledge: Number,
    communication: Number,
    empathy: Number,
    stability: Number,
    upsellTact: Number,
    methodAccuracy: Number
  },
  redFlags: [{
    type: String,
    severity: { type: String, enum: ['low', 'medium', 'critical'] },
    evidence: String
  }],
  judgeSummary: String,
}, { timestamps: true });

export const MockSession = mongoose.models.MockSession || mongoose.model('MockSession', MockSessionSchema);

const McqSessionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  questions: [mongoose.Schema.Types.Mixed],
  responses: [{
    qId: String,
    answer: String,
    timeTakenSec: Number
  }],
  rawScore: Number,
  adjustedScore: Number,
  maxScore: Number,
  cheatingSignals: {
    tabBlurs: { type: Number, default: 0 },
    pasteEvents: { type: Number, default: 0 },
    suspiciousFastAnswers: { type: Number, default: 0 },
    anomalyNotes: String
  },
}, { timestamps: true });

export const McqSession = mongoose.models.McqSession || mongoose.model('McqSession', McqSessionSchema);

const PersonaVariantSchema = new mongoose.Schema({
  personaType: { type: String, required: true },
  variantIndex: { type: Number, required: true },
  name: String,
  backstory: String,
  communicationStyle: String,
  curveball: String,
  language: String,
}, { timestamps: true });

export const PersonaVariant = mongoose.models.PersonaVariant || mongoose.model('PersonaVariant', PersonaVariantSchema);
