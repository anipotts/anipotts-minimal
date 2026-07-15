import React, { type ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Badge } from "@astryxdesign/core/Badge";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import type { NavItem } from "../../data/admin";

type AdminShellProps = {
  children: ReactNode;
  chrome: "admin" | "auth";
  currentPath: string;
  deck?: string;
  hideHeader?: boolean;
  navItems: NavItem[];
  title: string;
};

const MOBILE_NAV_HREFS = new Set(["/inbox", "/content", "/fleet", "/proof"]);

export function AdminShell({
  children,
  chrome,
  currentPath,
  deck,
  hideHeader = false,
  navItems,
  title,
}: AdminShellProps) {
  if (chrome === "auth") {
    return (
      <main className="admin-auth-frame">
        <section className="admin-auth-card">{children}</section>
      </main>
    );
  }

  const life = navItems.filter((item) => item.group === "life");
  const content = navItems.filter((item) => item.group === "content");
  const system = navItems.filter((item) => item.group === "system");
  const mobileItems = navItems.filter((item) =>
    MOBILE_NAV_HREFS.has(item.href),
  );

  const sideNav = (
    <SideNav
      className="admin-side-nav"
      header={
        <SideNavHeading
          heading="anipotts admin"
          headingHref="/inbox"
          subheading="operator console"
          icon={
            <span className="admin-mark" aria-hidden="true">
              <img src="/apple-touch-icon.png" alt="" />
            </span>
          }
        />
      }
      footer={
        <div className="admin-nav-footer">
          <div className="admin-nav-footer-row">
            <StatusDot variant="warning" label="Access outer guard active" />
            <span>Access on</span>
          </div>
          <p>remove only after app-native passkey proof is ready.</p>
          <ThemeToggle />
        </div>
      }
    >
      <SideNavSection title="life">
        {life.map((item) => (
          <SideNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            isSelected={isActive(currentPath, item.href)}
            endContent={<Badge label={item.status} variant="neutral" />}
          />
        ))}
      </SideNavSection>
      <SideNavSection title="content">
        {content.map((item) => (
          <SideNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            isSelected={isActive(currentPath, item.href)}
          />
        ))}
      </SideNavSection>
      <SideNavSection title="system">
        {system.map((item) => (
          <SideNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            isSelected={isActive(currentPath, item.href)}
          />
        ))}
      </SideNavSection>
    </SideNav>
  );

  return (
    <div className="admin-astryx-root">
      <nav className="admin-mobile-strip" aria-label="admin mobile navigation">
        {mobileItems.map((item) => (
          <a
            key={item.href}
            className={isActive(currentPath, item.href) ? "is-active" : ""}
            href={item.href}
          >
            {item.label}
          </a>
        ))}
        <ThemeToggle />
      </nav>
      <AppShell
        variant="section"
        height="auto"
        contentPadding={0}
        mobileNav={false}
        sideNav={sideNav}
      >
        <div className="admin-page-frame">
          {!hideHeader && (
            <header className="page-header">
              <div>
                <p>admin.anipotts.com</p>
                <h1>{title}</h1>
              </div>
              {deck ? <span>{deck}</span> : null}
            </header>
          )}
          <div className="admin-page-content">{children}</div>
        </div>
      </AppShell>
    </div>
  );
}

function ThemeToggle() {
  return (
    <button
      type="button"
      className="admin-theme-toggle"
      data-theme-toggle=""
      aria-label="switch color theme"
      aria-pressed={false}
    >
      <span data-theme-label="">theme</span>
    </button>
  );
}

function isActive(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
