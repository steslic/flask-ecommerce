import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Import Stripe
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Import pages/components
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import AdminProducts from "./pages/admin/Products";
import EditProduct from "./pages/admin/EditProduct";
import CreateProduct from "./pages/admin/CreateProduct";
import AdminOrders from "./pages/admin/AdminOrders";

// Initialize Stripe with public key (publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load current user when app mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Call the Flask API 
        // REACT_APP_API_URL
        // const res = await axios.get("http://localhost:5000/api/auth/user", { withCredentials: true });
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`, { withCredentials: true });
        if (res.data.user) {
          setCurrentUser(res.data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  if (loadingUser) return <div className="text-center mt-5">Loading...</div>;

  // const isAdmin = currentUser?.role === "admin"

  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          {/* Home page via "/" or "/home" */}
          <Route path="/" element={<Home currentUser={currentUser} />} />
          <Route path="/home" element={<Home currentUser={currentUser} />} />

          {/* Login page */}
          <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />

          {/* Register page */}
          <Route path="/register" element={<Register />} />

          {/* Products page */}
          <Route
            path="/products"
            element={
              currentUser ? (
                <Products currentUser={currentUser} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Cart page */}
          <Route path="/cart" element={<Cart />} />

          {/* Orders page */}
          <Route
            path="/orders"
            element={
              currentUser ? (
                <Orders currentUser={currentUser} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Admin products page */}
          <Route path="/admin/products" element={<AdminProducts />} />
          {/* <Route
          path="/admin/products"
          element={
            isAdmin ? <AdminProducts /> : <Navigate to="/" replace /> // redirect non-admins
          }
        /> */}

          {/* Edit products page */}
          <Route path="/admin/edit-product/:id" element={<EditProduct />} />
          {/* <Route
          path="/admin/edit-product/:id"
          element={
            isAdmin ? <EditProduct /> : <Navigate to="/" replace />
          }
        /> */}

          {/* Create product page */}
          <Route path="/admin/create-product" element={<CreateProduct />} />
          {/* <Route
          path="/admin/create-product"
          element={
            isAdmin ? <CreateProduct /> : <Navigate to="/" replace />
          }
        /> */}

          {/* Admin orders page */}
          <Route path="/admin/orders" element={<AdminOrders />} />

          {/* Redirect protected pages if not logged in */}
          {/* <Route
          path="/products"
          element={currentUser ? <Products /> : <Navigate to="/login" />}
        /> */}
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
