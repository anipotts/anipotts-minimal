import React, { type ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import {
  SideNav,
  SideNavCollapseButton,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import {
  CaretDownIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  iconForNav,
} from "../admin-icons";
import type { NavItem } from "../../data/admin";

type AdminShellProps = {
  children: ReactNode;
  chrome: "admin" | "auth";
  currentRoute: string;
  deck?: string;
  hideHeader?: boolean;
  navItems: NavItem[];
  title: string;
};

const GROUPS: Array<{
  id: Exclude<NavItem["group"], "home">;
  label: string;
}> = [
  { id: "work", label: "Work" },
  { id: "content", label: "Content" },
  { id: "life", label: "Life" },
  { id: "knowledge", label: "Knowledge" },
  { id: "system", label: "System" },
];

export function AdminShell({
  children,
  chrome,
  currentRoute,
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

  const inbox = navItems.find((item) => item.group === "home");
  const mobileItems = navItems.filter((item) => item.mobile);

  const sideNav = (
    <SideNav
      className="admin-side-nav"
      collapsible={{ hasButton: false }}
      header={
        <div className="admin-nav-header">
          <AdminBrand />
          <button
            type="button"
            className="admin-global-search"
            data-admin-search-trigger=""
            aria-label="search everything"
            aria-keyshortcuts="Meta+K Control+K"
            onClick={() =>
              document.dispatchEvent(new CustomEvent("admin:search"))
            }
          >
            <MagnifyingGlassIcon size={16} aria-hidden="true" />
            <span>Search anything</span>
            <kbd>⌘K</kbd>
          </button>
        </div>
      }
      footerIcons={
        <div className="admin-nav-utilities">
          <ThemeToggle />
          <SideNavCollapseButton />
        </div>
      }
    >
      {inbox ? (
        <SideNavSection title="Inbox" isHeaderHidden>
          <NavEntry item={inbox} currentRoute={currentRoute} />
        </SideNavSection>
      ) : null}
      <SideNavSection title="Admin" isHeaderHidden>
        {GROUPS.map((group) => {
          const parent = navItems.find(
            (item) => item.group === group.id && !item.parent,
          );
          const children = navItems.filter(
            (item) => item.group === group.id && item.parent,
          );
          if (!parent) return null;
          return (
            <NavEntry
              key={group.id}
              item={parent}
              currentRoute={currentRoute}
              collapsible={children.length > 0}
            >
              {children.map((item) => (
                <NavEntry
                  key={item.href}
                  item={item}
                  currentRoute={currentRoute}
                />
              ))}
            </NavEntry>
          );
        })}
      </SideNavSection>
    </SideNav>
  );

  return (
    <div className="admin-astryx-root">
      <header className="admin-mobile-topbar">
        <AdminBrand mobile />
        <button
          type="button"
          className="admin-mobile-search"
          data-admin-search-trigger=""
          aria-label="search everything"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("admin:search"))
          }
        >
          <MagnifyingGlassIcon size={20} aria-hidden="true" />
        </button>
        <details className="admin-mobile-menu">
          <summary
            aria-controls="admin-mobile-menu-panel"
            aria-label="toggle navigation"
          >
            <CaretDownIcon size={20} aria-hidden="true" />
          </summary>
          <nav id="admin-mobile-menu-panel" aria-label="all admin destinations">
            {navItems
              .filter((item) => !item.mobile && item.href !== "/mutations")
              .map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={
                    isActive(currentRoute, item.href) ? "page" : undefined
                  }
                >
                  {item.label}
                </a>
              ))}
          </nav>
        </details>
      </header>
      <nav className="admin-mobile-nav" aria-label="admin mobile navigation">
        {mobileItems.map((item) => {
          const Icon = iconForNav[item.icon];
          return (
            <a
              key={item.href}
              className={isActive(currentRoute, item.href) ? "is-active" : ""}
              href={item.href}
              aria-current={
                isActive(currentRoute, item.href) ? "page" : undefined
              }
            >
              <Icon size={20} weight="regular" aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          );
        })}
        <button
          type="button"
          className={
            currentRoute.split("?")[0] === "/knowledge" ? "is-active" : ""
          }
          aria-label="search everything"
          data-admin-search-trigger=""
          aria-pressed={currentRoute.split("?")[0] === "/knowledge"}
          onClick={() =>
            document.dispatchEvent(new CustomEvent("admin:search"))
          }
        >
          <MagnifyingGlassIcon size={20} aria-hidden="true" />
          <span>search</span>
        </button>
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
              <h1>{title}</h1>
              {deck ? <span>{deck}</span> : null}
            </header>
          )}
          <div className="admin-page-content">{children}</div>
        </div>
      </AppShell>
    </div>
  );
}

function NavEntry({
  item,
  currentRoute,
  collapsible = false,
  children,
}: {
  item: NavItem;
  currentRoute: string;
  collapsible?: boolean;
  children?: ReactNode;
}) {
  const Icon = iconForNav[item.icon];
  const groupIsActive = isGroupActive(currentRoute, item);
  if (collapsible) {
    const firstLabel: Record<string, string> = {
      work: "now",
      content: "library",
      life: "today",
      knowledge: "all",
      system: "overview",
    };
    return (
      <details
        className="admin-nav-group"
        data-admin-nav-group={item.group}
        open={groupIsActive}
      >
        <summary>
          <Icon size={18} weight="regular" aria-hidden="true" />
          <span>{item.label}</span>
          <CaretDownIcon
            className="admin-nav-group-caret"
            size={14}
            aria-hidden="true"
          />
        </summary>
        <div>
          <SideNavItem
            href={item.href}
            label={firstLabel[item.group] ?? item.label}
            isSelected={isActive(currentRoute, item.href)}
          />
          {children}
        </div>
      </details>
    );
  }

  return (
    <SideNavItem
      href={item.href}
      label={item.label}
      icon={<Icon size={18} weight="regular" aria-hidden="true" />}
      selectedIcon={<Icon size={18} weight="fill" aria-hidden="true" />}
      isSelected={isActive(currentRoute, item.href)}
      collapsible={false}
    >
      {children}
    </SideNavItem>
  );
}

function AdminBrand({ mobile = false }: { mobile?: boolean }) {
  return (
    <a
      href="/"
      className={mobile ? "admin-mobile-brand" : "admin-brand-lockup"}
      aria-label="admin home"
    >
      <svg
        className="admin-brand-mark"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <g transform="translate(28.9776,308.8984) scale(0.20037279,-0.20037279)">
          <path d="M838 1000H1138V0H837L823 90Q786 38 729.5 6Q673 -26 598 -26Q486 -26 388.5 16Q291 58 217 132.5Q143 207 101.5 304.5Q60 402 60 514Q60 621 99 714Q138 807 208.5 877.5Q279 948 371.5 988Q464 1028 570 1028Q656 1028 726.5 992.5Q797 957 852 904ZM590 262Q652 262 703 294Q754 326 784 380Q814 434 814 500Q814 566 784 620Q754 674 703 706Q652 738 590 738Q528 738 477.5 706Q427 674 397.5 620Q368 566 368 500Q368 434 398 380Q428 326 478.5 294Q529 262 590 262Z" />
          <path
            transform="translate(1008,0)"
            d="M420 -500H120V1000H420V906Q467 959 529 992.5Q591 1026 672 1026Q782 1026 877 985Q972 944 1044.5 871.5Q1117 799 1157.5 704Q1198 609 1198 500Q1198 391 1157.5 295Q1117 199 1044.5 126.5Q972 54 877 13Q782 -28 672 -28Q591 -28 529 6Q467 40 420 92ZM668 738Q607 738 556.5 705.5Q506 673 476 619Q446 565 446 500Q446 434 476 380Q506 326 556.5 294Q607 262 668 262Q730 262 781 294Q832 326 862 380Q892 434 892 500Q892 565 862 619Q832 673 781 705.5Q730 738 668 738Z"
          />
        </g>
      </svg>
      <span>admin</span>
    </a>
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
      title="switch color theme"
    >
      <SunIcon
        className="admin-theme-icon is-light"
        size={18}
        aria-hidden="true"
      />
      <MoonIcon
        className="admin-theme-icon is-dark"
        size={18}
        aria-hidden="true"
      />
      <span className="sr-only" data-theme-label>
        switch color theme
      </span>
    </button>
  );
}

function isGroupActive(currentRoute: string, item: NavItem) {
  const pathname = currentRoute.split("?")[0];
  if (item.group === "system") {
    return [
      "/system",
      "/fleet",
      "/proof",
      "/deploys",
      "/repos",
      "/handoffs",
      "/mutations",
      "/ops/destructive",
    ].some((prefix) => pathname.startsWith(prefix));
  }
  return pathname.startsWith(item.href.split("?")[0]);
}

function isActive(currentRoute: string, href: string): boolean {
  const [currentPath, currentQuery = ""] = currentRoute.split("?");
  const [targetPath, targetQuery = ""] = href.split("?");
  const canonicalCurrentPath = currentPath === "/inbox" ? "/" : currentPath;
  const currentParams = new URLSearchParams(currentQuery);

  if (targetQuery) {
    const targetParams = new URLSearchParams(targetQuery);
    return (
      canonicalCurrentPath === targetPath &&
      [...targetParams].every(
        ([key, value]) => currentParams.get(key) === value,
      )
    );
  }

  if (href === "/") {
    return canonicalCurrentPath === "/" && !currentParams.has("category");
  }
  if (href === "/knowledge") {
    return canonicalCurrentPath === "/knowledge" && !currentParams.has("kind");
  }
  return canonicalCurrentPath === href;
}
