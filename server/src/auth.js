import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

// In-memory user store (replace with database in production)
const users = new Map();

// Default admin user for initial setup
const DEFAULT_USER = {
  id: 'admin',
  username: 'admin',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
  role: 'admin',
  createdAt: new Date().toISOString()
};

users.set('admin', DEFAULT_USER);

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'deckmind-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Passport Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'username', passwordField: 'password' },
  async (username, password, done) => {
    try {
      const user = users.get(username);
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

// Authentication middleware
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin-only middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Hash password
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// User management functions
export const createUser = async (username, password, role = 'user') => {
  if (users.has(username)) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const user = {
    id: username,
    username,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };

  users.set(username, user);
  return user;
};

export const getUser = (username) => {
  return users.get(username);
};

export const getAllUsers = () => {
  return Array.from(users.values()).map(user => ({
    ...user,
    password: undefined // Don't expose passwords
  }));
};

export const updateUser = async (username, updates) => {
  const user = users.get(username);
  if (!user) {
    throw new Error('User not found');
  }

  if (updates.password) {
    updates.password = await hashPassword(updates.password);
  }

  const updatedUser = { ...user, ...updates };
  users.set(username, updatedUser);
  return { ...updatedUser, password: undefined };
};

export const deleteUser = (username) => {
  if (username === 'admin') {
    throw new Error('Cannot delete admin user');
  }
  return users.delete(username);
};

// Initialize default user if not exists
export const initDefaultUser = () => {
  if (!users.has('admin')) {
    users.set('admin', DEFAULT_USER);
    console.log('Default admin user created (username: admin, password: password)');
  }
};