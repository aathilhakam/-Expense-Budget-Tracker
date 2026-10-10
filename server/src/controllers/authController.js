import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cookieOptions } from '../middleware/auth.js';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  preferredCurrency: user.preferredCurrency,
});

function setSession(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie('finora_session', token, cookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash });
  setSession(res, user);
  return res.status(201).json({ user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  setSession(res, user);
  return res.json({ user: publicUser(user) });
});

export const currentUser = (req, res) => res.json({ user: publicUser(req.user) });

export const logout = (req, res) => {
  res.clearCookie('finora_session', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  });
  res.status(204).end();
};
