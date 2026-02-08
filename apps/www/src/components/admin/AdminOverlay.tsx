"use client";

import { AdminPanel, AdminPanelContent, type AdminTabId } from "@anipotts/ui/admin";
import { useTheme } from "@anipotts/ui";
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

export default function AdminOverlay() {
  const { theme, cycleTheme } = useTheme();

  return (
    <AdminPanel scope="all">
      <AdminPanelContent
        scope="all"
        renderTab={renderTab}
        statusWidget={<TypefullyStatusWidget />}
        liveSiteUrl="/thoughts"
        theme={theme}
        onThemeChange={cycleTheme}
      />
    </AdminPanel>
  );
}
