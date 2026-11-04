import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AdminOrders.css";

function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/admin/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN");

  const formatPrice = (amount) =>
    Number(amount).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  if (loading) return <div className="admin-orders-page">Loading orders...</div>;

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-header">
        <div>
          <h1>Manage Orders</h1>
          <p>View and manage customer orders.</p>
        </div>

        <button onClick={fetchOrders} className="refresh-orders-btn">
          Refresh Orders
        </button>
      </div>

      {error && <p className="admin-orders-error">{error}</p>}

      {!error && orders.length === 0 ? (
        <p>No orders have been placed yet.</p>
      ) : (
        <div className="admin-orders-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_email}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{formatPrice(order.total_amount)}</td>
                  <td>
                    <span
                      className={`admin-order-status ${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="view-order-btn"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;