import { execFile } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CONTENT_ROOT = join(REPO_ROOT, "content", "public");
const GENERATOR = join(
  REPO_ROOT,
  "scripts",
  "content",
  "generate-public-content.mjs",
);

export function publicContentHotReload() {
  let closed = false;
  let running = false;
  let rerun = false;
  let timer;

  return {
    name: "anipotts-public-content-hot-reload",
    apply: "serve",
    configureServer(server) {
      server.watcher.add(CONTENT_ROOT);

      const generate = () => {
        if (running) {
          rerun = true;
          return;
        }

        running = true;
        execFile(
          process.execPath,
          [GENERATOR],
          { cwd: REPO_ROOT },
          (error, stdout, stderr) => {
            running = false;
            if (closed) return;
            if (error) {
              server.config.logger.error(
                `canonical public content generation failed\n${stderr || error.message}`,
              );
            } else {
              server.config.logger.info(
                `canonical public content updated: ${stdout.trim().split("\n").length} projections`,
              );
              server.ws.send({ type: "full-reload" });
            }

            if (rerun) {
              rerun = false;
              generate();
            }
          },
        );
      };

      const schedule = (path) => {
        const source = relative(CONTENT_ROOT, path);
        if (source.startsWith("..") || !source.endsWith(".md")) return;
        clearTimeout(timer);
        timer = setTimeout(generate, 80);
      };

      server.watcher.on("add", schedule);
      server.watcher.on("change", schedule);
      server.watcher.on("unlink", schedule);

      server.httpServer?.once("close", () => {
        closed = true;
        clearTimeout(timer);
        server.watcher.off("add", schedule);
        server.watcher.off("change", schedule);
        server.watcher.off("unlink", schedule);
      });
    },
  };
}
