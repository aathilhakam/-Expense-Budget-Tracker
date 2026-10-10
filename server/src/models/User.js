import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    preferredCurrency: { type: String, enum: ['LKR', 'USD', 'EUR', 'GBP'], default: 'LKR' },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
