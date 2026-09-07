import type { SystemsLifecycle } from "@anipotts/content/public";

type Box = {
  x: number;
  y: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};
const mounted = new WeakSet<HTMLElement>();

export function initializeLifecycleMaps() {
  document.querySelectorAll<HTMLElement>("[data-lifecycle]").forEach((root) => {
    if (mounted.has(root)) return;
    mounted.add(root);
    const graph: SystemsLifecycle = JSON.parse(
      root.querySelector("[data-graph]")!.textContent!,
    );
    const canvas = root.querySelector<HTMLElement>("[data-canvas]")!;
    const svg = root.querySelector<SVGSVGElement>(".connections")!;
    const walkthrough =
      root.querySelector<HTMLDetailsElement>("[data-walkthrough]")!;
    const back = root.querySelector<HTMLButtonElement>("[data-back]")!;
    const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
    const reset = root.querySelector<HTMLButtonElement>("[data-reset]")!;
    const controls = root.querySelector<HTMLElement>(".walkthrough-controls")!;
    const more = root.querySelector<HTMLDetailsElement>(".more-sources")!;
    const nodeElements = new Map(
      Array.from(root.querySelectorAll<HTMLElement>("[data-node]")).map(
        (el) => [el.dataset.node!, el],
      ),
    );
    const edgeElements = new Map(
      Array.from(root.querySelectorAll<SVGGElement>("[data-edge]")).map(
        (el) => [el.dataset.edge!, el],
      ),
    );
    let step = 0;
    let frame = 0;
    const point = (el: Element): Box => {
      const rect = el.getBoundingClientRect(),
        parent = canvas.getBoundingClientRect();
      return {
        x: rect.left - parent.left + rect.width / 2,
        y: rect.top - parent.top + rect.height / 2,
        left: rect.left - parent.left,
        right: rect.right - parent.left,
        top: rect.top - parent.top,
        bottom: rect.bottom - parent.top,
      };
    };

    function draw() {
      const mobile = matchMedia("(max-width:699px)").matches;
      const gather = point(nodeElements.get("gather")!);
      const complete = point(nodeElements.get("complete")!);
      const human = root.querySelector<HTMLElement>(".human-area")!;
      human.style.top = gather.y - (mobile ? 28 : 44) + "px";
      root.querySelector<HTMLElement>(".feedback")!.style.top =
        complete.y - 24 + "px";
      const contextArea = root.querySelector<HTMLElement>(".context-area")!;
      if (!mobile) contextArea.style.top = gather.y - 24 + "px";
      else contextArea.style.removeProperty("top");
      const infrastructure =
        root.querySelector<HTMLElement>(".infrastructure")!;
      const spine = point(root.querySelector(".spine")!);
      const extra = !mobile
        ? Math.max(0, point(contextArea).bottom - spine.bottom + 32)
        : 0;
      infrastructure.style.marginTop = extra + "px";
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const boxes = new Map(
        [...nodeElements].map(([id, el]) => [id, point(el)]),
      );
      const act = boxes.get("act")!,
        ani = boxes.get("ani")!;
      const laneR = act.right + (mobile ? 13 : 36),
        laneL = act.left - (mobile ? 13 : 36);
      for (const edge of graph.edges) {
        const group = edgeElements.get(edge.id)!;
        const a = boxes.get(edge.source)!,
          b = boxes.get(edge.destination)!;
        let d = "",
          tx = (a.x + b.x) / 2,
          ty = (a.y + b.y) / 2,
          rotate = 0;
        const line = (...points: number[][]) =>
          points.map(([x, y], i) => (i ? "L" : "M") + x + " " + y).join(" ");
        const branch = (x: number) => {
          d = line([a.right, a.y], [x, a.y], [x, b.y], [b.right, b.y]);
          tx = x + 8;
          ty = (a.y + b.y) / 2;
          rotate = -90;
        };
        switch (edge.id) {
          case "start": {
            const header = point(root.querySelector(".execution-heading")!);
            d =
              line([a.x, a.bottom], [a.x, header.top - 9]) +
              " " +
              line([a.x, header.bottom + 8], [b.x, b.top]);
            break;
          }
          case "scope":
          case "ready":
          case "check":
          case "finish":
            d = line([a.x, a.bottom], [b.x, b.top]);
            ty = (a.bottom + b.top) / 2;
            break;
          case "lookup":
          case "context_back": {
            const from = boxes.get("gather")!,
              dest = boxes.get("context")!;
            const y = from.y + (edge.id === "lookup" ? -7 : 7);
            if (mobile) {
              const x = 7 + (edge.id === "lookup" ? 0 : 6);
              d =
                edge.id === "lookup"
                  ? line(
                      [from.left, y],
                      [x, y],
                      [x, dest.y],
                      [dest.left, dest.y],
                    )
                  : line(
                      [dest.left, dest.y + 7],
                      [x, dest.y + 7],
                      [x, y],
                      [from.left, y],
                    );
              tx = x + 6;
              ty = from.y + 85;
              rotate = -90;
            } else {
              d =
                edge.id === "lookup"
                  ? line([from.left, y], [dest.right, y])
                  : line([dest.right, y], [from.left, y]);
              tx = (from.left + dest.right) / 2;
              ty = y + (edge.id === "lookup" ? -9 : 17);
            }
            break;
          }
          case "more_work":
            branch(laneR);
            break;
          case "missing_context":
            d = line(
              [a.left, a.y],
              [laneL, a.y],
              [laneL, b.y + 22],
              [b.left, b.y + 22],
            );
            tx = mobile ? laneL + 8 : laneL - 7;
            ty = (a.y + b.y) / 2;
            rotate = -90;
            break;
          case "decision":
            d = line(
              [a.right, a.y - 14],
              [laneR + (mobile ? 13 : 25), a.y - 14],
              [laneR + (mobile ? 13 : 25), ani.y + 8],
              [ani.left, ani.y + 8],
            );
            tx = laneR + (mobile ? 20 : 34);
            ty = (a.y + ani.bottom) / 2;
            rotate = -90;
            break;
          case "answer":
            d = line(
              [ani.left, ani.y - 8],
              [laneR, ani.y - 8],
              [laneR, act.top - 24],
              [act.x, act.top - 24],
              [act.x, act.top],
            );
            tx = act.x;
            ty = act.top - 32;
            break;
          case "new_goal":
            d = line([ani.x, ani.top], [ani.x, b.y], [b.right, b.y]);
            tx = ani.x - 8;
            ty = (ani.top + b.bottom) / 2;
            rotate = -90;
            break;
          case "ani_start":
            d = line(
              [ani.right, ani.y],
              [width - 6, ani.y],
              [width - 6, b.y],
              [b.right, b.y],
            );
            tx = width - 13;
            ty = (ani.y + b.y) / 2;
            rotate = -90;
            break;
          case "record_failed":
            d = line(
              [a.right, a.y + 8],
              [laneR, a.y + 8],
              [laneR, a.bottom + 30],
              [a.x, a.bottom + 30],
              [a.x, a.bottom],
            );
            tx = a.x;
            ty = a.bottom + 44;
            break;
          case "persist": {
            const x = mobile ? 3 : width * 0.255;
            d = line(
              [a.left, a.y],
              [x, a.y],
              [x, b.top + 6],
              [mobile ? b.left + 8 : b.right, b.top + 6],
            );
            tx = mobile ? x + 7 : x - 8;
            ty = mobile ? a.y - 80 : (a.y + b.bottom) / 2;
            rotate = -90;
            break;
          }
          case "receipts":
            d = line(
              [a.x, a.bottom],
              [a.x, a.bottom + 62],
              [mobile ? width - 20 : b.x, a.bottom + 62],
              [mobile ? width - 20 : b.x, b.top - 12],
              [b.x, b.top - 12],
              [b.x, b.top],
            );
            tx = b.x + 35;
            ty = b.top - 9;
            break;
          case "archive_copy":
            d = line(
              [
                mobile ? width - 20 : boxes.get("runtime")!.x,
                boxes.get("runtime")!.top - 12,
              ],
              [width - 12, boxes.get("runtime")!.top - 12],
              [width - 12, b.y],
              [b.right, b.y],
            );
            tx = width - 20;
            ty = b.y - 40;
            rotate = -90;
            break;
          case "runtime_access": {
            const x = width - 2;
            d = line(
              [a.right, a.y],
              [x, a.y],
              [x, act.bottom + 28],
              [act.x, act.bottom + 28],
              [act.x, act.bottom],
            );
            tx = x - 8;
            ty = act.bottom + 90;
            rotate = -90;
            break;
          }
          case "followup":
            d = line([a.right, a.y - 12], [b.left, b.y - 12]);
            tx = (a.right + b.left) / 2;
            ty = a.y - 22;
            break;
          case "followup_due":
            d = line(
              [a.right, a.y],
              [width - (mobile ? 1 : 18), a.y],
              [width - (mobile ? 1 : 18), b.top - 18],
              [b.x, b.top - 18],
              [b.x, b.top],
            );
            tx = width - (mobile ? 8 : 25);
            ty = b.bottom + 80;
            rotate = -90;
            break;
          case "needs_me":
            d = line(
              [
                mobile ? gather.left : a.right,
                mobile ? gather.y - 18 : a.y - 18,
              ],
              [laneL, mobile ? gather.y - 18 : a.y - 18],
              [laneL, gather.top - 24],
              [ani.x, gather.top - 24],
              [ani.x, ani.top],
            );
            tx = gather.x;
            ty = gather.top - 32;
            break;
          case "answer_context":
            d = line(
              [ani.left, ani.y - 8],
              [laneR, ani.y - 8],
              [laneR, b.y + 12],
              [b.right, b.y + 12],
            );
            break;
          case "record_blocked":
            d = line(
              [a.right, a.y + 8],
              [laneR + (mobile ? 13 : 25), a.y + 8],
              [laneR + (mobile ? 13 : 25), ani.y + 8],
              [ani.left, ani.y + 8],
            );
            tx = laneR + (mobile ? 20 : 34);
            ty = a.top - 60;
            rotate = -90;
            break;
          case "answer_record":
            d = line(
              [ani.left, ani.y + 8],
              [laneR + (mobile ? 13 : 25), ani.y + 8],
              [laneR + (mobile ? 13 : 25), b.y + 8],
              [b.right, b.y + 8],
            );
            break;
          case "read_records":
          case "access":
            d = line(
              [a.left + 2, a.top + 6],
              [Math.max(1, Math.min(a.left, b.left) - 8), a.top + 6],
              [Math.max(1, Math.min(a.left, b.left) - 8), b.y],
              [b.left, b.y],
            );
            break;
          case "learn":
            d = line(
              [a.x, a.bottom],
              [a.x, complete.bottom + 60],
              [laneL - 15, complete.bottom + 60],
              [laneL - 15, mobile ? b.top - 12 : b.y + 20],
              [b.x, mobile ? b.top - 12 : b.y + 20],
              [b.x, mobile ? b.top : b.bottom],
            );
            tx = (a.x + laneL - 15) / 2;
            ty = complete.bottom + 76;
            break;
          default:
            d = line([a.x, a.bottom], [b.x, b.top]);
        }
        group.querySelector("path")!.setAttribute("d", d);
        const label = group.querySelector("text")!;
        label.setAttribute("x", String(tx));
        label.setAttribute("y", String(ty));
        label.setAttribute(
          "transform",
          rotate ? `rotate(${rotate} ${tx} ${ty})` : "",
        );
        // Paired arrows share a compact label on narrow screens.
        label.style.display =
          [
            "read_records",
            "access",
            "answer_context",
            "answer_record",
          ].includes(edge.id) ||
          (mobile &&
            [
              "context_back",
              "lookup",
              "scope",
              "ready",
              "check",
              "archive_copy",
            ].includes(edge.id))
            ? "none"
            : "";
      }
      root.dataset.connected = "";
    }

    function scheduleDraw() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    }
    function update() {
      const state = graph.walkthrough[step];
      root.toggleAttribute("data-walking", walkthrough.open);
      nodeElements.forEach((el, id) =>
        el.toggleAttribute(
          "data-active",
          walkthrough.open && state.nodes.includes(id),
        ),
      );
      edgeElements.forEach((el, id) =>
        el.toggleAttribute(
          "data-active",
          walkthrough.open && state.edges.includes(id),
        ),
      );
      root.querySelector("[data-step-count]")!.textContent =
        `${step + 1} / ${graph.walkthrough.length}`;
      root.querySelector("[data-step-title]")!.textContent = state.title;
      root.querySelector("[data-step-detail]")!.textContent = state.detail;
      back.disabled = step === 0;
      next.disabled = step === graph.walkthrough.length - 1;
      scheduleDraw();
    }
    back.addEventListener("click", () => {
      step = Math.max(0, step - 1);
      update();
    });
    next.addEventListener("click", () => {
      step = Math.min(graph.walkthrough.length - 1, step + 1);
      update();
    });
    reset.addEventListener("click", () => {
      step = 0;
      update();
    });
    walkthrough.addEventListener("toggle", update);
    more.addEventListener("toggle", scheduleDraw);
    controls.hidden = false;
    const observer = new ResizeObserver(scheduleDraw);
    observer.observe(canvas);
    nodeElements.forEach((el) => observer.observe(el));
    observer.observe(contextAreaElement());
    function contextAreaElement() {
      return root.querySelector<HTMLElement>(".context-area")!;
    }
    window.addEventListener("resize", scheduleDraw);
    document.fonts.ready.then(scheduleDraw);
    update();
    document.addEventListener(
      "astro:before-swap",
      () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", scheduleDraw);
      },
      { once: true },
    );
  });
}
