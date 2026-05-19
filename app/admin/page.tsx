"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    // Placeholder auth — accepts any non-empty credentials and goes to dashboard.
    // Swap this for real auth (Clerk / NextAuth / Supabase) when ready.
    await new Promise((r) => setTimeout(r, 600));
    if (username.trim() && password.trim()) {
      router.push("/dashboard");
    } else {
      setError("Please enter a username and password.");
      setSubmitting(false);
    }
  };

  return (
    <div className="login-root">
      {/* Background video */}
      <video
        className="bg-video"
        src="/hero-background.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="bg-overlay" />
      <div className="bg-vignette" />

      {/* Floating blobs */}
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <div className="login-grid">
        {/* LEFT — Brand */}
        <aside className="brand-side">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="brand-top"
          >
            <Image
              src="/crown-jewels-logo.png"
              alt="Crown Jewels Produce"
              width={580}
              height={260}
              priority
              className="brand-logo"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.85, ease: EASE }}
            className="brand-middle"
          >
            <span className="badge">
              <span className="badge-dot" />
              Internal Team Access
            </span>
            <h1>
              Sign in to your{" "}
              <span className="accent">team dashboard.</span>
            </h1>
            <p>
              Manage availability, grower partners, and the daily program.
              Crown Jewels staff only.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 1, ease: EASE }}
            className="brand-bottom"
          >
            <Stat n="16" l="Commodities" />
            <span className="stat-divider" />
            <Stat n="9" l="Growing Regions" />
            <span className="stat-divider" />
            <Stat n="30+" l="Years Shipping" />
          </motion.div>
        </aside>

        {/* RIGHT — Login card */}
        <section className="login-side">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.85, ease: EASE }}
            className="login-card"
          >
            <Link href="/" className="back-link">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to site
            </Link>

            <div className="card-header">
              <div className="icon-wrap">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2>Sign in to continue</h2>
              <p>Enter your team credentials to access the dashboard.</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: [0, -4, 4, -3, 3, 0] }}
                transition={{ duration: 0.45 }}
                className="error-msg"
                role="alert"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrap">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              </div>

              <div className="form-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" className="forgot">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-login"
              >
                {submitting ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            <div className="card-footer">
              © {new Date().getFullYear()} Crown Jewels Produce ·{" "}
              <a href="/">crownjewelsproduce.com</a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="stat-item">
      <div className="num">{n}</div>
      <div className="lbl">{l}</div>
    </div>
  );
}
