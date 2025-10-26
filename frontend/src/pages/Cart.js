import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

import "./Cart.css";
import Navbar from "../components/Navbar";

export default function Cart() {

  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);

  // const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState(null); // Stripe

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      // const res = await axios.get("http://localhost:5000/api/cart", { withCredentials: true });
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart`, {
        withCredentials: true,
      });
      setCartItems(res.data.cart);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart on component mount
  useEffect(() => {
    fetchCart();
  }, []);

  // Handle quantity update
  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      // const res = await axios.post(
      //   `http://localhost:5000/api/cart/update/${productId}`,
      //   { quantity },
      //   { withCredentials: true }
      // );
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/cart/update/${productId}`,
        { quantity },
        { withCredentials: true }
      );

      setMessages([{ type: "success", text: res.data.message }]);
      fetchCart();
    } catch (err) {
      setMessages([{ type: "danger", text: err.response?.data?.error || "Failed to update cart" }]);
    }
  };

  // Handle remove from cart
  const handleRemove = async (productId) => {
    try {
      // const res = await axios.post(`http://localhost:5000/api/cart/remove/${productId}`, {}, { withCredentials: true });
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/cart/remove/${productId}`,
        {},
        { withCredentials: true }
      );

      setMessages([{ type: "success", text: res.data.message }]);
      fetchCart();
    } catch (err) {
      setMessages([{ type: "danger", text: err.response?.data?.error || "Failed to remove item" }]);
    }
  };

  // Handle checkout
  // const handleCheckout = async () => {
  //   try {
  //     const res = await axios.post("http://localhost:5000/api/cart/checkout", {}, { withCredentials: true });
  //     setMessages([{ type: "success", text: res.data.message }]);
  //     fetchCart(); // clear cart
  //   } catch (err) {
  //     setMessages([{ type: "danger", text: "Checkout failed" }]);
  //   }
  // };

  // Handle Stripe checkout
  const handleCheckout = async () => {

    console.log("handleCheckout called");

    if (!stripe || !elements) {
      console.log("Stripe or Elements not loaded yet");
      return; // Stripe.js not yet loaded
    }

    try {
      console.log("Checkout total:", total);

      // Request backend to create PaymentIntent
      // const res = await axios.post(
      //   "http://localhost:5000/api/create-payment-intent",
      //   { amount: total }, // amount in dollars (convert to cents in backend)
      //   { withCredentials: true }
      // );
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/create-payment-intent`,
        { amount: total }, // amount in dollars (convert to cents in backend)
        { withCredentials: true }
      );

      const { clientSecret } = res.data;
      setClientSecret(clientSecret);

      // 2️⃣ Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      // Handle payment result
      if (paymentResult.error) {
        setMessages([{ type: "danger", text: paymentResult.error.message }]);
      } else if (paymentResult.paymentIntent.status === "succeeded") {
        // Payment successful, now clear cart via backend
        // await axios.post("http://localhost:5000/api/cart/checkout", {}, { withCredentials: true });
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/cart/checkout`,
          {},
          { withCredentials: true }
        );

        setMessages([{ type: "success", text: "Payment successful! Cart cleared." }]);
        fetchCart();
      }
    } catch (err) {
      setMessages([{ type: "danger", text: "Payment failed" }]);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          Loading cart...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="container mt-5">
        <h1 className="text-center">Your Cart</h1>

        {/* Flash messages */}
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

        {cartItems.length > 0 ? (
          <>
            {/* <table className="table table-bordered"> */}
            <table className="table bubble-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th style={{ width: "120px" }}>Quantity</th>
                  <th>Subtotal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.product.id}>
                    <td>{item.product.name}</td>
                    <td>
                      ${item.product.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {/* <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      className="form-control form-control-sm mb-2"
                      onChange={(e) =>
                        handleUpdateQuantity(item.product.id, parseInt(e.target.value, 10))
                      }
                    /> */}
                      <div className="quantity-control">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            handleUpdateQuantity(item.product.id, Math.max(item.quantity - 1, 1))
                          }
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          readOnly
                          className="form-control form-control-sm text-center quantity-input"
                        />
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                    </td>
                    <td>
                      $
                      {item.subtotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <button
                        // className="btn btn-sm btn-danger"
                        className="btn remove-btn"
                        onClick={() => handleRemove(item.product.id)}
                      >
                        x
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>
              Total: $
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h4>

            {/* Stripe Card input */}
            <div className="mb-3">
              <label>Enter Payment Details:</label>
              <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "6px" }}>
                {/* <CardElement /> */}
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#32325d",             // main text color
                        backgroundColor: "#ffffff",   // background inside Stripe input
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        '::placeholder': {
                          color: "#aab7c4",           // placeholder text color
                        },
                      },
                      invalid: {
                        color: "#fa755a",             // error text color
                        iconColor: "#fa755a",         // error icon color
                      },
                    },
                  }}
                />

              </div>
            </div>

            <div className="d-flex gap-2">
              {/* <button className="btn btn-success" onClick={handleCheckout}> */}
              <button className="bubble-btn checkout" onClick={handleCheckout}>
                Checkout
              </button>
              {/* <Link to="/products" className="btn btn-secondary"> */}
              <Link to="/products" className="bubble-btn continue">
                Continue
              </Link>
            </div>
          </>
        ) : (
          <div>
            <p>Your cart is empty.</p>
            <Link to="/products" className="bubble-btn shop-now">
              Shop Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}