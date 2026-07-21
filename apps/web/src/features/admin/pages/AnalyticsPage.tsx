import { ComingSoonPage } from "../components/ComingSoonPage";

export function AnalyticsPage() {
  return (
    <ComingSoonPage
      title="Analytics"
      description="How the business is doing — sales and listening, in one place"
      items={[
        "Revenue over time, top-selling products/variants, average order value",
        "Revenue split — music vs. merch",
        "Order-status breakdown",
        "Play counts per track/album, most-played tracks, plays over time",
        "Which free tracks convert listeners into buyers",
      ]}
    />
  );
}
