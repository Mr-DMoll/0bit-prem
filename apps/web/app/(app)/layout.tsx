import PublicShell from "@/features/public/PublicShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
