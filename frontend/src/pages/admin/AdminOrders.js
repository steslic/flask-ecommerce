import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar"; // Adjust path if needed

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);

    // Fetch all orders on mount
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // const res = await axios.get("http://localhost:5000/api/admin/orders", { withCredentials: true });
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/admin/orders`,
                    { withCredentials: true }
                );

                setOrders(res.data.orders);
            } catch (err) {
                console.error("Failed to fetch admin orders:", err);
            }
        };
        fetchOrders();
    }, []);

    // Function to handle status update
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            // const res = await axios.put(
            //     `http://localhost:5000/api/admin/orders/${orderId}`,
            //     { status: newStatus },
            //     { withCredentials: true }
            // );
            const res = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/admin/orders/${orderId}`,
                { status: newStatus },
                { withCredentials: true }
            );


            // Update local state after successful update
            setOrders(prev =>
                prev.map(order =>
                    order.order_id === orderId ? { ...order, status: newStatus } : order
                )
            );

            alert("Order status updated successfully!");
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update order status.");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container mt-4">
                <h2>All Orders</h2>

                {orders.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.order_id} className="card mb-3 p-3">
                            <p><strong>Order ID:</strong> {order.order_id}</p>
                            <p><strong>Date:</strong> {new Date(order.date_created).toLocaleString()}</p>
                            <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>

                            <p><strong>Status:</strong></p>
                            <select
                                value={order.status}
                                onChange={e => handleStatusChange(order.order_id, e.target.value)}
                                className="form-select"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                            </select>

                            <ul>
                                {order.items.map((item, idx) => (
                                    <li key={idx}>
                                        {item.product?.name ? (
                                            <>
                                                {item.quantity} × {item.product.name} (${item.product.price.toFixed(2)})
                                            </>
                                        ) : (
                                            <>Unknown Product</>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
