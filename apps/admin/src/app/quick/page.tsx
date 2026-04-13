import QuickPostForm from "./quick-post-form";

export default function QuickPostPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-[13px] font-medium text-zinc-200">New Post</h2>
      </div>
      <div className="flex-1 overflow-y-auto admin-scroll p-6">
        <QuickPostForm />
      </div>
    </div>
  );
}
