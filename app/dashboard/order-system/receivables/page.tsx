"use client";

// Receivables moved into its own Accounting tool. Keep this route working by
// redirecting anyone with an old link to the new home.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceivablesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/accounting");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        color: "rgba(14,20,17,0.5)",
        fontSize: 14,
      }}
    >
      Receivables now lives in the Accounting tool — taking you there…
    </div>
  );
}
