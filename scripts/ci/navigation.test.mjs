import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const nav = readFileSync("apps/www/src/components/Nav.astro", "utf8");
const script = nav.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const key = "ap-hover-continuity";
const previous = { x: 30, y: 30, width: 1440, height: 950, time: Date.now() };
function boot(
  saved = previous,
  fine = true,
  blockedStorage = false,
  navigation = "navigate",
) {
  const attrs = new Set();
  const handlers = {};
  const stored = new Map([[key, JSON.stringify(saved)]]);
  const listen = (target) => (name, fn) => {
    handlers[`${target}:${name}`] = fn;
  };
  const mark = {
    getBoundingClientRect: () => ({ left: 10, right: 74, top: 10, bottom: 74 }),
    setAttribute: (name) => attrs.add(name),
    removeAttribute: (name) => attrs.delete(name),
    matches: () => false,
    addEventListener: listen("mark"),
  };
  runInNewContext(script, {
    document: {
      querySelector: () => mark,
      addEventListener: listen("document"),
    },
    window: { addEventListener: listen("window") },
    matchMedia: () => ({ matches: fine, addEventListener: listen("media") }),
    innerWidth: 1440,
    innerHeight: 950,
    performance: { getEntriesByType: () => [{ type: navigation }] },
    sessionStorage: {
      getItem: (k) => {
        if (blockedStorage) throw new Error("blocked");
        return stored.get(k);
      },
      removeItem: (k) => stored.delete(k),
      setItem: (k, v) => stored.set(k, v),
    },
  });
  return { attrs, handlers, stored };
}
const restored = boot();
assert.ok(restored.attrs.has("data-hover-continuity"), "restore before paint");
assert.equal(
  restored.stored.has(key),
  false,
  "consume the one-navigation hint",
);
restored.handlers["window:pagehide"]();
assert.ok(
  restored.stored.has(key),
  "consecutive reload retains pointer position",
);
restored.handlers["document:pointermove"]({ clientX: 200, clientY: 100 });
assert.equal(restored.attrs.size, 0, "pointer departure releases the mark");
restored.handlers["window:pagehide"]();
assert.equal(
  JSON.parse(restored.stored.get(key)).x,
  200,
  "persist outside position so reload can start closed",
);
const embedded = boot();
assert.equal(
  embedded.handlers["window:blur"],
  undefined,
  "reload blur cannot clear hover",
);
assert.equal(
  embedded.handlers["mark:pointerleave"],
  undefined,
  "document teardown cannot clear hover",
);
embedded.handlers["document:pointermove"]({ clientX: 31, clientY: 30 });
assert.ok(
  embedded.attrs.has("data-hover-continuity"),
  "position controls state even when native hover is false",
);
const fresh = boot(null);
fresh.handlers["document:pointerdown"]({
  clientX: 30,
  clientY: 30,
  type: "pointerdown",
});
assert.ok(
  fresh.stored.has(key),
  "save before navigation without relying on pagehide",
);
assert.ok(
  boot(null, true, false, "reload").attrs.has("data-hover-continuity"),
  "unknown reload starts apart",
);
assert.equal(
  boot({ ...previous, x: 200 }, true, false, "reload").attrs.size,
  0,
  "known outside reload starts together",
);
for (const saved of [
  null,
  { ...previous, time: 0 },
  { ...previous, width: 390 },
  { ...previous, x: 200 },
]) {
  assert.equal(boot(saved).attrs.size, 0, "ignore stale or misplaced hints");
}
assert.equal(boot(previous, false).attrs.size, 0, "touch never restores hover");
assert.doesNotThrow(() => boot(previous, true, true));
const shell = readFileSync("apps/www/src/layouts/Shell.astro", "utf8");
const themeBoot = shell.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
for (const stored of ["dark", "light", "invalid", null]) {
  const dataset = {};
  runInNewContext(themeBoot, {
    document: { documentElement: { dataset } },
    localStorage: { getItem: () => stored },
  });
  assert.equal(dataset.theme, stored === "dark" ? "dark" : "light");
}
const blockedTheme = {};
assert.doesNotThrow(() =>
  runInNewContext(themeBoot, {
    document: { documentElement: { dataset: blockedTheme } },
    localStorage: {
      getItem: () => {
        throw new Error("storage unavailable");
      },
    },
  }),
);
assert.equal(blockedTheme.theme, "light");
assert.ok(nav.includes("min-height: 52px"));
assert.ok(nav.includes("navToggle.focus()"));
console.log(
  "navigation: hover continuity, expiry, touch, storage fallback, and menu contracts passed",
);
