const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register new user
router.post('/register', async (req, res) => {
  try {
  const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

  // Always register users as Viewer by default. Do not allow creating Admin or Editor via registration.
  const userRole = 'Viewer';

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: userRole
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        editorRequest: user.editorRequest?.status ? { status: user.editorRequest.status } : { status: 'none' }
      },
      token // Also send token in response for flexibility
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        editorRequest: user.editorRequest?.status ? { status: user.editorRequest.status } : { status: 'none' }
      },
      token // Also send token in response
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get current user (protected route)
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      editorRequest: user.editorRequest?.status ? { status: user.editorRequest.status } : { status: 'none' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

module.exports = router;

