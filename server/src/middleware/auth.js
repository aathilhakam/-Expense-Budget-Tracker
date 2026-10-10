import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.finora_session;
  if (!token) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.clearCookie('finora_session', { httpOnly: true, sameSite: 'lax', path: '/' });
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }

  const user = await User.findById(payload.sub).select('_id name email preferredCurrency');
  if (!user) {
    res.clearCookie('finora_session', { httpOnly: true, sameSite: 'lax', path: '/' });
    return res.status(401).json({ message: 'This account is no longer available.' });
  }

  req.user = user;
  next();
});
