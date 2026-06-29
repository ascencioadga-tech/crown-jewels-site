"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import "./login.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    // Placeholder auth — client-side credential check only.
    // Swap for real auth (Supabase / NextAuth) before production.
    await new Promise((r) => setTimeout(r, 600));
    if (username.trim() === "Alejandro" && password === "Crownjewels") {
      router.push("/dashboard");
    } else {
      setError("Invalid username or password.");
      setSubmitting(false);
    }
  };

  return (
    <div className="cjlogin">
      <div className="split">
        {/* LEFT — form */}
        <div className="form-side">
          <div className="form-inner">
            <img className="form-logo" src="/crown-jewels-logo-dark.png" alt="Crown Jewels Produce" />

            <p className="eyebrow">Team portal</p>
            <h1>Welcome back.</h1>
            <p className="sub">
              Sign in to manage availability, orders, grower settlements, and the daily program — all in one place.
            </p>

            {error && (
              <div className="error-msg" role="alert">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="username">Username</label>
                <div className="input-wrap">
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              </div>

              <div className="field pw">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <button
                    type="button"
                    className="toggle-pw"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw((s) => !s)}
                  >
                    {showPw ? (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.879 9.879" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="options">
                <label className="remember">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <a href="#" className="forgot">Forgot password?</a>
              </div>

              <button type="submit" disabled={submitting} className="btn-login">
                {submitting ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            <div className="secure-note">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              256-bit SSL encrypted connection
            </div>
            <div className="foot">© {new Date().getFullYear()} Crown Jewels Produce Company, LLC</div>
          </div>
        </div>

        {/* RIGHT — brand panel */}
        <div className="brand-panel">
          <video src="/login-hero.mp4" autoPlay muted loop playsInline poster="/login-hero.jpg" />

          <div className="panel-c panel-top">
            <img className="panel-logo" src="/crown-jewels-logo.png" alt="Crown Jewels Produce" />
            <span className="panel-chip">Authorized Access</span>
          </div>

          <div className="panel-mid">
            <p className="panel-eyebrow">Year-round, field to dock</p>
            <h2>Built for the team that runs Crown Jewels.</h2>
            <p>
              The secure home for the desk that moves our produce from field to dock — every order, every grower, every season.
            </p>
          </div>

          <div className="panel-c panel-stats">
            <div>
              <div className="n">16</div>
              <div className="l">Commodities</div>
            </div>
            <div className="divr" />
            <div>
              <div className="n">30+</div>
              <div className="l">Years shipping</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
