import { useState, type ChangeEvent, type FormEvent } from "react";

function Connexion() {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isForgotMode) {
      setMessage("Verification code sent to your email.");
      return;
    }

    if (!isLoginMode && form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setMessage(isLoginMode ? "Login successful." : "Account created successfully.");
  };

  return (
    <section className="connexion-page">
      <video
        className="connexion-video-bg"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="connexion-video-overlay" />

      <div className="connexion-card">
        <h1>{isForgotMode ? "Forgot Password" : isLoginMode ? "Sign In" : "Create Account"}</h1>
        <p>
          {isForgotMode
            ? "Enter your email and we will send a verification code."
            : isLoginMode
              ? "Sign in to manage your orders and custom builds."
              : "Register to manage your orders and custom builds."}
        </p>

        <form className="connexion-form" onSubmit={onSubmit}>
          {!isLoginMode && !isForgotMode && (
            <div className="connexion-row">
              <label>
                First Name
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  required
                />
              </label>
            </div>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          {!isForgotMode && (
            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </label>
          )}

          {isLoginMode && !isForgotMode && (
            <button
              type="button"
              className="forget-password-btn"
              onClick={() => {
                setIsForgotMode(true);
                setMessage("");
              }}
            >
              Forget password?
            </button>
          )}

          {!isLoginMode && !isForgotMode && (
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                required
              />
            </label>
          )}

          <button type="submit">
            {isForgotMode ? "Send code in email" : isLoginMode ? "Sign In" : "Create Account"}
          </button>

          {isForgotMode && (
            <button
              type="button"
              className="connexion-secondary-btn"
              onClick={() => {
                setIsForgotMode(false);
                setMessage("");
              }}
            >
              Back to sign in
            </button>
          )}

          <button
            type="button"
            className="connexion-secondary-btn"
            onClick={() => {
              setIsLoginMode((prev) => !prev);
              setIsForgotMode(false);
              setMessage("");
            }}
          >
            {isLoginMode ? "Create new account" : "I have account"}
          </button>

          <div className="connexion-divider">
            <span>or login with</span>
          </div>

          <div className="social-login">
            <button
              type="button"
              className="social-btn google-btn"
              onClick={() => setMessage("Google login is not connected yet.")}
            >
              <span className="social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.1 14.6 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"
                  />
                </svg>
              </span>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className="social-btn apple-btn"
              onClick={() => setMessage("Apple login is not connected yet.")}
            >
              <span className="social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    fill="#111111"
                    d="M16.7 12.8c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.1-1.8-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.8-2.6-.8-1.3 0-2.6.8-3.3 1.9-1.4 2.4-.4 5.9 1 7.8.7.9 1.4 1.9 2.4 1.8 1-.1 1.3-.6 2.4-.6 1.1 0 1.4.6 2.4.6 1 0 1.6-.9 2.3-1.8.8-1.1 1.2-2.2 1.2-2.3 0 0-2.3-.9-2.3-4.4zm-2.1-6.3c.5-.6.8-1.4.7-2.2-.8 0-1.7.5-2.2 1.1-.5.5-.9 1.4-.8 2.2.9.1 1.8-.5 2.3-1.1z"
                  />
                </svg>
              </span>
              <span>Continue with Apple</span>
            </button>
          </div>

          {message && <p className="connexion-msg">{message}</p>}
        </form>
      </div>
    </section>
  );
}

export default Connexion;
