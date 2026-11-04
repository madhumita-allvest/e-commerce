
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("guestCart");

    try {
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mergedToken = useRef(null);
  const previousAuth = useRef(isAuthenticated);

  // Handle guest cart storage and logout
  useEffect(() => {
    if (previousAuth.current && !isAuthenticated) {
      setCartItems([]);
      localStorage.setItem("guestCart", JSON.stringify([]));
      mergedToken.current = null;
    } else if (!isAuthenticated) {
      localStorage.setItem(
        "guestCart",
        JSON.stringify(cartItems)
      );
    }

    previousAuth.current = isAuthenticated;
  }, [cartItems, isAuthenticated]);

  // Fetch the logged-in customer's cart
  const fetchCart = async () => {
    try {
      const response = await api.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartItems(response.data.items || []);
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load cart"
      );
      throw err;
    }
  };

  // Merge guest cart into the customer's database cart
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    if (mergedToken.current === token) {
      return;
    }

    mergedToken.current = token;

    const mergeGuestCart = async () => {
      setLoading(true);
      setError("");

      try {
        const savedGuestCart = JSON.parse(
          localStorage.getItem("guestCart") || "[]"
        );

        for (const item of savedGuestCart) {
          await api.post(
            "/cart/add",
            {
              product_id: item.product_id,
              quantity: item.quantity,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const remainingItems = JSON.parse(
            localStorage.getItem("guestCart") || "[]"
          ).filter(
            (guestItem) =>
              guestItem.product_id !== item.product_id
          );

          localStorage.setItem(
            "guestCart",
            JSON.stringify(remainingItems)
          );
        }

        await fetchCart();
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to synchronize your cart"
        );
      } finally {
        setLoading(false);
      }
    };

    mergeGuestCart();
  }, [isAuthenticated, token]);

  // Add a product to the cart
  const addToCart = async (product, quantity = 1) => {
    if (isAuthenticated) {
      try {
        await api.post(
          "/cart/add",
          {
            product_id: product.id,
            quantity,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await fetchCart();

        return {
          success: true,
          message: "Product added to cart",
        };
      } catch (err) {
        return {
          success: false,
          message:
            err.response?.data?.message ||
            "Failed to add product to cart",
        };
      }
    }

    const existingItem = cartItems.find(
      (item) => item.product_id === product.id
    );

    const currentQuantity = existingItem
      ? existingItem.quantity
      : 0;

    if (currentQuantity + quantity > product.stock) {
      return {
        success: false,
        message: "Requested quantity exceeds available stock",
      };
    }

    if (existingItem) {
      setCartItems((previousItems) =>
        previousItems.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        )
      );
    } else {
      setCartItems((previousItems) => [
        ...previousItems,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          stock: product.stock,
          quantity,
        },
      ]);
    }

    return {
      success: true,
      message: "Product added to cart",
    };
  };

  // Update a product quantity
  const updateCartItem = async (productId, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        success: false,
        message: "Quantity must be at least 1",
      };
    }

    const item = cartItems.find(
      (cartItem) => cartItem.product_id === productId
    );

    if (!item) {
      return {
        success: false,
        message: "Product not found in cart",
      };
    }

    if (quantity > Number(item.stock)) {
      return {
        success: false,
        message: "Requested quantity exceeds available stock",
      };
    }

    if (isAuthenticated) {
      try {
        await api.put(
          `/cart/update/${productId}`,
          { quantity },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await fetchCart();

        return {
          success: true,
          message: "Cart quantity updated",
        };
      } catch (err) {
        return {
          success: false,
          message:
            err.response?.data?.message ||
            "Failed to update cart quantity",
        };
      }
    }

    setCartItems((previousItems) =>
      previousItems.map((cartItem) =>
        cartItem.product_id === productId
          ? { ...cartItem, quantity }
          : cartItem
      )
    );

    return {
      success: true,
      message: "Cart quantity updated",
    };
  };

  // Remove a product from the cart
  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        await api.delete(`/cart/remove/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        await fetchCart();

        return {
          success: true,
          message: "Product removed from cart",
        };
      } catch (err) {
        return {
          success: false,
          message:
            err.response?.data?.message ||
            "Failed to remove product",
        };
      }
    }

    setCartItems((previousItems) =>
      previousItems.filter(
        (item) => item.product_id !== productId
      )
    );

    return {
      success: true,
      message: "Product removed from cart",
    };
  };

  // Calculate total product quantity
  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity),
    0
  );

  // Calculate cart total
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total +
      Number(
        item.subtotal ?? Number(item.price) * item.quantity
      ),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
