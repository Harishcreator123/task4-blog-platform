const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectDB, isMongooseConnected } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { postRepo } = require('./models');
const { seedDatabase } = require('./utils/seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve frontend static assets
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isMongooseConnected() ? 'MongoDB (Connected)' : 'Embedded Persistent Store',
    uptime: process.uptime(),
  });
});

// Seed endpoint for quick testing or resetting
app.post('/api/seed', async (req, res, next) => {
  try {
    await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Database seeded with sample users, posts, and comments!',
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// Fallback to frontend index.html for client-side navigation
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDir, 'index.html'));
  }
  next();
});

// 404 Handler for undefined API routes
app.use('/api', notFound);

// Centralized error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    // Auto seed if empty
    const checkPosts = await postRepo.find({ limit: 1 });
    if (!checkPosts.posts || checkPosts.posts.length === 0) {
      console.log('📝 Empty database detected. Populating with initial showcase posts and users...');
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 Blog Platform Server is running!`);
      console.log(`🌐 Local URL:  http://localhost:${PORT}`);
      console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database:   ${isMongooseConnected() ? 'MongoDB' : 'Embedded Persistent Store'}`);
      console.log(`=================================================\n`);
    });

    return server;
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
