import { ComingSoonPage } from "../components/ComingSoonPage";

export function BroadcastsPage() {
  return (
    <ComingSoonPage
      title="Broadcasts"
      description="Email your customers and fans directly from the app"
      items={[
        "Notify past buyers about a new album or merch drop",
        "A natural fit for a direct-to-fan platform",
        "A real feature, not a config toggle — phase 2",
      ]}
    />
  );
}
