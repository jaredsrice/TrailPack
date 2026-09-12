"use client";

import { useEffect, useState } from "react";

const AUTH_STATUS_MESSAGES = {
  "signed-in":
    "Returned from Google sign-in. Generate a packing list to check your account and save privately.",
  error: "TrailPack could not complete Google sign-in. Please try again.",
  unavailable:
    "Google sign-in is temporarily unavailable. You can still plan as a guest.",
} as const;

type AuthStatus = keyof typeof AUTH_STATUS_MESSAGES;

export function AuthStatusNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const authValues = new URLSearchParams(window.location.search).getAll("auth");
    const auth = authValues.length === 1 ? authValues[0] : null;
    setMessage(
      auth && Object.hasOwn(AUTH_STATUS_MESSAGES, auth)
        ? AUTH_STATUS_MESSAGES[auth as AuthStatus]
        : null,
    );
  }, []);

  return message ? (
    <p
      role="status"
      className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-medium text-emerald-950"
    >
      {message}
    </p>
  ) : null;
}
