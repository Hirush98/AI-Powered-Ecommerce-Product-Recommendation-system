const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect Database ─────────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/users',           require('./routes/users'));
app.use('/api/products',        require('./routes/products'));
app.use('/api/purchases',       require('./routes/purchases'));
app.use('/api/interactions',    require('./routes/interactions'));
app.use('/api/recommendations', require('./routes/recommendations'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]
📡 Health:           http://localhost:${PORT}/api/health
🔐 Auth:             http://localhost:${PORT}/api/auth
👤 Users:            http://localhost:${PORT}/api/users
📦 Products:         http://localhost:${PORT}/api/products
🛒 Purchases:        http://localhost:${PORT}/api/purchases
💡 Recommendations:  http://localhost:${PORT}/api/recommendations
  `);
});

module.exports = app;
