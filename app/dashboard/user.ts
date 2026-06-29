// The signed-in user. Placeholder until real auth (Milestone 5) — when each
// salesman logs in as themselves, this comes from the session instead.
export type DashUser = {
  name: string;
  initials: string;
  role: string;
  email: string;
};

export const CURRENT_USER: DashUser = {
  name: "Alejandro Bours",
  initials: "AB",
  role: "Salesman",
  email: "alejandro@crownjewelsproduce.com",
};

export const firstName = (full: string) => full.split(" ")[0];

// The full sales team. Rob's report aggregates orders across all of them.
export const SALES_TEAM = [
  "Alejandro",
  "Carlos",
  "Robbie",
  "Santiago",
] as const;

// ---- Roles & team directory (placeholder until real auth) ----
// `salesman` sees only their own book; `accounting` sees the master dashboard.
export type Role = "salesman" | "accounting";

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  role: Role;
  title: string;
  email: string;
};

export const TEAM: TeamMember[] = [
  { id: "rosa",      name: "Rosa Delgado",      initials: "RD", role: "accounting", title: "Head of Accounting", email: "rosa@crownjewelsproduce.com" },
  { id: "alejandro", name: "Alejandro Bours",   initials: "AB", role: "salesman",   title: "Salesman",           email: "alejandro@crownjewelsproduce.com" },
  { id: "carlos",    name: "Carlos Encinas",    initials: "CE", role: "salesman",   title: "Salesman",           email: "carlos@crownjewelsproduce.com" },
  { id: "robbie",    name: "Robbie Mathias",    initials: "RM", role: "salesman",   title: "Salesman",           email: "robbie@crownjewelsproduce.com" },
  { id: "santiago",  name: "Santiago Martinez", initials: "SM", role: "salesman",   title: "Salesman",           email: "santiago@crownjewelsproduce.com" },
];

export const SELLERS = TEAM.filter((m) => m.role === "salesman");

/** Order salesperson strings vary ("Alejandro" vs "Alejandro Bours") — match on first name. */
export const ownsOrder = (member: TeamMember, salesperson: string) =>
  firstName(salesperson).toLowerCase() === firstName(member.name).toLowerCase();

/** Map any salesperson string to a known seller's display name (else the raw string). */
export const canonicalSeller = (salesperson: string): string => {
  const m = SELLERS.find(
    (s) => firstName(s.name).toLowerCase() === firstName(salesperson).toLowerCase()
  );
  return m ? m.name : salesperson;
};
