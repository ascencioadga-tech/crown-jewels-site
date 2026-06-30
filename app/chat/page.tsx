// Standalone, PUBLIC Chat app — the team's workspace chat lifted out of the
// dashboard onto its own shareable URL (/chat), with no workspace sidebar in
// front of it. It renders the exact same component as /dashboard/messages
// (single source of truth); on this route, on phones, it presents as a real
// full-screen phone chat app (maroon app bar, conversation list → message view).
export { default } from "../dashboard/messages/page";
