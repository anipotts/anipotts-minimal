import { getQCUsers } from "@anipotts/lib/quantercise";
import { ErrorPanel, getQCEnv } from "../components";
import { UsersPanel, UsersSummary } from "./users-sections";

export async function UsersContent({ search }: { search?: string }) {
  let data: Awaited<ReturnType<typeof getQCUsers>>;

  try {
    data = await getQCUsers(getQCEnv());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return (
      <ErrorPanel
        title="Users"
        message={msg}
        hint="Check QUANTERCISE_ADMIN_TOKEN secret."
      />
    );
  }

  let users = data.users;
  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q),
    );
  }

  const counts = {
    total: data.users.length,
    active: data.users.filter((u) => u.subscription.status === "active").length,
    free: data.users.filter((u) => u.subscription.status === "free").length,
  };

  return (
    <>
      <UsersSummary counts={counts} />
      <UsersPanel search={search} users={users} />
    </>
  );
}
