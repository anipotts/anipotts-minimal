import React from "react";

const projectionKinds = ["projects", "tasks", "history"] as const;

const lifeSurfaces = [
  {
    href: "/life/health",
    title: "health",
    status: "status only",
    description: "status unavailable",
  },
  {
    href: "/life/aesthetics",
    title: "aesthetics",
    status: "references",
    description: "no saved references",
  },
] as const;

const aestheticsSurfaces = [
  "wardrobe",
  "outfits",
  "looks",
  "references",
  "personal style",
] as const;

const systemSurfaces = [
  {
    href: "/proof",
    title: "proof and auth",
    detail: "passkey, route, and operation proof",
  },
  {
    href: "/deploys",
    title: "deploys",
    detail: "scoped target map and deployment proof",
  },
  {
    href: "/repos",
    title: "repos",
    detail: "branch state and drift detail",
  },
  {
    href: "/handoffs",
    title: "handoffs",
    detail: "freshness and absorption status",
  },
  {
    href: "/mutations",
    title: "mutations",
    detail: "gated operation state",
  },
  {
    href: "/ops/destructive",
    title: "destructive ops",
    detail: "visible audit boundary",
  },
] as const;

export function WorkView({ isLoading = false }: { isLoading?: boolean }) {
  return (
    <>
      <section className="meta-strip" aria-label="work projection state">
        <span>read only</span>
        <span>{isLoading ? "loading" : "empty"}</span>
      </section>

      <section
        className={`projection-board${isLoading ? " is-loading" : ""}`}
        aria-busy={isLoading}
        aria-live="polite"
      >
        <div className="section-head">
          <div>
            <p>work</p>
            <h2>{isLoading ? "Loading work" : "No active work"}</h2>
          </div>
          <span>{isLoading ? "loading" : "empty"}</span>
        </div>

        <div className="projection-columns">
          {projectionKinds.map((kind) => (
            <section
              className="projection-column"
              aria-label={`${kind} projection`}
              key={kind}
            >
              <span>{kind}</span>
              {isLoading ? (
                <div className="projection-skeleton" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              ) : (
                <p>No {kind}.</p>
              )}
            </section>
          ))}
        </div>

        {!isLoading && (
          <div className="projection-empty">
            <a className="button secondary" href="/inbox">
              return to inbox
            </a>
          </div>
        )}
      </section>
    </>
  );
}

export function LifeView() {
  return (
    <section className="quiet-overview" aria-label="life overview">
      <div className="quiet-intro">
        <p>overview</p>
        <h2>Status and references.</h2>
        <span>Health, wardrobe, outfits, looks, references, and style.</span>
      </div>

      <div className="quiet-route-list">
        {lifeSurfaces.map((surface) => (
          <a href={surface.href} className="quiet-route-row" key={surface.href}>
            <div>
              <span>{surface.status}</span>
              <strong>{surface.title}</strong>
            </div>
            <p>{surface.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

export function HealthView() {
  return (
    <>
      <section className="meta-strip" aria-label="health route policy">
        <span>status only</span>
        <span>unavailable</span>
      </section>

      <section className="quiet-status-panel">
        <div>
          <p>health</p>
          <h2>Health status unavailable.</h2>
        </div>
        <a className="button secondary" href="/life">
          back to life
        </a>
      </section>
    </>
  );
}

export function AestheticsView() {
  return (
    <>
      <section className="meta-strip" aria-label="aesthetics state">
        <span>read only</span>
        <span>empty</span>
      </section>

      <section className="aesthetics-shell">
        <div className="quiet-intro compact">
          <p>references</p>
          <h2>No saved references.</h2>
        </div>

        <div className="aesthetics-list">
          {aestheticsSurfaces.map((surface) => (
            <article key={surface}>
              <strong>{surface}</strong>
              <span>empty</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function SystemView() {
  return (
    <>
      <section className="meta-strip" aria-label="system overview state">
        <span>read only</span>
        <span>Access on</span>
        <span>mutations gated</span>
      </section>

      <nav className="system-route-grid" aria-label="system routes">
        {systemSurfaces.map((surface) => (
          <a href={surface.href} key={surface.href}>
            <strong>{surface.title}</strong>
            <span>{surface.detail}</span>
          </a>
        ))}
      </nav>

      <div className="notice system-inbox-note">
        <a href="/inbox?category=system">Open the system inbox filter.</a>
      </div>
    </>
  );
}
