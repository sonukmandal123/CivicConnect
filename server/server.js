require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectCloudinary } = require('./config/cloudinary');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const helmet = require('helmet');

// Connect to database & Cloudinary
connectDB();
connectCloudinary();

const app = express();

// Trust reverse proxy (needed for Render/Cloudflare/rate limiters)
app.set('trust proxy', 1);

// HTTP Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows image loading across origins
}));

// CORS Configuration - Allows deployed Vercel apps, previews, and local development
app.use(cors({
  origin: true, // Dynamically reflects requesting origin so Vercel, localhost, and preview domains work seamlessly
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body Parsers with strict size limits to prevent payload DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Error Handling Middlewares (must be at the bottom)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
