import { Suspense } from "react";
import StaffLoginPage from "@/features/auth/pages/StaffLoginPage";

export default function StaffLoginRoute() {
  return (
    <Suspense>
      <StaffLoginPage />
    </Suspense>
  );
}
