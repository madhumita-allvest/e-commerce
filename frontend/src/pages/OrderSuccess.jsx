import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div style={{ maxWidth: "650px", margin: "60px auto", padding: "25px", textAlign: "center" }}>
      <h1>Order Placed Successfully!</h1>
      <p>Thank you for shopping with us.</p>

      {order && (
        <>
          <h3>Order #{order.id}</h3>
          <p>
            Total Amount: ₹
            {Number(order.total_amount).toLocaleString("en-IN")}
          </p>
          <p>Status: {order.status}</p>
        </>
      )}

      <Link to="/products">Continue Shopping</Link>
      {" | "}
      <Link to="/my-orders">View My Orders</Link>
    </div>
  );
}

export default OrderSuccess;