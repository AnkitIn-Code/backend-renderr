const express = require('express');
const User = require('../models/User');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, checkRole('Admin'), async (req, res) => {
  try {
    const users = await User.find({}, 'username email role editorRequest');
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Unable to fetch users' });
  }
});

// Viewer: request editor access
router.post('/request-editor', authenticate, checkRole('Viewer'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.editorRequest.status === 'pending') {
      return res.status(400).json({ error: 'Editor request already pending' });
    }

    user.editorRequest.status = 'pending';
    user.editorRequest.requestedAt = new Date();
    await user.save();

    res.json({ message: 'Editor access requested' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request editor access', details: error.message });
  }
});

// Admin: list pending editor requests
router.get('/editor-requests', authenticate, checkRole('Admin'), async (req, res) => {
  try {
    const requests = await User.find({ 'editorRequest.status': 'pending' }, 'username email role editorRequest');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests', details: error.message });
  }
});

// Admin: approve editor request
router.post('/editor-requests/:userId/approve', authenticate, checkRole('Admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.editorRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending request for this user' });
    }

    user.role = 'Editor';
    user.editorRequest.status = 'approved';
    user.editorRequest.reviewedAt = new Date();
    user.editorRequest.reviewedBy = req.userId;
    await user.save();

    res.json({ message: 'Editor access approved', user: { id: user._id, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve request', details: error.message });
  }
});

// Admin: reject editor request
router.post('/editor-requests/:userId/reject', authenticate, checkRole('Admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.editorRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending request for this user' });
    }

    user.editorRequest.status = 'rejected';
    user.editorRequest.reviewedAt = new Date();
    user.editorRequest.reviewedBy = req.userId;
    await user.save();

    res.json({ message: 'Editor access rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject request', details: error.message });
  }
});

module.exports = router;
