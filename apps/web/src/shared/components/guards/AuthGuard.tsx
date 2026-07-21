"use client";

import { useAuth } from "@/shared/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      // Super Admin's login route is private and unlisted — only that
      // subtree bounces there. Everyone else lands on the public site,
      // where the same "Continue with Google" button everyone uses lives.
      router.replace(pathname.startsWith("/super-admin") ? "/console-0726" : "/");
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
      }}>
        <div style={{
          width: "20px",
          height: "20px",
          border: "2px solid var(--color-border)",
          borderTopColor: "var(--color-accent)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
