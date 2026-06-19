import { notFound } from "next/navigation";
import { getQCUser } from "@anipotts/lib/quantercise";
import { ErrorPanel, getQCEnv } from "../../components";
import { UserDetailPanels } from "./user-detail-sections";

export async function UserDetailContent({ userId }: { userId: string }) {
  let data: Awaited<ReturnType<typeof getQCUser>>;

  try {
    data = await getQCUser(getQCEnv(), userId);
  } catch (e) {
    if (e instanceof Error && e.message.includes("404")) {
      notFound();
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="User" message={msg} />;
  }

  return <UserDetailPanels userId={userId} user={data.user} />;
}
