import { FONT_FACE, BRAND_BLUE, IG_URL, waitForFont } from "./shared";

const STYLES = `
  ${FONT_FACE}

  :host {
    display: block;
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    z-index: 40;
  }

  .trigger {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.625rem;
    font-weight: 400;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 150ms ease, color 150ms ease, transform 200ms ease, opacity 300ms ease;
    opacity: 0;
    padding: 0;
  }

  .trigger.loaded { opacity: 1; }

  :host([variant="dark"]) .trigger,
  :host(:not([variant])) .trigger {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.3);
  }

  :host([variant="light"]) .trigger {
    background: rgba(0, 0, 0, 0.04);
    color: rgba(0, 0, 0, 0.25);
  }

  .trigger:hover {
    background: ${BRAND_BLUE}20;
    color: ${BRAND_BLUE};
    transform: scale(1.1);
  }

  .panel {
    position: absolute;
    bottom: 2rem;
    left: 0;
    min-width: 220px;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6875rem;
    line-height: 1.6;
    opacity: 0;
    transform: translateY(8px) scale(0.96);
    transition: opacity 200ms ease, transform 200ms ease;
    pointer-events: none;
  }

  .panel.open {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  :host([variant="dark"]) .panel,
  :host(:not([variant])) .panel {
    background: rgba(20, 20, 24, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  :host([variant="light"]) .panel {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .panel a {
    color: ${BRAND_BLUE};
    text-decoration: none;
    transition: opacity 150ms ease;
  }

  .panel a:hover { opacity: 0.7; }

  .panel a:focus-visible {
    outline: 1px solid ${BRAND_BLUE};
    outline-offset: 2px;
    border-radius: 2px;
  }

  .divider {
    height: 1px;
    margin: 0.5rem 0;
  }

  :host([variant="dark"]) .divider,
  :host(:not([variant])) .divider {
    background: rgba(255, 255, 255, 0.06);
  }

  :host([variant="light"]) .divider {
    background: rgba(0, 0, 0, 0.06);
  }
`;

function buildPanelContent(stack: string): DocumentFragment {
  const fragment = document.createDocumentFragment();

  const stackText = document.createTextNode(`Built with ${stack}`);
  fragment.appendChild(stackText);

  const divider = document.createElement("div");
  divider.className = "divider";
  fragment.appendChild(divider);

  const byText = document.createTextNode("by ");
  fragment.appendChild(byText);

  const link = document.createElement("a");
  link.href = IG_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "@anipottsbuilds";
  fragment.appendChild(link);

  return fragment;
}

class AniPottsColophon extends HTMLElement {
  static observedAttributes = ["variant", "z"];

  private shadow: ShadowRoot;
  private trigger: HTMLButtonElement;
  private panel: HTMLDivElement;
  private isOpen = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    this.trigger = document.createElement("button");
    this.trigger.className = "trigger";
    this.trigger.textContent = "i";
    this.trigger.setAttribute("aria-label", "Site credits");
    this.trigger.addEventListener("click", () => this.toggle());

    this.panel = document.createElement("div");
    this.panel.className = "panel";

    const stack = "Next.js + Vercel";
    this.panel.appendChild(buildPanelContent(stack));

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.panel);
    this.shadow.appendChild(this.trigger);
  }

  connectedCallback() {
    const z = this.getAttribute("z");
    if (z) this.style.zIndex = z;

    const stack = this.getAttribute("stack");
    if (stack) {
      this.panel.textContent = "";
      this.panel.appendChild(buildPanelContent(stack));
    }

    waitForFont(this.trigger);

    document.addEventListener("click", (e) => {
      if (!this.contains(e.target as Node) && this.isOpen) {
        this.toggle();
      }
    });
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    val: string | null,
  ) {
    if (name === "z") {
      this.style.zIndex = val || "40";
    }
  }

  private toggle() {
    this.isOpen = !this.isOpen;
    this.panel.classList.toggle("open", this.isOpen);
  }
}

if (!customElements.get("ani-potts-colophon")) {
  customElements.define("ani-potts-colophon", AniPottsColophon);
}
