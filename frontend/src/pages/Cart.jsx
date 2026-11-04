
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

function Cart() {
  const {
    cartItems,
    cartTotal,
    updateCartItem,
    removeFromCart,
  } = useCart();

  const handleQuantityChange = async (productId, quantity) => {
    await updateCartItem(productId, quantity);
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
  };

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>

          <Link
            to="/products"
            className="continue-shopping-btn"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => {
              const price = Number(item.price);
              const subtotal = price * Number(item.quantity);

              return (
                <div
                  className="cart-item"
                  key={item.product_id}
                >
                  <div className="cart-item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="cart-image-placeholder">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h3>{item.name}</h3>

                    <p>
                      Price: ₹{price.toLocaleString("en-IN")}
                    </p>

                    <p>
                      Subtotal: ₹
                      {subtotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>

                    <div className="quantity-controls">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product_id,
                            Number(item.quantity) - 1
                          )
                        }
                        disabled={Number(item.quantity) <= 1}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product_id,
                            Number(item.quantity) + 1
                          )
                        }
                        disabled={
                          Number(item.quantity) >= Number(item.stock)
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-cart-btn"
                      onClick={() =>
                        handleRemove(item.product_id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h2>
              Cart Total: ₹
              {cartTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>

            <Link
              to="/products"
              className="continue-shopping-btn"
            >
              Continue Shopping
            </Link>

            <Link
              to="/checkout"
              className="continue-shopping-btn"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
