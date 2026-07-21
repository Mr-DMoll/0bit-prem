import { ComingSoonPage } from "../components/ComingSoonPage";

export function PaymentsPage() {
  return (
    <ComingSoonPage
      title="Payments"
      description="Payment transaction history and reconciliation"
      items={[
        "Settlement status per transaction",
        "Failed payments and retries",
        "Refund handling",
        "Makes real sense once PayFast is connected — this page waits on that integration",
      ]}
    />
  );
}
