const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db'); // Import MongoDB connection
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;
const cors = require('cors');

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all origins
app.use(express.json());
// Connect to MongoDB
connectDB();

// API Routes
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
