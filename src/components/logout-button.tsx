
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        backgroundColor: "#dc2626",
        color: "#ffffff",
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
