import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

import "./EditProduct.css";

export default function EditProduct() {
    const { id } = useParams(); // product id from route 
    const navigate = useNavigate();

    const [product, setProduct] = useState(null); // start as null for loading guard
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState(null);

    // Fetch product data on mount
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // const res = await axios.get(`http://localhost:5000/api/products/${id}`, {
                //     withCredentials: true,
                // });
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/products/${id}`,
                    { withCredentials: true }
                );

                setProduct(res.data);
            } catch (err) {
                console.error("Failed to load product", err);
                setMessage({ type: "danger", text: "Failed to load product" });
            }
        };
        fetchProduct();
    }, [id]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct((prev) => ({ ...prev, [name]: value }));
    };

    // Handle file selection
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    // Submit form to update product
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("name", product.name);
            formData.append("description", product.description);
            formData.append("price", product.price);
            formData.append("stock", product.stock);
            if (selectedFile) formData.append("image", selectedFile);

            // Send FormData instead of JSON
            // await axios.put(`http://localhost:5000/api/products/${id}`, formData, {
            //     withCredentials: true,
            //     headers: {
            //         "Content-Type": "multipart/form-data",
            //     },
            // });
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/products/${id}`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessage({ type: "success", text: "Product updated successfully!" });

            setTimeout(() => navigate("/admin/products"), 1000);
        } catch (err) {
            console.error("Failed to update product", err);
            setMessage({ type: "danger", text: "Failed to update product" });
        }
    };

    // Delete product
    const handleDelete = async () => {
        if (!window.confirm("Delete this product? This action cannot be undone.")) return;

        try {
            // await axios.delete(`http://localhost:5000/api/products/${id}`, {
            //     withCredentials: true,
            //     headers: {
            //         "Content-Type": "multipart/form-data",
            //     },
            // });
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/products/${id}`,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            navigate("/admin/products");
        } catch (err) {
            console.error("Failed to delete product", err);
            setMessage({ type: "danger", text: "Failed to delete product" });
        }
    };

    // Loading guard
    if (!product) {
        return (
            <div className="container mt-5">
                <h1>Edit Product</h1>
                <p>Loading product...</p>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h1>Edit Product</h1>

            {/* Flash message */}
            {message && (
                <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                    {message.text}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMessage(null)}
                    ></button>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                {/* Name */}
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Product Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Description */}
                <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        value={product.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                {/* Price */}
                <div className="mb-3">
                    <label htmlFor="price" className="form-label">Price ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="price"
                        name="price"
                        value={product.price}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Stock */}
                <div className="mb-3">
                    <label htmlFor="stock" className="form-label">Stock</label>
                    <input
                        type="number"
                        className="form-control"
                        id="stock"
                        name="stock"
                        value={product.stock}
                        onChange={handleChange}
                    />
                </div>

                {/* Image Upload */}
                <div className="mb-3">
                    <label htmlFor="image" className="form-label">Product Image</label>
                    <input
                        type="file"
                        className="form-control"
                        id="image"
                        name="image"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Current image */}
                {product.image_filename && (
                    <div className="mb-3">
                        <p>Current Image:</p>
                        <img
                            src={product.image_filename}
                            alt={product.name}
                            width="150"
                            style={{ borderRadius: "5px" }}
                        />
                    </div>
                )}

                {/* Buttons */}
                <div className="button-group-fixed">
                    <button type="submit" className="btn btn-primary btn-sm">
                        Update Product
                    </button>
                    <Link to="/admin/products" className="btn btn-secondary btn-sm">
                        Cancel
                    </Link>
                    <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                        Delete Product
                    </button>
                </div>

            </form>
        </div>
    );
}
