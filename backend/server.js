const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Connect to MongoDB
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.log('❌ Primary MongoDB connection failed. Starting in-memory fallback database...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB In-Memory DB (Fallback)');
    } catch (inMemErr) {
      console.log('❌ Could not start in-memory fallback DB:', inMemErr);
    }
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

startServer();
