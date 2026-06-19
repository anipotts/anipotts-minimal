import { getQCFeatureFlags } from "@anipotts/lib/quantercise";
import { ErrorPanel, getQCEnv } from "../components";
import { FlagsGroups, FlagsSummary } from "./flags-sections";

export async function FlagsContent() {
  let data: Awaited<ReturnType<typeof getQCFeatureFlags>>;

  try {
    data = await getQCFeatureFlags(getQCEnv());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Feature Flags" message={msg} />;
  }

  const { flags, source } = data;
  const categories = [...new Set(flags.map((f) => f.category))].sort();
  const grouped = categories.map((category) => ({
    category,
    flags: flags.filter((flag) => flag.category === category),
  }));

  return (
    <>
      <FlagsSummary flags={flags} source={source} />
      <FlagsGroups groups={grouped} />
    </>
  );
}
