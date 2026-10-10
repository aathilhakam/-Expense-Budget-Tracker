import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, preferredCurrency: req.user.preferredCurrency } });
};

export const updateProfile = asyncHandler(async (req, res) => {
  req.user.name = req.body.name.trim();
  req.user.preferredCurrency = req.body.preferredCurrency;
  await req.user.save();
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, preferredCurrency: req.user.preferredCurrency } });
});
