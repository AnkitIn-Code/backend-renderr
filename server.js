// ===============================
// 🌐 RBAC Backend Server (Express)
// ===============================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');

// Initialize App
const app = express();
const PORT = process.env.PORT || 6000;

// ===============================
// ✅ Middleware
// ===============================

// Allowed origins for CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://your-frontend.vercel.app' // ⚠️ Replace with your actual Vercel domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('❌ Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ===============================
// ✅ MongoDB Connection
// ===============================
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ===============================
// ✅ API Routes
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', usersRoutes);

// ===============================
// ✅ Health Check Endpoint
// ===============================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running and healthy 💪',
  });
});

// ===============================
// ✅ Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
});
