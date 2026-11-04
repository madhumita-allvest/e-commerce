
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Product not found or unable to load.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setCartMessage("");
    setMessageType("");

    const result = await addToCart(product, quantity);

    setCartMessage(result.message);
    setMessageType(result.success ? "success" : "error");
  };

  if (loading) {
    return <p>Loading product details...</p>;
  }

  if (error || !product) {
    return <p>{error || "Product not found."}</p>;
  }

  return (
    <div className="product-details-page">
      <div className="details-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="details-placeholder">
            No Image Available
          </div>
        )}
      </div>

      <div className="details-content">
        <h1>{product.name}</h1>

        <p>
          {product.description || "No description available."}
        </p>

        <h2>
          ₹{Number(product.price).toLocaleString("en-IN")}
        </h2>

        <p>
          {product.stock > 0
            ? `Available Stock: ${product.stock}`
            : "Out of Stock"}
        </p>

        {product.stock > 0 && (
          <>
            <label htmlFor="quantity">Quantity:</label>

            <input
              id="quantity"
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => {
                const value = Number(e.target.value);

                if (
                  Number.isInteger(value) &&
                  value >= 1 &&
                  value <= product.stock
                ) {
                  setQuantity(value);
                }
              }}
            />

            <button onClick={handleAddToCart}>
              Add to Cart
            </button>

            {cartMessage && (
              <p
                className={
                  messageType === "success"
                    ? "cart-success"
                    : "cart-error"
                }
              >
                {cartMessage}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProductDetails;
