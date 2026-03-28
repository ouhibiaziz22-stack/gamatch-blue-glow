import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

function Connexion() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "code" | "newPassword">("email");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    code: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    bio: "",
    avatar: "",
  });

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("profile");
    const saved = stored ? (JSON.parse(stored) as Partial<typeof profileForm>) : {};
    setProfileForm((prev) => ({
      ...prev,
      ...saved,
      firstName: saved.firstName || user.firstName || prev.firstName,
      lastName: saved.lastName || user.lastName || prev.lastName,
      email: saved.email || user.email || prev.email,
    }));
  }, [user]);

  const onProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileMessage) setProfileMessage("");
  };

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({ ...prev, avatar: String(reader.result) }));
      setProfileMessage("");
    };
    reader.readAsDataURL(file);
  };

  const onProfileSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("profile", JSON.stringify(profileForm));
    setProfileMessage("Profile updated successfully.");
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isForgotMode) {
        if (forgotStep === "email") {
          await api.forgotPassword(form.email);
          setMessage("Verification code sent to your email.");
          setForgotStep("code");
        } else if (forgotStep === "code") {
          await api.verifyCode(form.email, form.code);
          setMessage("Code verified. Enter your new password.");
          setForgotStep("newPassword");
        } else if (forgotStep === "newPassword") {
          if (form.newPassword !== form.confirmNewPassword) {
            setMessage("Passwords do not match.");
            return;
          }
          await api.resetPassword(form.email, form.code, form.newPassword);
          setMessage("Password reset successfully! You can now sign in.");
          setIsForgotMode(false);
          setForgotStep("email");
          setIsLoginMode(true);
        }
        return;
      }

      if (!isLoginMode && form.password !== form.confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      if (isLoginMode) {
        await login(form.email, form.password);
        setMessage("Login successful.");
      } else {
        await register(form.firstName, form.lastName, form.email, form.password);
        setMessage("Account created successfully.");
      }
      setTimeout(() => navigate("/"), 1000);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "An error occurred."));
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <section className="connexion-page">
        <video className="connexion-video-bg" autoPlay muted loop playsInline>
          <source src="/thnd.mp4" type="video/mp4" />
        </video>
        <div className="connexion-video-overlay" />
        <div className="connexion-card profile-card">
          <div className="profile-header">
            <div>
              <h1>Welcome, {user.firstName}!</h1>
              <p>Manage your profile details and account settings.</p>
            </div>
            <div className="profile-actions">
              <button onClick={() => navigate("/mes-commandes")}>My Orders</button>
              <button className="connexion-secondary-btn" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>

          <form className="profile-form" onSubmit={onProfileSave}>
            <div className="profile-avatar">
              <div className="profile-avatar-preview">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="Profile" />
                ) : (
                  <span>{(profileForm.firstName || "U").slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="profile-avatar-meta">
                <p>Profile photo</p>
                <label className="profile-avatar-btn">
                  Upload new
                  <input type="file" accept="image/*" onChange={onAvatarChange} />
                </label>
              </div>
            </div>

            <div className="profile-grid">
              <label>
                First Name
                <input type="text" name="firstName" value={profileForm.firstName} onChange={onProfileChange} />
              </label>
              <label>
                Last Name
                <input type="text" name="lastName" value={profileForm.lastName} onChange={onProfileChange} />
              </label>
              <label>
                Email
                <input type="email" name="email" value={profileForm.email} onChange={onProfileChange} />
              </label>
              <label>
                Phone
                <input type="text" name="phone" value={profileForm.phone} onChange={onProfileChange} />
              </label>
              <label>
                City
                <input type="text" name="city" value={profileForm.city} onChange={onProfileChange} />
              </label>
              <label>
                Address
                <input type="text" name="address" value={profileForm.address} onChange={onProfileChange} />
              </label>
            </div>

            <label className="profile-bio">
              About you
              <textarea name="bio" value={profileForm.bio} onChange={onProfileChange} rows={3} />
            </label>

            <div className="profile-save">
              <button type="submit">Save Profile</button>
              {profileMessage && <span className="connexion-msg">{profileMessage}</span>}
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="connexion-page">
      <video
        className="connexion-video-bg"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/thnd.mp4" type="video/mp4" />
      </video>
      <div className="connexion-video-overlay" />

      <div className="connexion-card">
        <h1>{isForgotMode ? "Forgot Password" : isLoginMode ? "Sign In" : "Create Account"}</h1>
        <p>
          {isForgotMode
            ? forgotStep === "email"
              ? "Enter your email and we will send a verification code."
              : forgotStep === "code"
                ? "Enter the 6-digit code sent to your email."
                : "Enter your new password."
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
              disabled={isForgotMode && forgotStep !== "email"}
            />
          </label>

          {isForgotMode && forgotStep === "code" && (
            <label>
              Verification Code
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={onChange}
                required
                maxLength={6}
                placeholder="Enter 6-digit code"
              />
            </label>
          )}

          {isForgotMode && forgotStep === "newPassword" && (
            <>
              <label>
                New Password
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={onChange}
                  required
                />
              </label>
              <label>
                Confirm New Password
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={form.confirmNewPassword}
                  onChange={onChange}
                  required
                />
              </label>
            </>
          )}

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

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isForgotMode
                ? forgotStep === "email"
                  ? "Send code in email"
                  : forgotStep === "code"
                    ? "Verify code"
                    : "Reset password"
                : isLoginMode
                  ? "Sign In"
                  : "Create Account"}
          </button>

          {isForgotMode && (
            <button
              type="button"
              className="connexion-secondary-btn"
              onClick={() => {
                setIsForgotMode(false);
                setForgotStep("email");
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
