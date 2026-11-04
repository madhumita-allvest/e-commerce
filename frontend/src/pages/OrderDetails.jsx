import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "./MyOrders.css";

function OrderDetails() {
  const { id } = useParams();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrder(response.data.order);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load order details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, token]);

  if (loading) return <p className="orders-message">Loading order...</p>;

  if (error) return <p className="orders-error">{error}</p>;

  if (!order) return <p>Order not found.</p>;

  return (
    <div className="order-details-page">
      <h1>Order #{order.id}</h1>

      <div className="order-information">
        <h2>Order Information</h2>

        <p><strong>Status:</strong> {order.status}</p>

        <p>
          <strong>Order Date:</strong>{" "}
          {new Date(order.created_at).toLocaleString("en-IN")}
        </p>

        <p>
          <strong>Total Amount:</strong> ₹
          {Number(order.total_amount).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="order-information">
        <h2>Delivery Information</h2>

        <p>{order.full_name}</p>
        <p>{order.phone}</p>
        <p>{order.address}</p>
        <p>
          {order.city}, {order.state} - {order.postal_code}
        </p>
      </div>

      <div className="order-information">
        <h2>Ordered Products</h2>

        {order.items.map((item, index) => (
          <div className="ordered-product" key={index}>
            <div>
              <h3>{item.product_name}</h3>
              <p>Quantity: {item.quantity}</p>
              <p>
                Unit Price: ₹
                {Number(item.unit_price).toLocaleString("en-IN")}
              </p>
            </div>

            <strong>
              ₹{Number(item.subtotal).toLocaleString("en-IN")}
            </strong>
          </div>
        ))}
      </div>

      <Link to="/my-orders" className="back-orders-link">
        Back to My Orders
      </Link>
    </div>
  );
}

export default OrderDetails;