"use client";

import React, { useState } from "react";
import { signIn, signUp } from "@/utils/CloudSync";
import { IconX, IconCloud, IconMail, IconLock, IconUser } from "@tabler/icons-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { user, error: authError } = await signIn(email, password);
        if (authError) {
          setError(authError.message);
        } else if (user) {
          onAuthSuccess();
          onClose();
        }
      } else {
        const { user, error: authError } = await signUp(
          email,
          password,
          displayName,
        );
        if (authError) {
          setError(authError.message);
        } else if (user) {
          setMessage("Check your email to confirm your account.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-100 rounded-2xl w-[360px] overflow-hidden border border-neutral-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-neutral-100">
          <div className="flex items-center gap-2">
            <IconCloud size={20} />
            <h3 className="font-medium">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">
                Display Name
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus-within:border-primary-600">
                <IconUser size={16} className="text-neutral-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus-within:border-primary-600">
              <IconMail size={16} className="text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">
              Password
            </label>
            <div className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus-within:border-primary-600">
              <IconLock size={16} className="text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          {message && (
            <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>

          <p className="text-center text-xs text-neutral-500">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setMessage("");
                  }}
                  className="text-primary-600 hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setMessage("");
                  }}
                  className="text-primary-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};
