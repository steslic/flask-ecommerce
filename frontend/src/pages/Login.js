import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// "setCurrentUser" from App.js 
export default function Login({ setCurrentUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [messages, setMessages] = useState([]); 
    const navigate = useNavigate();

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Call Flask login API
            // const response = await axios.post(
            //     "http://localhost:5000/api/auth/login",
            //     { email, password },
            //     { withCredentials: true}
            // );
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/login`,
                { email, password },
                { withCredentials: true }
            );            

            // Update global user state in App.js
            setCurrentUser({
                username: response.data.username,
                email: response.data.email,
            });

            navigate("/");

            // Set success message
            setMessages([{ type: "success", text: "Logged in successfully!" }]);

        } catch (err) {
            setMessages([
                { type: "danger", text: err.response?.data?.error || "Login failed" }
            ]);
        }
    };

    return (
        <div
            className="login-card"
            style={{
                maxWidth: "400px",
                margin: "80px auto",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
            }}
        >
            <h3 className="text-center mb-4">Login</h3>

            {/* Alert messages */}
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`alert alert-${msg.type} alert-dismissible fade show`}
                    role="alert"
                >
                    {msg.text}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                            setMessages(messages.filter((_, i) => i !== idx));
                        }}
                    ></button>
                </div>
            ))}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                        Email address
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        placeholder="Enter email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        Password
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        placeholder="Enter password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="d-grid mb-3">
                    <button type="submit" className="btn btn-primary">
                        Login
                    </button>
                </div>

                <p className="text-center">
                    Don't have an account? <a href="/register">Register here</a>
                </p>
            </form>
        </div>
    );
}
