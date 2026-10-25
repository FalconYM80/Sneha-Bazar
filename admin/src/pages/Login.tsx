import React, { useState } from "react";
import Logo from "../components/Logo";
import { IconAlertTriangle, IconShield, IconEye } from "../components/ui";

interface LoginProps {
  onSuccess?: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

// Clean SVG icon for hidden password (eye off)
function IconEyeOff({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// Clean SVG icon for Email input
function IconMail({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

// Clean SVG icon for Lock input
function IconLock({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Clean SVG Spinner
function IconSpinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className={`animate-spin ${className}`}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function Login({ onSuccess, onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address format.");
      return;
    }

    if (!cleanPassword) {
      setError("Please enter your password.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(cleanEmail, cleanPassword);
      onSuccess?.();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6"
      style={{ background: "#f4f6f4" }}
    >
      <div className="w-full max-w-[420px] space-y-6">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2.5 bg-white rounded-2xl card-shadow border border-gray-100 mb-3.5">
            <Logo className="w-10 h-10 rounded-lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Sneha Bazar</h1>
            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase">
              Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-normal">
            Sign in to access the store management portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100 p-6 sm:p-8">
          {/* Error Message Banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2.5"
            >
              <span className="text-red-500 flex-shrink-0 mt-0.5">
                <IconAlertTriangle size={16} />
              </span>
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <IconMail size={15} />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="admin@snehabazar.in"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  style={{ fontFamily: "inherit" }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <IconLock size={15} />
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter administrator password"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  style={{ fontFamily: "inherit" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white hover:bg-green-700 active:bg-green-800 font-semibold text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <IconSpinner size={16} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login to Admin Panel</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice Footer */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <IconShield size={12} />
            <span>Secure Backend-Enforced Access</span>
          </div>
          <p className="text-[10px] text-gray-400">
            Sneha Bazar Admin Portal &bull; Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
