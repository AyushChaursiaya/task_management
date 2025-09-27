import React, { useState } from "react";
import axios from "axios";

const Login = ({ onLogin, setShowSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    if (!email || !password) {
      setMessage("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      onLogin();
    } catch (err) {
      setMessage(err.response?.data.message || "Error logging in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
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
              aria-describedby={message ? "email-error" : undefined}
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
              aria-describedby={message ? "password-error" : undefined}
            />
          </div>
          {message && (
            <p
              id="error-message"
              className="text-red-500 text-sm"
              role="alert"
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="block mx-auto mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium underline rounded-md"
            aria-label="Go to signup page"
          >
            Need an account? Sign up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;