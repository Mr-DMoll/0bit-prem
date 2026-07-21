import { ComingSoonPage } from "../components/ComingSoonPage";

export function DiscountsPage() {
  return (
    <ComingSoonPage
      title="Discounts"
      description="Promo codes and launch discounts for the shop"
      items={[
        "Percentage or flat-amount discount codes",
        "Fan-club / launch pricing for new drops",
        "No schema support yet — revisit as the catalog grows",
      ]}
    />
  );
}
