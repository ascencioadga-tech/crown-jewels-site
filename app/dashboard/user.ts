// The signed-in user. Placeholder until real auth (Milestone 5) — when each
// salesman logs in as themselves, this comes from the session instead.
export type DashUser = {
  name: string;
  initials: string;
  role: string;
  email: string;
};

export const CURRENT_USER: DashUser = {
  name: "Carlos Encinas",
  initials: "CE",
  role: "Salesman",
  email: "carlos@crownjewelsproduce.com",
};

export const firstName = (full: string) => full.split(" ")[0];

// The full sales team. Rob's report aggregates orders across all of them.
export const SALES_TEAM = [
  "Carlos Encinas",
  "Alejandro",
  "Marisol",
  "Diego",
] as const;
