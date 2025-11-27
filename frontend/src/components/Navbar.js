import React, { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import "./Navbar.css";

export default function Navbar() {
    const [cartCount, setCartCount] = useState(0);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // detect route changes

    const fetchData = async () => {
        try {
            // Fetch current user
            // const userRes = await axios.get("http://localhost:5000/api/current_user", { withCredentials: true });
            const userRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/current_user`,
                { withCredentials: true }
            );
            setUser(userRes.data.username);
            setIsAdmin(userRes.data.is_admin);

            // Fetch cart count
            // const cartRes = await axios.get("http://localhost:5000/api/cart/count", { withCredentials: true });
            const cartRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/cart/count`,
                { withCredentials: true }
            );
            setCartCount(cartRes.data.count);
        } catch (err) {
            console.log("Not logged in or failed to fetch cart count");
            setCartCount(0);
        }
    };

    // runs on mount and when location changes
    useEffect(() => {
        fetchData();
        // Listen for "cart-updated" events to instantly refresh count
        window.addEventListener("cart-updated", fetchData);
        return () => window.removeEventListener("cart-updated", fetchData);
    }, [location]); // run again on route change

    // Handle logout
    const handleLogout = async () => {
        try {
            // await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/logout`,
                {},
                { withCredentials: true }
            );
            setUser(null);
            setCartCount(0);
            navigate("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <nav className="navbar navbar-light bg-light mb-4">
            <div className="container d-flex justify-content-between align-items-center flex-wrap">

                {/* Brand */}
                <Link className="navbar-brand" to="/">E-Commerce</Link>

                {/* Home */}
                <ul className="navbar-nav d-flex flex-row align-items-center ms-auto">
                    <li className="nav-item mx-2">
                        <Link className="nav-link" to="/">Home</Link>
                    </li>

                    {/* Products Page */}
                    <li className="nav-item mx-2">
                        <Link className="nav-link" to="/products">Products</Link>
                    </li>

                    {/* Products (admin view) */}
                    {isAdmin && (
                        <>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/products">Admin Products</Link>
                            </li>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/orders">Admin Orders</Link>
                            </li>
                        </>
                    )}

                    {/* Orders (logged in users) */}
                    {user && (
                        <li className="nav-item mx-2">
                            <Link className="nav-link" to="/orders">Orders</Link>
                        </li>
                    )}

                    {/* Login/Logout buttons */}
                    {user ? (
                        <>
                            <li className="nav-item mx-2">
                                <button className="btn nav-link" onClick={handleLogout}>Logout</button>
                            </li>
                        </>
                    ) : (
                        <li className="nav-item mx-2">
                            <Link className="nav-link" to="/login">Login</Link>
                        </li>
                    )}

                    {/* Cart Button */}
                    <li className="nav-item mx-2">
                        <Link to="/cart" className="cart-btn">

                            🛒 Cart
                            {cartCount > 0 && (
                                <span className="badge bg-danger ms-1">{cartCount}</span>
                            )}
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
