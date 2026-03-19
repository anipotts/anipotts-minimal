"use strict";var AniPottsToast=(()=>{var b="https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2",c="#61abea",o="#61abea",d="https://instagram.com/anipottsbuilds";var h=`
  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${b}) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
      U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
      U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`,u=`
  :host([variant="dark"]) a,
  :host(:not([variant])) a {
    color: rgba(255, 255, 255, 0.4);
  }
  :host([variant="dark"]) a:hover,
  :host([variant="dark"]) a:focus-visible,
  :host(:not([variant])) a:hover,
  :host(:not([variant])) a:focus-visible {
    color: ${c};
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(255, 255, 255, 0.1);
  }
  :host([variant="light"]) a {
    color: rgba(0, 0, 0, 0.35);
  }
  :host([variant="light"]) a:hover,
  :host([variant="light"]) a:focus-visible {
    color: ${c};
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.5), 0 0 2px rgba(255, 255, 255, 0.3);
  }
  a:focus-visible {
    outline: 1px solid ${c};
    outline-offset: 4px;
    border-radius: 2px;
  }
`;function m(r,t=1500){document.fonts.ready.then(()=>r.classList.add("loaded")),setTimeout(()=>r.classList.add("loaded"),t)}var p="ani-potts-toast-dismissed",f=`
  ${h}

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
    border-left: 3px solid ${o};
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
    border-color: ${o};
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  :host([variant="light"]) .toast {
    background: rgba(255, 255, 255, 0.97);
    border-color: ${o};
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

  .close:hover { color: ${o}; }

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
    color: ${o};
    transition: opacity 150ms ease;
  }

  .cta:hover { opacity: 0.7; }

  .cta:focus-visible {
    outline: 1px solid ${o};
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
`,i=class extends HTMLElement{constructor(){super(),this.shadow=this.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=f,this.toast=document.createElement("div"),this.toast.className="toast";let s=document.createElement("div");s.className="header";let n=document.createElement("span");n.className="title",n.textContent="built by ani potts";let a=document.createElement("button");a.className="close",a.textContent="\xD7",a.setAttribute("aria-label","Dismiss"),a.addEventListener("click",()=>this.dismiss()),s.appendChild(n),s.appendChild(a);let l=document.createElement("div");l.className="body",l.textContent="check out my other projects";let e=document.createElement("a");e.className="cta",e.href=d,e.target="_blank",e.rel="noopener noreferrer",e.textContent="@anipottsbuilds \u2192",this.toast.appendChild(s),this.toast.appendChild(l),this.toast.appendChild(e),this.shadow.appendChild(t),this.shadow.appendChild(this.toast)}connectedCallback(){try{if(localStorage.getItem(p)){this.remove();return}}catch{}let t=parseInt(this.getAttribute("delay")||"3000",10);m(this.toast),setTimeout(()=>{this.toast.classList.add("visible")},t),setTimeout(()=>{this.toast.classList.contains("visible")&&this.dismiss()},t+12e3)}dismiss(){this.toast.classList.add("hiding"),this.toast.classList.remove("visible");try{localStorage.setItem(p,"1")}catch{}setTimeout(()=>this.remove(),400)}};i.observedAttributes=["variant","delay"];customElements.get("ani-potts-toast")||customElements.define("ani-potts-toast",i);})();
