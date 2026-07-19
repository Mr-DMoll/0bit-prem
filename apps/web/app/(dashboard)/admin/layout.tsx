import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function AdminRoleLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["ADMIN"]}>{children}</RoleGuard>;
}
