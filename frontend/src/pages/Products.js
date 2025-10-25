import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

import "./Products.css";

export default function Products() {
    // State for all products
    const [products, setProducts] = useState([]);
    // State for search/filter
    const [searchName, setSearchName] = useState("");
    const [searchDescription, setSearchDescription] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState([]);
    // State for messages
    const [messages, setMessages] = useState([]);

    // Handle search and filter form submission
    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            // const res = await axios.get("http://localhost:5000/api/products", {
            //     params: {
            //         search_name: searchName,
            //         search_description: searchDescription,
            //         min_price: minPrice,
            //         max_price: maxPrice,
            //     },
            //     withCredentials: true,
            // });
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/products`, {
                params: {
                    search_name: searchName,
                    search_description: searchDescription,
                    min_price: minPrice,
                    max_price: maxPrice,
                },
                withCredentials: true,
            });

            // Update products state 
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch all products initially and when filters change
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // const res = await axios.get("http://localhost:5000/api/products", {
                //     params: {
                //         search_name: searchName,
                //         search_description: searchDescription,
                //         min_price: minPrice,
                //         max_price: maxPrice,
                //     },
                //     withCredentials: true, // send cookies/session for authentication
                // });
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/products`, {
                    params: {
                        search_name: searchName,
                        search_description: searchDescription,
                        min_price: minPrice,
                        max_price: maxPrice,
                    },
                    withCredentials: true, // send cookies/session for authentication
                });

                setProducts(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchProducts();
    }, [searchName, searchDescription, minPrice, maxPrice]);

    // Handle add to cart
    const handleAddToCart = async (productId) => {
        try {
            // const res = await axios.post(`http://localhost:5000/api/cart/add/${productId}`, {}, { withCredentials: true });
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/cart/add/${productId}`,
                {},
                { withCredentials: true }
            );
            
            window.dispatchEvent(new Event("cart-updated"))
            setMessages([{ type: "success", text: res.data.message }]);
        } catch (err) {
            setMessages([{ type: "danger", text: err.response?.data?.error || "Failed to add to cart" }]);
        }
    };

    return (
        <div>
            {/* Navbar */}
            <Navbar />
            <div className="container">
                <h2 className="mb-4 text-center">Our Products</h2>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`alert alert-${msg.type} alert-dismissible fade show`} role="alert">
                        {msg.text}
                        <button type="button" className="btn-close" onClick={() => setMessages(messages.filter((_, i) => i !== idx))}></button>
                    </div>
                ))}

                <div className="card mb-4 p-3 shadow-sm">
                    <form className="row g-3 align-items-end" onSubmit={handleSearch}>
                        <div className="col-md-4">
                            <label htmlFor="search_name" className="form-label">Name</label>
                            <input type="text" className="form-control" id="search_name" placeholder="Search by name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="search_description" className="form-label">Description</label>
                            <input type="text" className="form-control" id="search_description" placeholder="Search by description" value={searchDescription} onChange={(e) => setSearchDescription(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="min_price" className="form-label">Min Price</label>
                            <input type="number" step="0.01" className="form-control" id="min_price" placeholder="0.00" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <label htmlFor="max_price" className="form-label">Max Price</label>
                            <input type="number" step="0.01" className="form-control" id="max_price" placeholder="0.00" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                        </div>
                        <div className="col-md-12 text-end">
                            <button type="submit" className="btn btn-primary">Search</button>
                        </div>
                    </form>
                </div>

                <div className="row">
                    {products.map((product) => (
                        <div key={product.id} className="col-md-4 mb-4">
                            <div
                                className="card product-card h-100 p-3 d-flex flex-column justify-content-between"
                                style={{
                                    minHeight: "100%", // keeps it filling available space
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // default shadow
                                    borderRadius: "10px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.03)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                }}
                            >
                                {/* Card content remains unchanged */}
                                <div className="d-flex align-items-start mb-2">
                                    <div className="flex-grow-1">
                                        <h5 className="card-title mb-1">{product.name}</h5>
                                        <p className="card-text mb-0">{product.description}</p>
                                    </div>
                                    {product.image_filename && (
                                        <div className="ms-3" style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                                            <img
                                                src={product.image_filename}
                                                alt={product.name}
                                                style={{ height: 60, width: "auto", objectFit: "contain", borderRadius: 5 }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="mb-2">
                                    {/* <p className="mb-1"><strong>Price:</strong> ${parseFloat(product.price).toFixed(2)}</p>
                                <p className="mb-0"><strong>Stock:</strong> {product.stock}</p> */}
                                    <p className="mb-1">
                                        <strong>Price:</strong> $
                                        {parseFloat(product.price).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                    <p className="mb-0">
                                        <strong>Stock:</strong> {product.stock.toLocaleString()}
                                    </p>

                                </div>

                                <button
                                    className="btn btn-success btn-sm"
                                    disabled={product.stock === 0}
                                    onClick={() => handleAddToCart(product.id)}
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
