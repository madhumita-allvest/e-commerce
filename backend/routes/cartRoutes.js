const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyToken = require("../middleware/authmiddleware");

// ADD product to customer's cart
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id;

    // Validate product ID and quantity
    if (!product_id || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Valid product ID and positive quantity are required"
      });
    }

    // Check whether product exists
    const productResult = await db.query(
      "SELECT id, stock FROM products WHERE id = $1",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];

    // Find or create customer's cart
    let cartResult = await db.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [user_id]
    );

    let cart_id;

    if (cartResult.rows.length === 0) {
      cartResult = await db.query(
        "INSERT INTO carts (user_id) VALUES ($1) RETURNING id",
        [user_id]
      );
    }

    cart_id = cartResult.rows[0].id;

    // Check existing quantity
    const existingItem = await db.query(
      "SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cart_id, product_id]
    );

    const currentQuantity = existingItem.rows.length > 0
      ? existingItem.rows[0].quantity
      : 0;

    // Check available stock
    if (currentQuantity + quantity > product.stock) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock"
      });
    }

    // Add product or increase existing quantity
    const result = await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET
         quantity = cart_items.quantity + EXCLUDED.quantity,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [cart_id, product_id, quantity]
    );

    // Update cart timestamp
    await db.query(
      "UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [cart_id]
    );

    res.status(200).json({
      message: "Product added to cart successfully",
      cart_item: result.rows[0]
    });

  } catch (error) {
    console.error("Error adding product to cart:", error.message);

    res.status(500).json({
      message: "Failed to add product to cart"
    });
  }
});

// GET customer's cart
router.get("/", verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Find customer's cart and its items
    const result = await db.query(
      `SELECT
         ci.id AS cart_item_id,
         p.id AS product_id,
         p.name,
         p.description,
         p.price,
         p.image_url,
         ci.quantity,
         (p.price * ci.quantity) AS subtotal
       FROM carts c
       JOIN cart_items ci ON c.id = ci.cart_id
       JOIN products p ON ci.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY ci.id ASC`,
      [user_id]
    );

    // Calculate total cart amount
    const total = result.rows.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );

    res.status(200).json({
      message: "Cart retrieved successfully",
      items: result.rows,
      total: total.toFixed(2)
    });

  } catch (error) {
    console.error("Error retrieving cart:", error.message);

    res.status(500).json({
      message: "Failed to retrieve cart"
    });
  }
});

// UPDATE product quantity in customer's cart
router.put("/update/:productId", verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user_id = req.user.id;

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be a positive integer"
      });
    }

    // Check whether product exists
    const productResult = await db.query(
      "SELECT id, stock FROM products WHERE id = $1",
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Check available stock
    if (quantity > productResult.rows[0].stock) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock"
      });
    }

    // Update only an item belonging to this customer's cart
    const result = await db.query(
      `UPDATE cart_items ci
       SET quantity = $1,
           updated_at = CURRENT_TIMESTAMP
       FROM carts c
       WHERE ci.cart_id = c.id
         AND c.user_id = $2
         AND ci.product_id = $3
       RETURNING ci.*`,
      [quantity, user_id, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found in your cart"
      });
    }

    // Update cart timestamp
    await db.query(
      `UPDATE carts
       SET updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [user_id]
    );

    res.status(200).json({
      message: "Cart quantity updated successfully",
      cart_item: result.rows[0]
    });

  } catch (error) {
    console.error("Error updating cart:", error.message);

    res.status(500).json({
      message: "Failed to update cart"
    });
  }
});

// REMOVE product from customer's cart
router.delete("/remove/:productId", verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const user_id = req.user.id;

    // Remove product only from this customer's cart
    const result = await db.query(
      `DELETE FROM cart_items ci
       USING carts c
       WHERE ci.cart_id = c.id
         AND c.user_id = $1
         AND ci.product_id = $2
       RETURNING ci.id, ci.product_id`,
      [user_id, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found in your cart"
      });
    }

    // Update cart timestamp
    await db.query(
      `UPDATE carts
       SET updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [user_id]
    );

    res.status(200).json({
      message: "Product removed from cart successfully",
      productId: result.rows[0].product_id
    });

  } catch (error) {
    console.error("Error removing product from cart:", error.message);

    res.status(500).json({
      message: "Failed to remove product from cart"
    });
  }
});

module.exports = router;