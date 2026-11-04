import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import "./AdminDashboard.css";

function AdminDashboard() {
  const { token, user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get("/admin/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStats(response.data.stats);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardStats();
    } else {
      setError("Please log in again to access the dashboard.");
      setLoading(false);
    }
  }, [token]);

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const dashboardCards = stats
    ? [
        {
          title: "Total Products",
          value: formatNumber(stats.totalProducts),
          icon: "📦",
          description: "Products in your store",
        },
        {
          title: "Total Customers",
          value: formatNumber(stats.totalCustomers),
          icon: "👥",
          description: "Registered customers",
        },
        {
          title: "Total Orders",
          value: formatNumber(stats.totalOrders),
          icon: "🛍️",
          description: "Orders placed",
        },
        {
          title: "Total Sales",
          value: formatCurrency(stats.totalSales),
          icon: "💰",
          description: "Excluding cancelled orders",
        },
        {
          title: "Admin Accounts",
          value: formatNumber(stats.totalAdmins),
          icon: "🛡️",
          description: "Registered administrators",
        },
      ]
    : [];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <p className="admin-dashboard-label">ADMINISTRATION</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-dashboard-welcome">
            Welcome back, {user?.name || "Admin"}!
            Manage your ShopEasy store from here.
          </p>
        </div>

        <Link to="/" className="view-store-btn">
          View Store
        </Link>
      </div>

      {loading ? (
        <p className="admin-dashboard-message">
          Loading dashboard statistics...
        </p>
      ) : error ? (
        <p className="admin-dashboard-error">{error}</p>
      ) : (
        <>
          <h2 className="admin-section-title">Store Overview</h2>

          <div className="admin-stats-grid">
            {dashboardCards.map((card) => (
              <div className="admin-stat-card" key={card.title}>
                <div className="admin-stat-top">
                  <span className="admin-stat-icon">
                    {card.icon}
                  </span>
                  <span className="admin-stat-description">
                    {card.description}
                  </span>
                </div>

                <h3>{card.value}</h3>
                <p>{card.title}</p>
              </div>
            ))}
          </div>

        </>
      )}
    </div>
  );
}

export default AdminDashboard;