
const express = require("express");
const router = express.Router();

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminmiddleware");
const verifyToken = require("../middleware/authmiddleware");


// POST /api/orders - Place a new order
router.post("/", verifyToken, async (req, res) => {
  const {
    full_name,
    phone,
    address,
    city,
    state,
    postal_code,
  } = req.body;

  if (
    !full_name ||
    !phone ||
    !address ||
    !city ||
    !state ||
    !postal_code
  ) {
    return res.status(400).json({
      message: "All delivery details are required",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Get the logged-in customer's cart
    const cartResult = await client.query(
      `SELECT
          ci.product_id,
          ci.quantity,
          p.name,
          p.price,
          p.stock
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       JOIN products p ON ci.product_id = p.id
       WHERE c.user_id = $1
       FOR UPDATE OF p`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Your cart is empty",
      });
    }

    // Validate stock and calculate the total using database prices
    let totalAmount = 0;

    for (const item of cartResult.rows) {
      if (item.quantity > item.stock) {
        throw new Error(
          `Insufficient stock for ${item.name}`
        );
      }

      totalAmount +=
        Number(item.price) * Number(item.quantity);
    }

    // Create the order
    const orderResult = await client.query(
      `INSERT INTO orders
       (
         user_id,
         full_name,
         phone,
         address,
         city,
         state,
         postal_code,
         total_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        full_name,
        phone,
        address,
        city,
        state,
        postal_code,
        totalAmount.toFixed(2),
      ]
    );

    const order = orderResult.rows[0];

    // Save each product in the order
    for (const item of cartResult.rows) {
      const subtotal =
        Number(item.price) * Number(item.quantity);

      await client.query(
        `INSERT INTO order_items
         (
           order_id,
           product_id,
           product_name,
           unit_price,
           quantity,
           subtotal
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.product_id,
          item.name,
          item.price,
          item.quantity,
          subtotal.toFixed(2),
        ]
      );

      // Reduce product stock
      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Clear the customer's cart
    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id IN (
         SELECT id FROM carts WHERE user_id = $1
       )`,
      [req.user.id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Place order error:", err.message);

    return res.status(500).json({
      message: err.message || "Failed to place order",
    });
  } finally {
    client.release();
  }
});

// GET /api/orders/my-orders - Get logged-in customer's orders
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
          id,
          total_amount,
          status,
          created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      message: "Orders fetched successfully",
      orders: result.rows,
    });
  } catch (err) {
    console.error("Fetch customer orders error:", err.message);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});


// GET /api/orders/admin/all - Get all orders (Admin only)
router.get(
  "/admin/all",
  verifyToken,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
            o.id,
            o.user_id,
            u.name AS customer_name,
            u.email AS customer_email,
            o.total_amount,
            o.status,
            o.created_at
         FROM orders o
         JOIN users u ON o.user_id = u.id
         ORDER BY o.created_at DESC`
      );

      res.status(200).json({
        message: "All orders fetched successfully",
        orders: result.rows,
      });
    } catch (err) {
      console.error("Admin fetch orders error:", err.message);

      res.status(500).json({
        message: "Failed to fetch all orders",
      });
    }
  }
);

// GET /api/orders/:id - Get details of one customer's order
router.get("/:id", verifyToken, async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: "Invalid order ID",
    });
  }

  try {
    const orderResult = await db.query(
      `SELECT *
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const itemsResult = await db.query(
      `SELECT
          product_name,
          unit_price,
          quantity,
          subtotal
       FROM order_items
       WHERE order_id = $1`,
      [orderId]
    );

    res.status(200).json({
      message: "Order details fetched successfully",
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (err) {
    console.error("Fetch order details error:", err.message);

    res.status(500).json({
      message: "Failed to fetch order details",
    });
  }
});
// PUT /api/orders/:id/status - Update order status (Admin only)
router.put(
  "/:id/status",
  verifyToken,
  adminMiddleware,
  async (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    let client;

    try {
      client = await db.connect();

      await client.query("BEGIN");

      // Lock the order while its status is being changed
      const orderResult = await client.query(
        `SELECT *
         FROM orders
         WHERE id = $1
         FOR UPDATE`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Order not found",
        });
      }

      const currentOrder = orderResult.rows[0];

      // Do not allow changes after an order is cancelled
      if (currentOrder.status === "Cancelled") {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "A cancelled order cannot be updated",
        });
      }

      // Do not cancel an order that has already been delivered
      if (
        status === "Cancelled" &&
        currentOrder.status === "Delivered"
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "A delivered order cannot be cancelled",
        });
      }

      // Restore stock when an order is cancelled
      if (status === "Cancelled") {
        await client.query(
          `UPDATE products p
           SET stock = p.stock + oi.quantity
           FROM order_items oi
           WHERE oi.order_id = $1
             AND oi.product_id = p.id`,
          [orderId]
        );
      }

      // Update the order status
      const updateResult = await client.query(
        `UPDATE orders
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, orderId]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Order status updated successfully",
        order: updateResult.rows[0],
      });
    } catch (err) {
      if (client) {
        await client.query("ROLLBACK");
      }

      console.error("Update order status error:", err.message);

      return res.status(500).json({
        message: "Failed to update order status",
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

module.exports = router;
