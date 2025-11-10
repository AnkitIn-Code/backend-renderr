const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Registration route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = User.getAdminEmail();

  // Check if registering as admin
  if (email === adminEmail) {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail, role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ error: 'Admin already exists.' });
    }
    // Register as admin
    const user = new User({ email, password, role: 'admin' });
    await user.save();
    return res.status(201).json({ message: 'Admin registered successfully.' });
  }

  // Prevent registration as editor/admin
  if (req.body.role && req.body.role !== 'user') {
    return res.status(400).json({ error: 'Cannot register as editor or admin.' });
  }

  // Register as user
  const user = new User({ email, password, role: 'user' });
  await user.save();
  res.status(201).json({ message: 'User registered successfully.' });
});

// Admin changes user role
router.post('/change-role', async (req, res) => {
  const { adminEmail, targetEmail, newRole } = req.body;
  const adminUser = await User.findOne({ email: adminEmail, role: 'admin' });
  if (!adminUser) {
    return res.status(403).json({ error: 'Only admin can change roles.' });
  }
  if (!['user', 'editor'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  const targetUser = await User.findOne({ email: targetEmail });
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }
  targetUser.role = newRole;
  await targetUser.save();
  res.json({ message: 'Role updated.' });
});

module.exports = router;