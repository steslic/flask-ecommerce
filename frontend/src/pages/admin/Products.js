// frontend/src/pages/admin/Products.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import "./Products.css";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();

    // Fetch products on mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // const res = await axios.get("http://localhost:5000/api/admin/products", { withCredentials: true });
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/admin/products`,
                    { withCredentials: true }
                );

                setProducts(res.data.products); // assumes API returns { products: [...] }
            } catch (err) {
                console.error("Failed to fetch products", err);
            }
        };
        fetchProducts();
    }, []);

    // Handle delete
    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            // await axios.delete(`http://localhost:5000/api/products/${productId}`, { withCredentials: true });
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/products/${productId}`,
                { withCredentials: true }
            );

            setProducts(products.filter(p => p.id !== productId));
            setMessages([{ type: "success", text: "Product deleted successfully." }]);
        } catch (err) {
            setMessages([{ type: "danger", text: err.response?.data?.error || "Failed to delete product" }]);
        }
    };

    return (
        <div>
            <Navbar />

            <div className="container mt-5">
                <h1 className="admin-products-title">Admin - Products</h1>

                {/* Flash messages */}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`alert alert-${msg.type} alert-dismissible fade show`} role="alert">
                        {msg.text}
                        <button type="button" className="btn-close" onClick={() => setMessages(messages.filter((_, i) => i !== idx))}></button>
                    </div>
                ))}

                {/* Buttons Row */}
                {/* <div className="d-flex justify-content-between mb-3">
                    <Link to="/admin/create-product" className="btn btn-primary">Add Product</Link>
                    <Link to="/" className="btn btn-secondary">Exit</Link>
                </div> */}

                {/* Products Table */}
                {/* <table className="table table-bordered"> */}
                <table className="table bubble-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Image</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? products.map(product => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td>
                                    {product.image_filename ? (
                                        <img src={product.image_filename} alt={product.name} width="100" />
                                    ) : (
                                        <span>No image</span>
                                    )}
                                </td>
                                <td>{product.description || "None"}</td>
                                <td>{product.price}</td>
                                <td>{product.stock || 0}</td>
                                <td>
                                    <Link to={`/admin/edit-product/${product.id}`} className="btn-action edit me-1">
                                        Edit
                                    </Link>
                                    <button
                                        className="btn-action delete"
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center">No products found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <Link to="/admin/create-product" className="bubble-btn shop-now">
                        Add Product
                    </Link>
                    <Link to="/" className="bubble-btn continue">
                        Exit
                    </Link>
                </div>
            </div>
        </div>
    );
}
