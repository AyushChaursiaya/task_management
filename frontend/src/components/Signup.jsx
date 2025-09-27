import React, { useState } from "react";
import axios from "axios";

const Signup = ({ onSignup, setShowSignup }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !image) {
      setMessage("Please fill in all fields and select an image");
      setMessageType("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setMessageType("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("image", image);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/signup`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Signup successful! Please login.");
      setMessageType("success");
      onSignup();
    } catch (err) {
      alert(err);
      setMessage(err.response?.data.message || "Error signing up");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Signup
        </h2>
        <form
          onSubmit={handleSignup}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md "
              required
              aria-describedby={
                message && messageType === "error" ? "name-error" : undefined
              }
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md "
              required
              aria-describedby={
                message && messageType === "error" ? "email-error" : undefined
              }
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md "
              required
              aria-describedby={
                message && messageType === "error"
                  ? "password-error"
                  : undefined
              }
            />
          </div>
          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700"
            >
              Profile Image
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full px-4 py-2 border border-gray-300 rounded-md "
              required
            />
          </div>
          {message && (
            <p
              id="message"
              className={`text-sm ${
                messageType === "success" ? "text-green-600" : "text-red-600"
              }`}
              role="alert"
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none transition-colors ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Signing up..." : "Signup"}
          </button>
          <button
            type="button"
            onClick={() => setShowSignup(false)}
            className="block mx-auto mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium underline rounded-md"
            aria-label="Go to login page"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;