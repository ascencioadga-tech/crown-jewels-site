// Lightweight client-side gate for the public workspace launcher (/apps).
// NOTE: this check runs in the browser, so the credentials live in the bundle —
// it keeps casual visitors out of the demo workspace, but it is NOT real
// server-side security. Swap for Supabase Auth when the backend lands.

export const APPS_AUTH_KEY = "cj-apps-auth";

const USER = "alejandro";
const PASS = "Crownjewels";

export function isAppsAuthed(): boolean {
  try {
    return localStorage.getItem(APPS_AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function signInApps(username: string, password: string): boolean {
  const ok = username.trim().toLowerCase() === USER && password === PASS;
  if (ok) {
    try {
      localStorage.setItem(APPS_AUTH_KEY, "1");
    } catch {}
  }
  return ok;
}

export function signOutApps(): void {
  try {
    localStorage.removeItem(APPS_AUTH_KEY);
  } catch {}
}
