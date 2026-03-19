"use strict";var AniPottsColophon=(()=>{var g="https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2",l="#61abea",n="#61abea",d="https://instagram.com/anipottsbuilds";var c=`
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${g}) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
      U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`,b=`
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.4);
  }
  :host([variant="dark"]) a:hover,
  :host([variant="dark"]) a:focus-visible,
  :host(:not([variant])) a:hover,
  :host(:not([variant])) a:focus-visible {
    color: ${l};
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(255, 255, 255, 0.1);
  }
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.35);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${l};
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.5), 0 0 2px rgba(255, 255, 255, 0.3);
  }
  a:focus-visible {
    outline: 1px solid ${l};
    outline-offset: 4px;
    border-radius: 2px;
  }
`;function p(o,e=1500){document.fonts.ready.then(()=>o.classList.add("loaded")),setTimeout(()=>o.classList.add("loaded"),e)}var m=`
  ${c}

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
    background: ${n}20;
    color: ${n};
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
    color: ${n};
    text-decoration: none;
    transition: opacity 150ms ease;
  }

  .panel a:hover { opacity: 0.7; }

  .panel a:focus-visible {
    outline: 1px solid ${n};
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
`;function h(o){let e=document.createDocumentFragment(),t=document.createTextNode(`Built with ${o}`);e.appendChild(t);let a=document.createElement("div");a.className="divider",e.appendChild(a);let r=document.createTextNode("by ");e.appendChild(r);let i=document.createElement("a");return i.href=d,i.target="_blank",i.rel="noopener noreferrer",i.textContent="@anipottsbuilds",e.appendChild(i),e}var s=class extends HTMLElement{constructor(){super();this.isOpen=!1;this.shadow=this.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=m,this.trigger=document.createElement("button"),this.trigger.className="trigger",this.trigger.textContent="i",this.trigger.setAttribute("aria-label","Site credits"),this.trigger.addEventListener("click",()=>this.toggle()),this.panel=document.createElement("div"),this.panel.className="panel",this.panel.appendChild(h("Next.js + Vercel")),this.shadow.appendChild(t),this.shadow.appendChild(this.panel),this.shadow.appendChild(this.trigger)}connectedCallback(){let t=this.getAttribute("z");t&&(this.style.zIndex=t);let a=this.getAttribute("stack");a&&(this.panel.textContent="",this.panel.appendChild(h(a))),p(this.trigger),document.addEventListener("click",r=>{!this.contains(r.target)&&this.isOpen&&this.toggle()})}attributeChangedCallback(t,a,r){t==="z"&&(this.style.zIndex=r||"40")}toggle(){this.isOpen=!this.isOpen,this.panel.classList.toggle("open",this.isOpen)}};s.observedAttributes=["variant","z"];customElements.get("ani-potts-colophon")||customElements.define("ani-potts-colophon",s);})();
