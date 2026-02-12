"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AdminPanel, AdminPanelContent, type AdminTabId, type AdminScope } from "@anipotts/ui/admin";
import { useTheme } from "@anipotts/ui";
import { useAdmin } from "@/context/AdminContext";
import TypefullyStatusWidget from "@/app/admin/TypefullyStatusWidget";

const PipelineTab = dynamic(() => import("@/app/admin/tabs/PipelineTab"), { ssr: false });
const ContentTab = dynamic(() => import("@/app/admin/tabs/ContentTab"), { ssr: false });
const AtomsTab = dynamic(() => import("@/app/admin/tabs/AtomsTab"), { ssr: false });
const ScheduleTab = dynamic(() => import("@/app/admin/tabs/ScheduleTab"), { ssr: false });
const ConfigTab = dynamic(() => import("@/app/admin/tabs/ConfigTab"), { ssr: false });
const SiteTab = dynamic(() => import("@/app/admin/tabs/SiteTab"), { ssr: false });
const AnalyticsTab = dynamic(() => import("@/app/admin/tabs/AnalyticsTab"), { ssr: false });

function renderTab(tabId: AdminTabId) {
  switch (tabId) {
    case "pipeline":
      return <PipelineTab />;
    case "content":
      return <ContentTab />;
    case "atoms":
      return <AtomsTab />;
    case "schedule":
      return <ScheduleTab />;
    case "config":
      return <ConfigTab />;
    case "site":
      return <SiteTab />;
    case "analytics":
      return <AnalyticsTab />;
    default:
      return (
        <div className="text-center py-12 text-muted text-sm">
          Tab not implemented yet
        </div>
      );
  }
}

/** Parse a cookie value from document.cookie by name */
function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export default function AdminOverlay() {
  const { theme, cycleTheme } = useTheme();
  const { toggleModal, isModalOpen } = useAdmin();
  const [scope, setScope] = useState<AdminScope>("all");

  // Read admin scope and auto-open from short-lived cookies set by proxy.ts
  useEffect(() => {
    const scopeCookie = getCookie("admin_scope");
    if (scopeCookie && (scopeCookie === "thoughts" || scopeCookie === "dev")) {
      setScope(scopeCookie);
    }

    const autoOpen = getCookie("admin_autoopen") === "true";
    if (autoOpen && !isModalOpen) {
      const timer = setTimeout(() => toggleModal(), 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminPanel scope={scope}>
      <AdminPanelContent
        scope={scope}
        renderTab={renderTab}
        statusWidget={<TypefullyStatusWidget />}
        liveSiteUrl={scope === "all" ? "/" : `/${scope}`}
        theme={theme}
        onThemeChange={cycleTheme}
      />
    </AdminPanel>
  );
}
