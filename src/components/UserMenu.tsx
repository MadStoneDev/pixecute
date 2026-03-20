"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  getCurrentUser,
  signOut,
  onAuthStateChange,
  isCloudEnabled,
} from "@/utils/CloudSync";
import { AuthModal } from "@/components/AuthModal";
import { IconCloud, IconCloudOff, IconLogout, IconUser } from "@tabler/icons-react";

export const UserMenu = () => {
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCloudEnabled()) return;

    getCurrentUser().then(setUser);
    const subscription = onAuthStateChange(setUser);
    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isCloudEnabled()) {
    return (
      <div
        className="flex items-center gap-1 text-xs text-neutral-500"
        title="Cloud features not configured"
      >
        <IconCloudOff size={16} />
        <span className="hidden lg:inline">Local Only</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded-lg transition-colors font-medium"
        >
          <IconCloud size={16} />
          <span>Sign In</span>
        </button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            getCurrentUser().then(setUser);
          }}
        />
      </>
    );
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-primary-600 text-neutral-100 flex items-center justify-center text-xs font-bold">
          {displayName[0].toUpperCase()}
        </div>
        <span className="hidden lg:inline font-medium">{displayName}</span>
        <IconCloud size={14} className="text-green-500" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 bg-neutral-100 border border-neutral-300 rounded-lg shadow-xl min-w-[160px] z-50 overflow-hidden">
          <div className="p-3 border-b border-neutral-200">
            <div className="text-sm font-medium text-neutral-800">
              {displayName}
            </div>
            <div className="text-xs text-neutral-500 truncate">
              {user.email}
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              setUser(null);
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <IconLogout size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
