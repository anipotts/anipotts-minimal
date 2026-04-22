import { getServicesWithLatestStatus } from "@anipotts/lib/services";
import ServicesView from "./services-view";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getServicesWithLatestStatus();
  return <ServicesView services={services} />;
}
