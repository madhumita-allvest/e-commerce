import { useCallback, useEffect, useState } from "react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "./AdminProducts.css";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  stock: "0",
};

function AdminProducts() {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      setProducts(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      image_url: product.image_url || "",
      stock: String(product.stock ?? 0),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      image_url: form.image_url.trim(),
      stock: Number(form.stock),
    };

    if (!productData.name) {
      setError("Product name is required.");
      return;
    }

    if (
      form.price.trim() === "" ||
      !Number.isFinite(productData.price) ||
      productData.price < 0
    ) {
      setError("Enter a valid non-negative price.");
      return;
    }

    if (
      form.stock.trim() === "" ||
      !Number.isInteger(productData.stock) ||
      productData.stock < 0
    ) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    try {
      setSaving(true);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editingId) {
        await api.put(
          `/products/${editingId}`,
          productData,
          config
        );

        setSuccess("Product updated successfully.");
      } else {
        await api.post(
          "/products",
          productData,
          config
        );

        setSuccess("Product added successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);

      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/products/${product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (editingId === product.id) {
        resetForm();
      }

      setSuccess("Product deleted successfully.");

      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete product."
      );
    }
  };

  const formatPrice = (price) =>
    Number(price).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });

  return (
    <div className="admin-products-page">
      <div className="admin-products-header">
        <div>
          <p className="admin-products-label">ADMINISTRATION</p>
          <h1>Product Management</h1>
          <p>Manage your store products, prices and stock.</p>
        </div>
      </div>

      <section className="admin-product-form-section">
        <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

        <form onSubmit={handleSubmit} className="admin-product-form">
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label htmlFor="product-name">Product Name *</label>
              <input
                id="product-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="product-price">Price (₹) *</label>
              <input
                id="product-price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter price"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="product-stock">Stock Quantity *</label>
              <input
                id="product-stock"
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="Enter stock"
                min="0"
                step="1"
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="product-image">Image URL</label>
              <input
                id="product-image"
                type="text"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="Enter image URL"
              />
            </div>

            <div className="admin-form-group admin-form-full">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows="4"
              />
            </div>
          </div>

          {error && (
            <p className="admin-product-error">{error}</p>
          )}

          {success && (
            <p className="admin-product-success">{success}</p>
          )}

          <div className="admin-product-form-actions">
            <button
              type="submit"
              className="admin-save-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="admin-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-product-list-section">
        <div className="admin-product-list-header">
          <h2>All Products</h2>
          <span>{products.length} products</span>
        </div>

        {loading ? (
          <p className="admin-products-message">
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <p className="admin-products-message">
            No products found. Add your first product above.
          </p>
        ) : (
          <div className="admin-product-table-wrapper">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>#{product.id}</td>

                    <td>
                      <div className="admin-product-name-cell">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                          />
                        ) : (
                          <div className="admin-product-placeholder">
                            📦
                          </div>
                        )}

                        <span>{product.name}</span>
                      </div>
                    </td>

                    <td>{formatPrice(product.price)}</td>

                    <td>
                      <span
                        className={
                          Number(product.stock) > 0
                            ? "stock-available"
                            : "stock-empty"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td>
                      <div className="admin-product-actions">
                        <button
                          type="button"
                          className="admin-edit-btn"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminProducts;