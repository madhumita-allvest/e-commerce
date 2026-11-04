
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data.slice(0, 3));
      } catch (err) {
        console.error("Error fetching featured products:", err);
        setError("Unable to load featured products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to ShopEasy</h1>

          <p>
            Discover quality products at great prices.
            Shop your favourites with ease!
          </p>

          <Link to="/products" className="shop-now-btn">
            Explore Products
          </Link>
        </div>
      </section>

      <section className="home-intro">
        <h2>Shopping Made Easy</h2>

        <p>
          ShopEasy brings you a simple and convenient
          shopping experience. Explore our collection,
          find what you need, and enjoy shopping with us.
        </p>
      </section>

      <section className="featured-section">
        <h2>Featured Products</h2>

        <p className="featured-description">
          Check out some of our popular products.
        </p>

        {loading && <p>Loading featured products...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p>No products available right now.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

        <Link to="/products" className="view-all-btn">
          View All Products
        </Link>
      </section>
    </div>
  );
}

export default Home;
