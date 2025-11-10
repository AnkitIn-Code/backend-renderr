const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies.token || 
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                  ? req.headers.authorization.split(' ')[1] 
                  : null);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      next();
    } catch (tokenError) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication error', details: error.message });
  }
};

// Check if user has required role(s)
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'Access denied. Role information not available.' });
    }

    if (allowedRoles.includes(req.userRole)) {
      next();
    } else {
      res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.userRole
      });
    }
  };
};

// Check if user owns the resource or is an Admin
const checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      // Admins can bypass ownership check
      if (req.userRole === 'Admin') {
        return next();
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required.' });
      }

      const Resource = require(`../models/${resourceModel}`);
      const resource = await Resource.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ error: `${resourceModel} not found.` });
      }

      // Check if the user is the owner
      const resourceAuthorId = resource.authorId ? resource.authorId.toString() : null;
      const userId = req.userId ? req.userId.toString() : null;

      if (resourceAuthorId === userId) {
        next();
      } else {
        res.status(403).json({ 
          error: 'Access denied. You can only modify your own resources.',
          message: 'Ownership check failed'
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Ownership verification error', details: error.message });
    }
  };
};

module.exports = {
  authenticate,
  checkRole,
  checkOwnership
};

