"use client";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleSignup = () => {
    window.location.href = "/signup";
  };

  return (
    <>
      <h1>Welcome to app</h1>
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleLogin}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <button
          onClick={handleSignup}
          style={{
            padding: "10px 20px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </div>
    </>
  );
}
