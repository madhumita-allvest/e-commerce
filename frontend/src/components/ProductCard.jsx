
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleAddToCart = async () => {
    setMessage("");
    setMessageType("");

    const result = await addToCart(product, 1);

    setMessage(result.message);
    setMessageType(result.success ? "success" : "error");
  };

  return (
    <div className="product-card">
      <Link
        to={`/products/${product.id}`}
        className="product-card-link"
      >
        <div className="product-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="image-placeholder">
              No Image Available
            </div>
          )}
        </div>

        <div className="product-details">
          <h3>{product.name}</h3>

          <h4>
            ₹{Number(product.price).toLocaleString("en-IN")}
          </h4>

          <span className="view-details">
            View Details →
          </span>
        </div>
      </Link>

      <div className="product-card-action">
        <button
          className="add-cart-btn"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>

        {message && (
          <p
            className={
              messageType === "success"
                ? "cart-success"
                : "cart-error"
            }
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
