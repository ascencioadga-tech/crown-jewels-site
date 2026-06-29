// Standalone, PUBLIC New Order app — the sales rep's order desk lifted out of
// the dashboard onto its own shareable URL (/new-order), with no team login and
// no workspace sidebar. Renders the exact same component as
// /dashboard/order-system/new (single source of truth); on this route it shows
// a saved-order confirmation instead of navigating into the dashboard, and the
// AI scanner can use the phone camera.
export { default } from "../dashboard/order-system/new/page";
