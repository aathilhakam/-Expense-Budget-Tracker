import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amountCents: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 160, default: '' },
    date: { type: Date, required: true },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, category: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
