const express = require("express");

const router = express.Router();

// Temporary product data
const products = [
  {
    id: 1,
    name: "Laptop",
    price: 55000,
    description: "A laptop for everyday use"
  },
  {
    id: 2,
    name: "Smartphone",
    price: 25000,
    description: "A smartphone with great features"
  },
  {
    id: 3,
    name: "Headphones",
    price: 2000,
    description: "Wireless headphones"
  }
];

// GET all products
router.get("/", (req, res) => {
  res.json(products);
});

// GET a single product by ID
router.get("/:id", (req, res) => {
  const productId = Number(req.params.id);

  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  res.json(product);
});

module.exports = router;