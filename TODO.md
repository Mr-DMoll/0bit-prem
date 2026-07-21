# Premvkay — Build TODO

Living checklist for the whole app. Update this as work lands — check items off, add new ones as they're discovered. This is the source of truth for "what's left," independent of chat history.

Legend: `[x]` done & verified live · `[~]` partial / in progress · `[ ]` not started

---

## Foundation — done

- [x] Prisma schema — all core models (Album/Track/AlbumPurchase, Product/ProductVariant/Order/OrderItem, PaymentTransaction, BookingInquiry, GalleryImage, Event, User.activeDeviceId)
- [x] Nav/IA — dashboard shell (Super Admin/Admin/Manager) + public app shell (8 pages + Account)
- [x] Design skin — Premvkay amber/near-black palette, Cormorant Garamond/Inter, floating sidebar, floating mini-player

## Music — done

- [x] Admin: album CRUD, track CRUD, reorder
- [x] Public: browse albums, album detail, free/locked gating, real audio streaming via mini-player
- [x] Buy-album flow (records purchase directly — no real payment processor yet, by design for now)
- [x] Admin album-creation wizard (Metadata → Cover → Tracks, modeled on audiobookmasters' Studio pattern): multi-file bulk track upload with real XHR progress bars, filename-derived titles, real client-side duration detection (`Audio` + `loadedmetadata` — unlike audiobookmasters, which hardcodes duration to 0), native drag-reorder, staged-then-commit editing (rename/Free-toggle/soft-delete batched into one `PATCH .../tracks/bulk` on Commit). Shared `TrackStudio` component also used standalone on the existing-album Tracks page. Verified end-to-end live: created an album through all 3 steps with 2 real staged audio files (durations correctly detected), finalized to LIVE, then on an existing album exercised rename + Free toggle + reorder + delete all committed together in one batch call.

## Events / Gallery / Bookings — done

- [x] Events: admin CRUD + public upcoming/past split
- [x] Gallery: admin CRUD with reorder + public grid
- [x] Bookings: public inquiry form (on Contact page) + email notification to staff + admin triage (status workflow)

## File storage — done

- [x] R2 bucket created (`premvkay-record`), credentials added to `.env`
- [x] `s3.service.ts` implemented (presigned uploads), `/admin/uploads/presign` endpoint working
- [x] Real upload UI wired into Music, Events, Gallery (paste-a-URL removed)
- [x] CORS policy added via the Cloudflare dashboard
- [x] Verified end-to-end live: real file uploaded through the admin UI, confirmed in R2, confirmed rendering on the public Gallery page
- [ ] Note: current public dev URL (`*.r2.dev`) is fine for now; Cloudflare recommends a custom domain before production

## Merch — done

- [x] Admin: Product/ProductVariant CRUD with multi-image upload
- [x] Shared Orders/fulfillment view used by both Admin and Manager (`/merch-orders` API, `[ADMIN, MANAGER]`)
- [x] Public: browse, product detail, real cart (localStorage-persisted), checkout with shipping form
- [x] Verified end-to-end live: real product created, cart survived login, order placed, DB rows + stock decrement confirmed, both Admin and Manager see and can fulfill the same order
- [x] Sidebar/nav label: "Merch" → "Shop" (customer-facing `publicNav.config.ts`)

## Shop — pre-launch checklist (must resolve before go-live)

From a full api-to-web audit of the shop/checkout flow (2026-07-21), ahead of connecting PayFast.

- [ ] **Stock race condition** — `checkout` in `merch.controller.ts` reads `variant.stock` *before* the transaction, then decrements inside it with no re-check at decrement time. Two concurrent checkouts on the last unit can both pass and both decrement, oversetting. Fix: conditional update (`WHERE stock >= quantity`) inside the transaction, or serializable isolation.
- [ ] **Order confirmation + staff notification emails** — nothing fires today when an order is placed (mail.service.ts has invite/password-reset/booking-notification/verification-code emails, but no order receipt). Customer should get a receipt; staff should get notified the way booking inquiries already are.
- [ ] **Checkout → Google login loses the customer's place** — `cart/page.tsx`'s "Place Order" sends unauthenticated users through `/auth/google` with no return path; `googleCallback` always lands on `ROLE_ROUTES[role]` (homepage), not back at `/merch/cart`. Needs a `redirect`/`return_to` param threaded through the OAuth round trip.
- [ ] **"Merch" → "Shop" in the admin dashboard too** — customer-facing nav is done, but the admin sidebar link, the `MerchPage.tsx` h1, and the public product-detail page's `PageHeader`/breadcrumb (`[productId]/page.tsx`) still say "Merch."
- [ ] **Remove the password-reset flow entirely** — `/forgot-password`, `/reset-password` pages, their API endpoints, and `sendPasswordResetEmail` in mail.service.ts. Everyone but Super Admin is Google-only already; Super Admin's own login page is the only place `/forgot-password` is even linked from. Tradeoff to accept: if Super Admin ever forgets their password, recovery is a direct DB/script intervention (same as the original seed), not a self-service email flow.
- [ ] **Best-in-class product gallery/thumbnails** — current image gallery (`[productId]/page.tsx`) works (main image + thumbnail strip) but should be upgraded to match top-tier ecommerce product pages (larger primary image, smoother thumbnail interaction, possibly zoom/lightbox).
- [ ] **Delivery tracking** — physical merch is shipped; need to track whether an order has actually been delivered, not just "Fulfilled." Likely a schema change: either extend `OrderStatus` (e.g. add `SHIPPED`/`DELIVERED`) or add a `deliveredAt` timestamp + optional tracking number field, surfaced in both the admin Orders view and the customer's My Orders tab.

Open decisions (not broken, but worth an explicit yes/no before launch):
- [ ] Guest checkout vs. account-required — currently account (Google) required before ordering.
- [ ] Shipping cost — currently no separate line item; total is just sum of item prices. Confirm this is intentional (built into pricing) vs. needing its own field.
- [ ] Discount/promo codes, product reviews, catalog search/sort — all currently absent; likely fine until the catalog grows past a page or two, but flagging so it's a deliberate call, not an oversight.

## Admin — professional tooling (sidebar/analytics audit, 2026-07-21)

Current admin sidebar is entirely operational (CRUD on every entity) with nothing analytical — no way to see "how is the business doing," which matters given this is ecommerce + a Spotify-for-Artists-style streaming product, not just a content manager.

- [ ] **Analytics page (flagship addition)** — combine sales reporting (revenue over time, top-selling products/variants, average order value, revenue split music vs. merch, order-status breakdown — all derivable from existing `Order`/`OrderItem`/`PaymentTransaction` data) with listening analytics (play counts per track/album, most-played tracks, plays over time, and specifically which free tracks convert listeners into buyers). The listening half needs a new `AlbumPlay`/`TrackPlay` log or counter column — no play-count tracking exists in the schema today.
- [ ] **Low-stock visibility** — badge/filter on the existing Merch → Products table using the `stock` field that's already there; no new page needed.
- [ ] **Customer detail view** — clicking into a customer on the Customers page should show order history + lifetime spend, not just profile fields.
- [ ] **Packing slip / order export** — printable packing slip per order (name, address, items, order #) and a CSV export of pending orders, for physical shipping.
- [ ] **Feature an album on Sanctum** — admin toggle to control what Sanctum's "Up Next" surfaces, instead of a pure random pick; ties merch drops to the album promoting them.

Phase 2 / worth naming now, not launch-blocking:
- [ ] Payments/reconciliation view (settlement status, failed payments, refunds) — makes sense once PayFast is actually live, premature before.
- [ ] Discount/promo codes — no schema support today; revisit as the catalog grows.
- [ ] Fan broadcast email ("notify buyers about a new drop") — natural fit for a direct-to-fan platform, but a real feature, not a config toggle.
- [ ] Manager's sidebar is thin (Overview + Orders only) — revisit once Analytics exists, scoped down from the full admin view.

## Account page — done

- [x] API: "my purchased albums" + "my orders" endpoints
- [x] UI: real purchase/order history + profile — verified live for both a customer with purchases and an empty account

## Content management — done

- [x] Admin About/Contact/Harinam text editor (`ContentPage`), backed by the existing `SystemSetting` key/value store, own whitelisted module separate from Super-Admin platform settings
- [x] Public About page reads real content
- [x] Public Contact page shows real email/phone/socials alongside the booking form

## Harinam — done

- [x] Decision: reuses the `Event` model, plus one new `category` field (`GENERAL`/`HARINAM`)
- [x] Admin manages both from the same Events page (category selector added)
- [x] Public `/harinam` page built, `/events` filtered to exclude Harinam sessions — verified live, no duplication

## Anti-piracy / security — done

- [x] Single-device session enforcement — `/sessions/claim` + `/sessions/check`, polled every 5s while playing; verified live (second device claiming the account stops the first device's playback with a dismissible message, replaying re-claims)

## Payments — deferred, real work later

- [ ] Real PayFast once-off integration (replaces "record purchase directly" in both Music and Merch)
- [ ] PayFast sandbox credentials in `.env` (not present yet)
- [ ] ITN webhook handling

## Auth / accounts — done

- [x] Real Google OAuth credentials in `.env`, full flow verified live for both new and existing accounts
- [x] Single public "Continue with Google" button for everyone — customers auto-create as `USER`; invited `ADMIN`/`MANAGER` accounts land in their own dashboard on first login, `PENDING → ACTIVE` flips automatically
- [x] `/staff-login` removed entirely (along with the whole password-set-on-invite flow); Super Admin now signs in at a private, unlisted route (`/console-0726`) with a plain password form, not linked from anywhere in the UI
- [x] Password login hard-restricted to `SUPER_ADMIN` at the API level — verified a valid password hash on a non-super-admin account is still rejected
- [ ] Remove the password-reset flow entirely (see Shop checklist above — same task, listed there since it came up during that audit)

## Listener UI polish pass — done

- [x] Merch: `Product.category` (Apparel/Accessories/Books), public filter pills, professional product detail page (image gallery + thumbnails, variant pills, quantity stepper, stock messaging, category breadcrumb, related products row)
- [x] Account: rebuilt as tabs (Overview/My Albums/My Orders/Profile/Address), expandable order detail, real avatar upload (new customer-facing `POST /users/profile/avatar/presign`), saved default shipping address that prefills Merch checkout, visible Log out button
- [x] Gallery: iPad-style `Lightbox` component (thumbnail strip, arrow-key nav, prev/next), seeded 12 images
- [x] Events: public event detail page (`/events/[eventId]`), `EventCard` now links through, seeded more GENERAL + HARINAM events
- [x] Harinam: real structured content from the client's brief rendered via `marked` (Reasons We Chant, Who Is Hari, Who Is Gauranga, Duty, Śikṣāṣṭakam, Sankirtan, Harinam Cintamani, Prabhupada quotes)
- [x] About: editorial layout (hero + lede + `marked`-rendered body), richer placeholder bio
- [x] Contact: fixed dead-space layout (form/sidebar now properly fill the content width)
- [x] Fixed a real bug found during verification: `GET /auth/me` (used by `AuthContext` on every page load) had its own stale field-select missing city/country/language/dateOfBirth and all shipping fields — silently broke the new Address-prefill feature until fixed to match `/users/me`'s select

## UI polish — after the above

- [ ] Sanctum "now playing" real screen — currently an atmospheric placeholder even while a track is actively playing elsewhere on the site
- [ ] Full responsive/mobile layout pass
- [ ] Loading/empty state consistency pass across all pillars
- [ ] Accessibility pass
