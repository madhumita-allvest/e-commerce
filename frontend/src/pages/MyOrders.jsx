import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "./MyOrders.css";

function MyOrders() {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders/my-orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(response.data.orders || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) return <p className="orders-message">Loading orders...</p>;

  if (error) return <p className="orders-error">{error}</p>;

  return (
    <div className="my-orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h2>No orders yet</h2>
          <p>Your orders will appear here after checkout.</p>
          <Link to="/products">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div>
                <h3>Order #{order.id}</h3>

                <p>
                  Date:{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN")}
                </p>

                <p>
                  Total: ₹
                  {Number(order.total_amount).toLocaleString("en-IN")}
                </p>

                <p>
                  Status: <strong>{order.status}</strong>
                </p>
              </div>

              <Link
                to={`/my-orders/${order.id}`}
                className="order-details-link"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;