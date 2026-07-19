import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function ManagerRoleLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["MANAGER"]}>{children}</RoleGuard>;
}
