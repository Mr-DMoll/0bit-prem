"use client";

import { useAuth, ROLE_ROUTES, type UserRole } from "@/shared/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const allowed = !isLoading && !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // Super Admin's login route is private/unlisted — only its own subtree
      // bounces there; every other role uses the public site's Google button.
      router.push(allowedRoles.includes("SUPER_ADMIN") ? "/console-0726" : "/");
      return;
    }
    // Wrong role: send them to their own dashboard, not a static fallback.
    if (!allowedRoles.includes(user.role)) { router.push(redirectTo ?? ROLE_ROUTES[user.role] ?? "/"); }
  }, [user, isLoading, router, redirectTo, allowedRoles]);

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

  if (!allowed) return null;

  return <>{children}</>;
}
