const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const errorHandler = require('./middleware/error');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const saleRoutes = require('./routes/saleRoutes');
const companySettingsRoutes = require('./routes/companySettingsRoutes');
const path = require('path');
const connectDB = require('./database/db.config.js');
const accountRoutes = require('./routes/account.routes');

const app = express();

// Middleware
app.use(express.json());

const allowedOrigins = [
  'http://192.168.17.185:3000',
  'http://localhost:3000',
  'http://localhost:5173'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Connect to the database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/customers', customerRoutes);
app.use('/api/livestock', require('./routes/livestock'));
app.use('/api/products', productRoutes);
app.use('/api/daybook', require("./routes/dayBookRoutes"));
app.use('/api/sales', saleRoutes);
app.use('/api/company-settings', companySettingsRoutes);
app.use("/api/accounts", accountRoutes);
app.use('/api/purchases', require('./routes/purchase.routes'));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

//serve static files

app.use('/invoices', express.static(path.join(__dirname, 'public/invoices')));
// Handle unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});