"use client";

import { useEffect } from "react";
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

interface AdminOverlayProps {
  scope?: AdminScope;
  autoOpen?: boolean;
}

export default function AdminOverlay({ scope = "all", autoOpen = false }: AdminOverlayProps) {
  const { theme, cycleTheme } = useTheme();
  const { toggleModal, isModalOpen } = useAdmin();

  useEffect(() => {
    if (autoOpen && !isModalOpen) {
      const timer = setTimeout(() => toggleModal(), 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

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
