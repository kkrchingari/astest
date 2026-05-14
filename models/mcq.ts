import mongoose from 'mongoose';

const McqBankSchema = new mongoose.Schema({
  skill: { type: String, required: true, index: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: String,
  source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

export const McqBank = mongoose.models.McqBank || mongoose.model('McqBank', McqBankSchema);
