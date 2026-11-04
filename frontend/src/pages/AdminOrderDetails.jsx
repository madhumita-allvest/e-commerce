
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "./AdminOrderDetails.css";

const allowedStatuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function AdminOrderDetails() {
  const { id } = useParams();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/orders/admin/${id}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const fetchedOrder = response.data.order;

      setOrder(fetchedOrder);
      setSelectedStatus(fetchedOrder.status);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load order details."
      );
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const updateStatus = async () => {
    if (!order || !selectedStatus) {
      return;
    }

    if (selectedStatus === order.status) {
      return;
    }

    const confirmed = window.confirm(
      `Change order #${order.id} status to ${selectedStatus}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      const response = await api.put(
        `/orders/${id}/status`,
        {
          status: selectedStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrder((previous) => ({
        ...previous,
        ...response.data.order,
      }));

      setSelectedStatus(response.data.order.status);

      setMessage(
        "Order status updated successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update order status."
      );

      setSelectedStatus(order.status);
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (amount) =>
    Number(amount).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN");

  if (loading) {
    return (
      <div className="admin-order-details">
        <p>Loading order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="admin-order-details">
        <p className="admin-detail-error">{error}</p>

        <Link to="/admin/orders">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const isCancelled = order.status === "Cancelled";

  const availableStatuses = allowedStatuses.filter(
    (status) =>
      !(
        order.status === "Delivered" &&
        status === "Cancelled"
      )
  );

  return (
    <div className="admin-order-details">
      <Link
        to="/admin/orders"
        className="back-to-orders"
      >
        ← Back to All Orders
      </Link>

      <h1>Order #{order.id}</h1>

      {message && (
        <p className="admin-detail-success">
          {message}
        </p>
      )}

      {error && (
        <p className="admin-detail-error">
          {error}
        </p>
      )}

      {/* Customer and delivery information */}
      <section className="admin-order-info">
        <h2>Customer and Delivery Details</h2>

        <p>
          <strong>Customer:</strong>{" "}
          {order.customer_name}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {order.customer_email}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {order.phone}
        </p>

        <p>
          <strong>Delivery address:</strong>{" "}
          {order.address}, {order.city}, {order.state} -{" "}
          {order.postal_code}
        </p>

        <p>
          <strong>Order date:</strong>{" "}
          {formatDate(order.created_at)}
        </p>

        <p>
          <strong>Current status:</strong>{" "}
          {order.status}
        </p>

        <p>
          <strong>Order total:</strong>{" "}
          {formatPrice(order.total_amount)}
        </p>
      </section>

      {/* Products in the order */}
      <section className="admin-order-items">
        <h2>Products in this Order</h2>

        <div className="admin-order-items-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>

                  <td>
                    {formatPrice(item.unit_price)}
                  </td>

                  <td>{item.quantity}</td>

                  <td>
                    {formatPrice(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Order status management */}
      <section className="admin-status-control">
        <h2>Update Order Status</h2>

        {isCancelled ? (
          <p>
            This order has been cancelled and cannot
            be updated.
          </p>
        ) : (
          <div className="admin-status-form">
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
              disabled={updating}
            >
              {availableStatuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={updateStatus}
              disabled={
                updating ||
                selectedStatus === order.status
              }
            >
              {updating
                ? "Updating..."
                : "Update Status"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminOrderDetails;
