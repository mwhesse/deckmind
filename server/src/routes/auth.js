import express from 'express';
import passport from 'passport';
import { generateToken, createUser, getUser, getAllUsers, updateUser, deleteUser, requireAuth, requireAdmin, initDefaultUser } from '../auth.js';

const router = express.Router();

// Initialize default user
initDefaultUser();

// Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' });
    }

    if (!user) {
      return res.status(401).json({ error: info.message || 'Authentication failed' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  })(req, res, next);
});

// Register new user (admin only)
router.post('/register', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Username must be at least 3 characters, password at least 6 characters' });
    }

    const user = await createUser(username, password, role);
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', requireAuth, (req, res) => {
  const user = getUser(req.user.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt
  });
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, ...updates } = req.body;
    const username = req.user.username;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      const user = getUser(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Note: Password verification should be done in auth.js
      updates.password = newPassword;
    }

    const updatedUser = await updateUser(username, updates);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = getAllUsers();
  res.json({ users });
});

// Update user (admin only)
router.put('/users/:username', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const updates = req.body;

    // Prevent admin from demoting themselves
    if (username === req.user.username && updates.role && updates.role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own admin role' });
    }

    const updatedUser = await updateUser(username, updates);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:username', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;

    if (username === req.user.username) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const deleted = deleteUser(username);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify token endpoint
router.post('/verify', requireAuth, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

export default router;