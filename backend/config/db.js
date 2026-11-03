const { Pool } = require("pg");

// Create a PostgreSQL connection pool
const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Check database connection
db.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL connection failed:", err.message);
    return;
  }

  console.log("PostgreSQL Database Connected Successfully!");

  release();
});

module.exports = db;