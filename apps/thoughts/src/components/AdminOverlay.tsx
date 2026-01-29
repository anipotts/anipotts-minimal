"use client";

import { AdminShell } from "@anipotts/ui/admin";
import AdminCommandCenter from "@/app/admin/AdminCommandCenter";

export default function AdminOverlay() {
  return (
    <AdminShell>
      <AdminCommandCenter />
    </AdminShell>
  );
}
