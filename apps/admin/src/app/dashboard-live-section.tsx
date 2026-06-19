import {
  getMiniRudy,
  getMiniSessions,
  getMiniVaultStats,
} from "@anipotts/lib/mini";
import LiveDashboard from "./live-dashboard";

export async function LiveDashboardWrapper() {
  const [rudy, vault, sessions] = await Promise.all([
    getMiniRudy(),
    getMiniVaultStats(),
    getMiniSessions(),
  ]);

  return <LiveDashboard initial={{ rudy, vault, sessions }} />;
}
