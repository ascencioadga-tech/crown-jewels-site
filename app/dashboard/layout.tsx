import Sidebar from "./Sidebar";
import "./shell.css";

// Workspace shell: dark sidebar on every dashboard page, content offset right.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cj-shell">
      <Sidebar />
      <div className="cj-shell-main">{children}</div>
    </div>
  );
}
