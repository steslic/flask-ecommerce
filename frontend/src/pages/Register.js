import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]); // array of { type: 'success'|'danger', text }
  const [isAdmin, setIsAdmin] = useState(false); // new 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Call Flask API to register
      // const response = await axios.post("http://localhost:5000/api/auth/register", {
      //   username,
      //   email,
      //   password,
      // });
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        {
          username,
          email,
          password,
          is_admin: isAdmin,
        },
        { withCredentials: true }
      );


      // Show success message
      setMessages([{ type: "success", text: response.data.message || "Registered successfully!" }]);

      // Optionally redirect to login after successful registration
      setTimeout(() => navigate("/login"), 1000);

    } catch (err) {
      // Show error message
      setMessages([
        { type: "danger", text: err.response?.data?.error || "Registration failed" },
      ]);
    }
  };

  return (
    <div
      className="register-card"
      style={{
        maxWidth: "400px",
        margin: "80px auto",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        backgroundColor: "#fff",
      }}
    >
      <h3 className="text-center mb-4">Register</h3>

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
            onClick={() => setMessages(messages.filter((_, i) => i !== idx))}
          ></button>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="username"
            placeholder="Enter username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
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
            placeholder="Enter password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Admin checkbox */}
        <div className="form-check mb-3" style={{ backgroundColor: "yellow" }}>
          <input
            type="checkbox"
            className="form-check-input"
            id="isAdmin"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="isAdmin">Register as admin</label>
        </div>

        <div className="d-grid mb-3">
          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </div>

        <p className="text-center">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </form>
    </div>
  );
}
