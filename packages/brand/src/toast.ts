import {
  FONT_FACE,
  BRAND_BLUE,
  IG_URL,
  PORTFOLIO_URL,
  waitForFont,
} from "./shared";

const STORAGE_KEY = "ani-potts-toast-dismissed";

const STYLES = `
  ${FONT_FACE}

  :host {
    display: block;
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    pointer-events: none;
  }

  .toast {
    max-width: 280px;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    opacity: 0;
    transform: translateY(16px) scale(0.95);
    transition: opacity 350ms ease, transform 350ms ease;
    pointer-events: auto;
    border-left: 3px solid ${BRAND_BLUE};
  }

  .toast.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .toast.hiding {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }

  :host([variant="dark"]) .toast,
  :host(:not([variant])) .toast {
    background: rgba(20, 20, 24, 0.95);
    border-color: ${BRAND_BLUE};
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  :host([variant="light"]) .toast {
    background: rgba(255, 255, 255, 0.97);
    border-color: ${BRAND_BLUE};
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 400;
  }

  :host([variant="dark"]) .title,
  :host(:not([variant])) .title {
    color: rgba(255, 255, 255, 0.8);
  }

  :host([variant="light"]) .title {
    color: rgba(0, 0, 0, 0.75);
  }

  .close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0;
    line-height: 1;
    transition: color 150ms ease;
  }

  :host([variant="dark"]) .close,
  :host(:not([variant])) .close {
    color: rgba(255, 255, 255, 0.3);
  }

  :host([variant="light"]) .close {
    color: rgba(0, 0, 0, 0.25);
  }

  .close:hover { color: ${BRAND_BLUE}; }

  .body {
    font-size: 0.75rem;
    line-height: 1.5;
    margin-bottom: 0.625rem;
  }

  :host([variant="dark"]) .body,
  :host(:not([variant])) .body {
    color: rgba(255, 255, 255, 0.45);
  }

  :host([variant="light"]) .body {
    color: rgba(0, 0, 0, 0.4);
  }

  .cta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6875rem;
    text-decoration: none;
    color: ${BRAND_BLUE};
    transition: opacity 150ms ease;
  }

  .cta:hover { opacity: 0.7; }

  .cta:focus-visible {
    outline: 1px solid ${BRAND_BLUE};
    outline-offset: 3px;
    border-radius: 2px;
  }

  @media (max-width: 640px) {
    :host {
      bottom: 1rem;
      right: 1rem;
      left: 1rem;
    }
    .toast { max-width: none; }
  }
`;

class AniPottsToast extends HTMLElement {
  static observedAttributes = ["variant", "delay"];

  private shadow: ShadowRoot;
  private toast: HTMLDivElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    this.toast = document.createElement("div");
    this.toast.className = "toast";

    // Header row
    const header = document.createElement("div");
    header.className = "header";

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "built by ani potts";

    const close = document.createElement("button");
    close.className = "close";
    close.textContent = "\u00d7";
    close.setAttribute("aria-label", "Dismiss");
    close.addEventListener("click", () => this.dismiss());

    header.appendChild(title);
    header.appendChild(close);

    // Body
    const body = document.createElement("div");
    body.className = "body";
    body.textContent = "check out my other projects";

    // CTA
    const cta = document.createElement("a");
    cta.className = "cta";
    cta.href = IG_URL;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.textContent = "@anipottsbuilds \u2192";

    this.toast.appendChild(header);
    this.toast.appendChild(body);
    this.toast.appendChild(cta);

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.toast);
  }

  connectedCallback() {
    // Check if already dismissed on this domain
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        this.remove();
        return;
      }
    } catch {
      // localStorage not available
    }

    const delay = parseInt(this.getAttribute("delay") || "3000", 10);

    waitForFont(this.toast);

    setTimeout(() => {
      this.toast.classList.add("visible");
    }, delay);

    // Auto-dismiss after 12 seconds
    setTimeout(() => {
      if (this.toast.classList.contains("visible")) {
        this.dismiss();
      }
    }, delay + 12000);
  }

  private dismiss() {
    this.toast.classList.add("hiding");
    this.toast.classList.remove("visible");

    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage not available
    }

    setTimeout(() => this.remove(), 400);
  }
}

if (!customElements.get("ani-potts-toast")) {
  customElements.define("ani-potts-toast", AniPottsToast);
}
