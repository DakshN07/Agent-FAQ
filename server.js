const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const routes = require('./routes/index');
const authRoutes = require('./routes/auth'); // Auth routes might be separate or part of index
const integrationManager = require('./services/IntegrationManager');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agent-faq';
    await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected`);

    // Load integrations after successful DB connection
    await integrationManager.loadIntegrations();
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    // Non-blocking for now, let it run even if mongo fails initially
  }
};
connectDB();
// Use Routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});
