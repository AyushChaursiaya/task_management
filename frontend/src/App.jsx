import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./components/Login";
import Signup from "./components/Signup";
import TaskList from "./components/TaskList";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.get(`${process.env.REACT_APP_API_URL}/auth/validate`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsLoggedIn(true);
        } catch (err) {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowSignup(false);
  };

  const handleSignup = () => {
    setShowSignup(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setShowSignup(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {!isLoggedIn ? (
        <div className="w-full max-w-md mt-8">
          {showSignup ? (
            <Signup onSignup={handleSignup} setShowSignup={setShowSignup} />
          ) : (
            <Login onLogin={handleLogin} setShowSignup={setShowSignup} />
          )}
        </div>
      ) : (
        <div className="w-full max-w-3xl mt-8">
          <TaskList onLogout={handleLogout} />
        </div>
      )}
    </div>
  );
};

export default App;