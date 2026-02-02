import SignalsBar from "./SignalsBar";
import LiveTime from "./LiveTime";
import { subdomains } from "@anipotts/lib/data";

const footerSubdomains = subdomains.filter((s) => s.name !== "www");

export default function Footer() {
  return (
    <footer className="w-full mt-24 pb-12">
      <SignalsBar />
      <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-xs text-faint font-mono mb-4">
        {footerSubdomains.map((sub, i) => (
          <span key={sub.name}>
            {i > 0 && <span className="mx-1">·</span>}
            <a
              href={sub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-400 transition-colors"
            >
              {sub.name}
            </a>
          </span>
        ))}
      </div>
      <div className="text-xs text-faint font-mono flex justify-between">
        <div>© {new Date().getFullYear()} ani potts</div>
        <div className="flex gap-2">
          <LiveTime />
        </div>
      </div>
    </footer>
  );
}
