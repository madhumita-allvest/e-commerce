const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyToken = require("../middleware/authmiddleware");
const adminMiddleware = require("../middleware/adminmiddleware");

// Validate product ID
const isValidId = (id) => {
  return /^\d+$/.test(id) && Number(id) > 0;
};

// Validate product data
const validateProduct = (body) => {
  const { name, price, stock } = body;

  if (typeof name !== "string" || !name.trim()) {
    return "A valid product name is required";
  }

  if (
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return "Price must be a valid non-negative number";
  }

  if (
    stock !== undefined &&
    (
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    )
  ) {
    return "Stock must be a non-negative whole number";
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return "Description must be text";
  }

  if (
    body.image_url !== undefined &&
    body.image_url !== null &&
    typeof body.image_url !== "string"
  ) {
    return "Image URL must be text";
  }

  return null;
};

// GET all products
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM products ORDER BY id ASC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error.message);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// GET a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const result = await db.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error.message);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});

// CREATE a new product (Admin only)
router.post("/", verifyToken, adminMiddleware, async (req, res) => {
  try {
    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const { name, description, price, image_url, stock } = req.body;

    const result = await db.query(
      `INSERT INTO products
       (name, description, price, image_url, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, price, image_url, stock, created_at`,
      [
        name.trim(),
        description?.trim() || null,
        Number(price),
        image_url?.trim() || null,
        stock === undefined ? 0 : Number(stock),
      ]
    );

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating product:", error.message);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
});

// UPDATE a product (Admin only)
router.put("/:id", verifyToken, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const { name, description, price, image_url, stock } = req.body;

    const result = await db.query(
      `UPDATE products
       SET name = $1,
           description = $2,
           price = $3,
           image_url = $4,
           stock = $5
       WHERE id = $6
       RETURNING id, name, description, price, image_url, stock, created_at`,
      [
        name.trim(),
        description?.trim() || null,
        Number(price),
        image_url?.trim() || null,
        stock === undefined ? 0 : Number(stock),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating product:", error.message);

    res.status(500).json({
      message: "Failed to update product",
    });
  }
});

// DELETE a product (Admin only)
router.delete("/:id", verifyToken, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const result = await db.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      productId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting product:", error.message);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
});

module.exports = router;