import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

// Create new product (admin)
export default function CreateProduct() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
    });
    const [selectedFile, setSelectedFile] = useState(null); // State to store image file
    const [message, setMessage] = useState(null);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle file input changes
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Handle text and file upload 
            const data = new FormData();
            data.append("name", formData.name);
            data.append("description", formData.description);
            data.append("price", formData.price);
            data.append("stock", formData.stock);
            if (selectedFile) {
                data.append("image", selectedFile);
            }

            // Backend: create new product
            // await axios.post("http://localhost:5000/api/products", data, {
            //     withCredentials: true,
            //     headers: {
            //         "Content-Type": "multipart/form-data",
            //     }, // for file upload
            // });
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/products`,
                data,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessage({ type: "success", text: "Product created successfully!" });
            setTimeout(() => navigate("/admin/products"), 1000);
        } catch (err) {
            console.error("Failed to create product", err);
            setMessage({ type: "danger", text: "Failed to create product" });
        }
    };

    return (
        <div className="container mt-5">
            <h1>Create Product</h1>

            {message && (
                <div
                    className={`alert alert-${message.type} alert-dismissible fade show`}
                    role="alert"
                >
                    {message.text}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMessage(null)}
                    ></button>
                </div>
            )}

            <form onSubmit={handleSubmit} encType="multipart/form-data">
                {/* Product Name */}
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                        Product Name
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        required
                    />
                </div>

                {/* Description */}
                <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                        Description
                    </label>
                    <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter description (optional)"
                    ></textarea>
                </div>

                {/* Price */}
                <div className="mb-3">
                    <label htmlFor="price" className="form-label">
                        Price ($)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Enter price"
                        required
                    />
                </div>

                {/* Stock */}
                <div className="mb-3">
                    <label htmlFor="stock" className="form-label">
                        Stock
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Enter stock (optional)"
                    />
                </div>

                {/* Product Image */}
                <div className="mb-3">
                    <label htmlFor="image" className="form-label">
                        Product Image
                    </label>
                    <input
                        className="form-control"
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleFileChange}
                        accept="image/*"
                        required
                    />
                </div>

                {/* Buttons */}
                <button type="submit" className="btn btn-primary">
                    Create Product
                </button>
                <Link to="/admin/products" className="btn btn-secondary ms-2">
                    Cancel
                </Link>
            </form>
        </div>
    );
}
