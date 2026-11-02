const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");

// Load environment variables
dotenv.config();

// Create an Express application
const app = express();

// Get port from .env
const PORT = process.env.PORT || 5000;


// Middleware to read JSON data
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/api/products", productRoutes);

// First test route
app.get("/", (req, res) => {
  res.send("E-commerce backend is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});