
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "./AdminCustomers.css";

function AdminCustomers() {
  const { token } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data.customers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatPrice = (amount) =>
    Number(amount).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  const filteredCustomers = customers.filter((customer) => {
    const searchValue = search.toLowerCase();

    return (
      customer.name.toLowerCase().includes(searchValue) ||
      customer.email.toLowerCase().includes(searchValue)
    );
  });

  if (loading) {
    return (
      <div className="admin-customers-page">
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="admin-customers-page">

      {/* Page Header */}
      <div className="admin-customers-header">
        <div>
          <h1>Manage Customers</h1>
          <p>View and manage your registered customers.</p>
        </div>

        <button
          onClick={fetchCustomers}
          className="refresh-customers-btn"
        >
          Refresh Customers
        </button>
      </div>

      {/* Customer Statistics */}
      <div className="customer-summary-card">
        <div>
          <span>Total Customers</span>
          <h2>{customers.length}</h2>
        </div>
      </div>

      {/* Search */}
      <div className="customer-search-box">
        <input
          type="text"
          placeholder="Search by customer name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="admin-customers-error">{error}</p>
      )}

      {/* Customer Table */}
      {!error && filteredCustomers.length === 0 ? (
        <div className="no-customers">
          {customers.length === 0
            ? "No customers registered yet."
            : "No customers match your search."}
        </div>
      ) : (
        !error && (
          <div className="admin-customers-table-wrapper">
            <table className="admin-customers-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Registered On</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>#{customer.id}</td>

                    <td className="customer-name">
                      {customer.name}
                    </td>

                    <td>{customer.email}</td>

                    <td>{formatDate(customer.created_at)}</td>

                    <td>
                      <span className="customer-order-count">
                        {customer.total_orders}
                      </span>
                    </td>

                    <td className="customer-spending">
                      {formatPrice(customer.total_spent)}
                    </td>

                    <td>
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="view-customer-btn"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

    </div>
  );
}

export default AdminCustomers;
