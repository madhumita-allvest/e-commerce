
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

import "./Navbar.css";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className={`navbar${menuOpen ? " navbar-menu-open" : ""}`}>
      <Link to="/" className="navbar-logo">
        ShopEasy
      </Link>

      <button
        className="navbar-menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="navbar-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className="navbar-menu"
        id="navbar-menu"
        onClick={() => setMenuOpen(false)}
      >
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>

          {/* Customer navigation */}
          {isAuthenticated && user?.role === "customer" && (
            <Link to="/my-orders">My Orders</Link>
          )}

          {/* Admin navigation */}
          {isAuthenticated && user?.role === "admin" && (
            <>
              <Link to="/admin/dashboard">
                Admin Dashboard
              </Link>

              <Link to="/admin/products">
                Manage Products
              </Link>

              <Link to="/admin/orders">
                Manage Orders
              </Link>

              <Link to="/admin/customers">
                Manage Customers
              </Link>

              <Link to="/admin/create-admin">
                Create Admin
              </Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>

              <Link to="/register" className="register-btn">
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="navbar-user">
                Hi, {user?.name}
              </span>

              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}

          <Link to="/cart" className="cart-link">
            🛒 Cart <span className="cart-count">{cartCount}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
