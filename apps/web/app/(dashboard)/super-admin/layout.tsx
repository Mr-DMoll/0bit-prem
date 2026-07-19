import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function SuperAdminRoleLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["SUPER_ADMIN"]}>{children}</RoleGuard>;
}
