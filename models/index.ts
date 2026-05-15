import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'ops_admin', 'candidate'], required: true },
  active: { type: Boolean, default: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  lastLoginAt: { type: Date },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  languages: [String],
  skills: [{ type: String }],
  primarySkill: { type: String, default: 'vedic' },
  yearsExperience: { type: Number },
  status: { type: String, enum: ['invited', 'in_progress', 'completed', 'published', 'rejected'], default: 'invited' },
  opsNotes: { type: String },
  finalTier: { type: String, enum: ['junior', 'mid', 'senior', 'expert', 'rejected'] },
  earningCard: {
    tier: String,
    suggestedRatePerMin: Number,
    projectedMonthlyEarnings: {
      low: Number,
      mid: Number,
      high: Number
    },
    conditions: [String],
    growthPath: String,
    pitch: String
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);

const TestSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  testType: { type: String, enum: ['mock_consult', 'mcq', 'both'], required: true },
  order: { type: String, enum: ['mock_first', 'mcq_first'] },
  status: { type: String, enum: ['pending', 'active', 'completed', 'expired'], default: 'pending' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  config: {
    personas: [{
      personaType: String,
      variantIndex: Number,
      useRandomDob: Boolean,
      dob: Date,
      tob: String,
      pob: String,
      name: String
    }],
    mcqConfig: {
      count: Number,
      difficultyMix: {
        easy: Number,
        medium: Number,
        hard: Number
      }
    }
  },
  browserFingerprint: String,
  ipAddress: String,
}, { timestamps: true });

export const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);

const SettingsSchema = new mongoose.Schema({
  commissionRate: { type: Number, default: 40 },
  passScoreMcq: { type: Number, default: 70 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
