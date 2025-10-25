import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function Orders() {
    const [orders, setOrders] = useState([]); // State to store order history

    // Fetch orders on component mount
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Call the Flask API to get the current user's orders
                // const res = await axios.get("http://localhost:5000/api/orders", { withCredentials: true });
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`, {
                    withCredentials: true,
                  });
                  
                setOrders(res.data.orders); // store orders in state
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            }
        };
        fetchOrders();
    }, []);

    return (
        <div>
            <Navbar />

            <div className="container mt-4">
                <h2>Order History</h2>

                {orders.length === 0 ? (
                    // Show message if no past orders
                    <p>You have no past orders.</p>
                ) : (
                    // List all orders
                    orders.map(order => (
                        <div key={order.id} className="card mb-3 p-3">
                            <p><strong>Order ID:</strong> {order.id}</p>
                            <p><strong>Date:</strong> {new Date(order.date).toLocaleString()}</p>
                            <p><strong>Status:</strong> {order.status}</p>

                            <ul>
                                {order.items.map(item => (
                                    <li key={item.product.id}>
                                        {item.quantity} × {item.product.name} (${item.product.price.toFixed(2)})
                                    </li>
                                ))}
                            </ul>

                            <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
