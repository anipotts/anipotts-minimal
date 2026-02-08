"use client";

import { useEffect } from "react";
import { AdminPanel, AdminPanelContent, type AdminTabId, type AdminScope } from "@anipotts/ui/admin";
import { useTheme } from "@anipotts/ui";
import { useAdmin } from "@/context/AdminContext";
import PipelineTab from "@/app/admin/tabs/PipelineTab";
import ContentTab from "@/app/admin/tabs/ContentTab";
import AtomsTab from "@/app/admin/tabs/AtomsTab";
import ScheduleTab from "@/app/admin/tabs/ScheduleTab";
import ConfigTab from "@/app/admin/tabs/ConfigTab";
import AnalyticsTab from "@/app/admin/tabs/AnalyticsTab";
import TypefullyStatusWidget from "@/app/admin/TypefullyStatusWidget";

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
