import mongoose from 'mongoose';

const McqBankSchema = new mongoose.Schema({
  skill: String,
  difficulty: String,
  questions: [mongoose.Schema.Types.Mixed],
}, { timestamps: true });

export const McqBank = mongoose.models.McqBank || mongoose.model('McqBank', McqBankSchema);

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  entity: String,
  entityId: mongoose.Schema.Types.ObjectId,
  payload: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

const ApiUsageSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  count: { type: Number, default: 0 },
});

export const ApiUsage = mongoose.models.ApiUsage || mongoose.model('ApiUsage', ApiUsageSchema);

const ScoreSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  category: String,
  score: { type: Number, min: 0, max: 100 },
  notes: String,
  source: { type: String, enum: ['ai', 'ops'] },
}, { timestamps: true });

export const Score = mongoose.models.Score || mongoose.model('Score', ScoreSchema);
