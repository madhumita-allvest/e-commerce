
const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");

const db = require("../config/db");
const verifyToken = require("../middleware/authmiddleware");
const adminMiddleware = require("../middleware/adminmiddleware");

// ==========================================
// ADMIN AUTHENTICATION
// All routes below require an authenticated admin
// ==========================================

router.use(verifyToken, adminMiddleware);


// ==========================================
// 1. GET ADMIN DASHBOARD STATISTICS
// ==========================================

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [
      productsResult,
      customersResult,
      ordersResult,
      salesResult,
      adminsResult,
    ] = await Promise.all([
      db.query("SELECT COUNT(*) FROM products"),

      db.query(
        "SELECT COUNT(*) FROM users WHERE role = 'customer'"
      ),

      db.query("SELECT COUNT(*) FROM orders"),

      db.query(`
        SELECT COALESCE(SUM(total_amount), 0) AS total_sales
        FROM orders
        WHERE status <> 'Cancelled'
      `),

      db.query(
        "SELECT COUNT(*) FROM users WHERE role = 'admin'"
      ),
    ]);

    res.status(200).json({
      message: "Dashboard statistics fetched successfully",

      stats: {
        totalProducts: Number(productsResult.rows[0].count),
        totalCustomers: Number(customersResult.rows[0].count),
        totalOrders: Number(ordersResult.rows[0].count),
        totalSales: Number(salesResult.rows[0].total_sales),
        totalAdmins: Number(adminsResult.rows[0].count),
      },
    });

  } catch (error) {
    console.error("Dashboard statistics error:", error.message);

    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
    });
  }
});


// ==========================================
// 2. GET ALL CUSTOMERS
// ==========================================

router.get("/customers", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,

        COUNT(o.id)::INTEGER AS total_orders,

        COALESCE(
          SUM(o.total_amount) FILTER (
            WHERE o.status <> 'Cancelled'
          ),
          0
        ) AS total_spent

      FROM users u

      LEFT JOIN orders o
        ON o.user_id = u.id

      WHERE u.role = 'customer'

      GROUP BY
        u.id,
        u.name,
        u.email,
        u.created_at

      ORDER BY u.created_at DESC
    `);

    res.status(200).json({
      message: "Customers fetched successfully",
      customers: result.rows,
    });

  } catch (error) {
    console.error("Customer listing error:", error.message);

    res.status(500).json({
      message: "Failed to fetch customers",
    });
  }
});


// ==========================================
// 3. GET CUSTOMER ORDER HISTORY
// ==========================================

router.get("/customers/:id/orders", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    // Validate customer ID
    if (
      !Number.isSafeInteger(customerId) ||
      customerId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    // Check whether customer exists
    const customerResult = await db.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1 AND role = 'customer'`,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Fetch customer's orders
    const ordersResult = await db.query(
      `
        SELECT
          id,
          created_at,
          total_amount,
          status

        FROM orders

        WHERE user_id = $1

        ORDER BY created_at DESC
      `,
      [customerId]
    );

    res.status(200).json({
      message: "Customer order history fetched successfully",

      customer: customerResult.rows[0],

      totalOrders: ordersResult.rows.length,

      orders: ordersResult.rows,
    });

  } catch (error) {
    console.error("Customer order history error:", error.message);

    res.status(500).json({
      message: "Failed to fetch customer order history",
    });
  }
});


// ==========================================
// 4. GET INDIVIDUAL CUSTOMER DETAILS
// ==========================================

router.get("/customers/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    // Validate customer ID
    if (
      !Number.isSafeInteger(customerId) ||
      customerId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    const result = await db.query(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.created_at,

          COUNT(o.id)::INTEGER AS total_orders,

          COALESCE(
            SUM(o.total_amount) FILTER (
              WHERE o.status <> 'Cancelled'
            ),
            0
          ) AS total_spent

        FROM users u

        LEFT JOIN orders o
          ON o.user_id = u.id

        WHERE u.id = $1
          AND u.role = 'customer'

        GROUP BY
          u.id,
          u.name,
          u.email,
          u.created_at
      `,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      message: "Customer details fetched successfully",
      customer: result.rows[0],
    });

  } catch (error) {
    console.error("Customer details error:", error.message);

    res.status(500).json({
      message: "Failed to fetch customer details",
    });
  }
});


// ==========================================
// 5. CREATE A NEW ADMIN ACCOUNT
// ==========================================

router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({
        message: "Name cannot be empty",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
        INSERT INTO users (
          name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, 'admin')

        RETURNING
          id,
          name,
          email,
          role,
          created_at
      `,
      [cleanName, cleanEmail, hashedPassword]
    );

    res.status(201).json({
      message: "Admin account created successfully",
      admin: result.rows[0],
    });

  } catch (error) {
    console.error("Admin creation error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    res.status(500).json({
      message: "Failed to create admin account",
    });
  }
});


module.exports = router;
