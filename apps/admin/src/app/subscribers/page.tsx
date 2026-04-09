import { fetchSubscribers } from "../actions";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const result = await fetchSubscribers();

  if ("error" in result) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
          <h2 className="text-[13px] font-medium text-zinc-200">Subscribers</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500 text-[12px]">{result.error}</p>
        </div>
      </div>
    );
  }

  const subscribers = result.subscribers || [];
  const count = result.count || subscribers.length;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[13px] font-medium text-zinc-200">Subscribers</h2>
          <span className="text-[11px] text-zinc-600">{count} total</span>
        </div>
        <a
          href="https://buttondown.com/anipotts/subscribers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Buttondown dashboard
        </a>
      </div>

      <div className="flex-1 overflow-y-auto admin-scroll">
        {subscribers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-[12px]">No subscribers yet</p>
          </div>
        ) : (
          <div>
            <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800/40 px-6 py-2 flex items-center gap-4 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              <span className="flex-1">Email</span>
              <span className="w-24 text-right">Joined</span>
            </div>

            {subscribers.map((sub) => (
              <div key={sub.id} className="admin-row">
                <span className="flex-1 text-[12px] text-zinc-300 truncate">
                  {sub.email}
                </span>
                {sub.tags && sub.tags.length > 0 && (
                  <span className="flex items-center gap-1">
                    {sub.tags.map((tag) => (
                      <span
                        key={tag}
                        className="admin-badge bg-zinc-800 text-zinc-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
                <span className="w-24 text-right text-[11px] text-zinc-600 tabular-nums">
                  {new Date(sub.creation_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
