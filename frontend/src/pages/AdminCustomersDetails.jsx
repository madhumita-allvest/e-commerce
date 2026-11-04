
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function AdminCustomerDetails() {
  const { id } = useParams();
  const { token } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [customerResponse, ordersResponse] = await Promise.all([
        api.get(`/admin/customers/${id}`, config),
        api.get(`/admin/customers/${id}/orders`, config),
      ]);

      setCustomer(customerResponse.data.customer);
      setOrders(ordersResponse.data.orders || []);
      setTotalOrders(ordersResponse.data.totalOrders || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load customer details."
      );
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "delivered";

      case "shipped":
        return "shipped";

      case "processing":
        return "processing";

      case "cancelled":
        return "cancelled";

      case "pending":
        return "pending";

      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <p>Loading customer details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <Link to="/admin/customers" style={styles.backLink}>
          ← Back to Customers
        </Link>

        <div style={styles.error}>
          {error}
        </div>

        <button onClick={fetchCustomerDetails} style={styles.button}>
          Try Again
        </button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={styles.page}>
        <p>Customer not found.</p>

        <Link to="/admin/customers" style={styles.backLink}>
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <Link to="/admin/customers" style={styles.backLink}>
            ← Back to Customers
          </Link>

          <h1 style={styles.heading}>Customer Details</h1>
          <p style={styles.subtitle}>
            View customer information and order history.
          </p>
        </div>

        <button onClick={fetchCustomerDetails} style={styles.button}>
          Refresh
        </button>
      </div>

      {/* Customer Information */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Personal Information</h2>

        <div style={styles.infoGrid}>
          <div>
            <span style={styles.label}>Customer ID</span>
            <p style={styles.value}>#{customer.id}</p>
          </div>

          <div>
            <span style={styles.label}>Full Name</span>
            <p style={styles.value}>{customer.name}</p>
          </div>

          <div>
            <span style={styles.label}>Email Address</span>
            <p style={styles.value}>{customer.email}</p>
          </div>

          <div>
            <span style={styles.label}>Registered On</span>
            <p style={styles.value}>
              {formatDate(customer.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.label}>Total Orders</span>
          <h2 style={styles.summaryValue}>{totalOrders}</h2>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.label}>Total Spent</span>
          <h2 style={styles.summaryValue}>
            {formatPrice(customer.total_spent)}
          </h2>
        </div>
      </div>

      {/* Order History */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Order History</h2>

        {orders.length === 0 ? (
          <div style={styles.empty}>
            This customer has not placed any orders yet.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Order Date</th>
                  <th style={styles.th}>Total Amount</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={styles.td}>#{order.id}</td>

                    <td style={styles.td}>
                      {formatDate(order.created_at)}
                    </td>

                    <td style={styles.td}>
                      {formatPrice(order.total_amount)}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.status,
                          ...(statusStyles[getStatusClass(order.status)] ||
                            statusStyles.default),
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const statusStyles = {
  delivered: {
    background: "#dcfce7",
    color: "#166534",
  },
  shipped: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  processing: {
    background: "#fef3c7",
    color: "#92400e",
  },
  cancelled: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  pending: {
    background: "#f3f4f6",
    color: "#374151",
  },
  default: {
    background: "#f3f4f6",
    color: "#374151",
  },
};

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "30px auto",
    padding: "20px",
    color: "#1f2937",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },
  heading: {
    margin: "15px 0 5px",
    fontSize: "28px",
  },
  subtitle: {
    color: "#6b7280",
    margin: 0,
  },
  backLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    marginBottom: "25px",
  },
  cardTitle: {
    margin: "0 0 22px",
    fontSize: "20px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "25px",
  },
  label: {
    color: "#6b7280",
    fontSize: "14px",
  },
  value: {
    fontWeight: "600",
    margin: "8px 0 0",
    overflowWrap: "anywhere",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },
  summaryCard: {
    background: "#fff",
    padding: "22px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  summaryValue: {
    fontSize: "25px",
    margin: "10px 0 0",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: "600px",
  },
  th: {
    padding: "14px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
  },
  td: {
    padding: "15px 14px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
  },
  status: {
    display: "inline-block",
    padding: "6px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  empty: {
    textAlign: "center",
    padding: "30px 15px",
    color: "#6b7280",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "15px",
    borderRadius: "6px",
    margin: "20px 0",
  },
};

export default AdminCustomerDetails;
