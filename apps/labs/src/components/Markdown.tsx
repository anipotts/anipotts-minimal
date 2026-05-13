import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-base prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-[color:var(--muted)] prose-a:text-[color:var(--accent)] prose-a:no-underline hover:prose-a:underline prose-code:bg-[color:var(--surface)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[color:var(--surface)] prose-pre:text-[color:var(--text)] prose-table:text-sm prose-th:font-medium">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
