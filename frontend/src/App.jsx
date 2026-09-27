import { useState } from "react";

function App() {
  // Signup state
  const [f_name, setFName] = useState("");
  const [l_name, setLName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupMessage, setSignupMessage] = useState("");

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  // Switch between Signup and Login
  const [showLogin, setShowLogin] = useState(false);

  // SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();

    setSignupMessage("Creating account...");

    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          f_name,
          l_name,
          username: signupUsername,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSignupMessage(data.message);

        // Clear form after successful signup
        setFName("");
        setLName("");
        setSignupUsername("");
        setSignupPassword("");
      } else {
        setSignupMessage(data.message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setSignupMessage("Could not connect to backend.");
    }
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginMessage("Logging in...");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginMessage(data.message);

        // Clear password after successful login
        setLoginPassword("");
      } else {
        setLoginMessage(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginMessage("Could not connect to backend.");
    }
  };

  return (
    <div>
      {showLogin ? (
        // =========================
        // LOGIN PAGE
        // =========================
        <>
          <h1>Login</h1>

          <form onSubmit={handleLogin}>
            <div>
              <label>Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button type="submit">Login</button>
          </form>

          <p>{loginMessage}</p>

          <button onClick={() => setShowLogin(false)}>
            Go to Sign Up
          </button>
        </>
      ) : (
        // =========================
        // SIGNUP PAGE
        // =========================
        <>
          <h1>Sign Up</h1>

          <form onSubmit={handleSignup}>
            <div>
              <label>First Name</label>
              <input
                type="text"
                value={f_name}
                onChange={(e) => setFName(e.target.value)}
              />
            </div>

            <div>
              <label>Last Name</label>
              <input
                type="text"
                value={l_name}
                onChange={(e) => setLName(e.target.value)}
              />
            </div>

            <div>
              <label>Username</label>
              <input
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />
            </div>

            <button type="submit">Sign Up</button>
          </form>

          <p>{signupMessage}</p>

          <button onClick={() => setShowLogin(true)}>
            Go to Login
          </button>
        </>
      )}
    </div>
  );
}

export default App;