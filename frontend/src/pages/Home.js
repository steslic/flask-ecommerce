import React from "react";
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar";
import "./Home.css";

export default function Home({ currentUser }) {
  return (
    <div>
      {/* Navbar */}
      <Navbar user={currentUser} />
      
      {/* Main Container */}
      <div className="container">
        <div className="text-center mt-5">
          <h1 className="fw-bold">Welcome, {currentUser?.username || "Guest"}!</h1>
          <p className="lead fw-normal">Start shopping or explore your account.</p>
          <Link to="/products" className="btn btn-primary btn-view-products">
            View Products
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-5 mb-3">
        <small>&copy; 2025, E-Commerce App</small>
      </footer>
    </div>
  );
}
