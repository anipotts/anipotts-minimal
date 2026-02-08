"use client";

import { useState, useEffect, useCallback, memo } from "react";
import {
  FaCircle,
  FaChevronDown,
  FaChevronRight,
  FaPlus,
  FaSave,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import {
  getPageContent,
  updatePageContent,
  togglePageSection,
  getProjects,
  upsertProject,
  deleteProject,
  getSocialLinks,
  upsertSocialLink,
  deleteSocialLink,
  getSiteSetting,
  updateSiteSetting,
} from "../actions";
import type { ProjectRow, SocialLinkRow, HomepageContent, PageContent } from "@anipotts/types";

// ---------------------------------------------------------------------------
// Sub-section IDs
// ---------------------------------------------------------------------------

type SiteSection = "homepage" | "projects" | "social" | "settings";

const SECTIONS: { id: SiteSection; label: string; color: string }[] = [
  { id: "homepage", label: "Homepage Editor", color: "text-blue-400" },
  { id: "projects", label: "Projects Manager", color: "text-purple-400" },
  { id: "social", label: "Social Links", color: "text-green-400" },
  { id: "settings", label: "Site Settings", color: "text-orange-400" },
];

const SITE_SETTING_KEYS = [
  { key: "site_name", label: "Site Name" },
  { key: "site_bio", label: "Bio" },
  { key: "site_title", label: "Title" },
  { key: "site_location", label: "Location" },
  { key: "site_domain", label: "Domain" },
  { key: "site_email", label: "Email" },
  { key: "site_handle", label: "Handle" },
  { key: "site_github", label: "GitHub" },
];

const PROJECT_CATEGORIES = ["ai", "product", "quant", "music", "other"] as const;
const PROJECT_STATUSES = ["live", "in-progress", "coming-soon"] as const;

// ---------------------------------------------------------------------------
// Homepage Editor
// ---------------------------------------------------------------------------

const HomepageEditor = memo(function HomepageEditor() {
  const [pageContent, setPageContent] = useState<PageContent<HomepageContent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getPageContent("homepage");
    if (result.success) {
      setPageContent(result.data as PageContent<HomepageContent>);
    } else {
      setError(result.error ?? "Failed to load");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!pageContent) return;
    setSaving(true);
    setError(null);
    const result = await updatePageContent("homepage", pageContent.content, pageContent.version);
    if (result.success) {
      setPageContent(result.data as PageContent<HomepageContent>);
    } else {
      setError(result.error ?? "Save failed");
    }
    setSaving(false);
  };

  const handleToggleSection = async (sectionKey: string, visible: boolean) => {
    setSaving(true);
    const result = await togglePageSection("homepage", sectionKey, visible);
    if (result.success) {
      setPageContent(result.data as PageContent<HomepageContent>);
    } else {
      setError(result.error ?? "Toggle failed");
    }
    setSaving(false);
  };

  const updateSectionField = (sectionKey: string, field: string, value: string) => {
    if (!pageContent) return;
    const content = { ...pageContent.content };
    const sections = { ...content.sections };
    const section = { ...(sections as unknown as Record<string, Record<string, unknown>>)[sectionKey] };
    section[field] = value;
    (sections as unknown as Record<string, unknown>)[sectionKey] = section;
    setPageContent({ ...pageContent, content: { ...content, sections } as HomepageContent });
  };

  if (loading) return <div className="text-xs text-[var(--text-muted)] p-4">Loading homepage data...</div>;
  if (!pageContent) return <div className="text-xs text-red-400 p-4">{error || "No homepage content found"}</div>;

  const sections = pageContent.content?.sections;
  if (!sections) return <div className="text-xs text-[var(--text-muted)] p-4">No sections configured</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</div>
      )}
      {Object.entries(sections).map(([key, section]) => (
        <div key={key} className="bg-[var(--input-bg)] border border-[var(--border)] rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">{key}</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={section.visible}
                onChange={(e) => handleToggleSection(key, e.target.checked)}
                className="accent-[var(--accent-400)]"
              />
              <span className={`text-[10px] font-mono ${section.visible ? "text-green-400" : "text-[var(--text-muted)]"}`}>
                {section.visible ? "Visible" : "Hidden"}
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Heading</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={section.heading || ""}
                onChange={(e) => updateSectionField(key, "heading", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Subheading</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={section.subheading || ""}
                onChange={(e) => updateSectionField(key, "subheading", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[var(--overlay-10)] hover:bg-[var(--overlay-20)] text-white px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
      >
        <FaSave className="w-3 h-3" /> {saving ? "Saving..." : "Save Homepage"}
      </button>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Projects Manager
// ---------------------------------------------------------------------------

const EMPTY_PROJECT: Partial<ProjectRow> = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  year: new Date().getFullYear().toString(),
  category: "ai",
  role: "",
  duration: "",
  tags: [],
  status: "in-progress",
  featured: false,
  visible: true,
  icon: null,
  link_live: null,
  link_repo: null,
  link_page: null,
  sort_order: 0,
};

const ProjectsManager = memo(function ProjectsManager() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ProjectRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getProjects();
    if (result.success && result.data) {
      setProjects(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const result = await upsertProject(editing);
    if (result.success && result.data) {
      setProjects((prev) => {
        const exists = prev.find((p) => p.id === result.data!.id);
        if (exists) return prev.map((p) => p.id === result.data!.id ? result.data! : p);
        return [...prev, result.data!];
      });
      setEditing(null);
    } else {
      setError(result.error ?? "Save failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const result = await deleteProject(id);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (editing && "id" in editing && editing.id === id) setEditing(null);
    }
  };

  if (loading) return <div className="text-xs text-[var(--text-muted)] p-4">Loading projects...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</div>
      )}

      {/* Project table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
              <th className="text-left py-2 px-2">Slug</th>
              <th className="text-left py-2 px-2">Title</th>
              <th className="text-left py-2 px-2">Category</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-center py-2 px-2">Visible</th>
              <th className="text-right py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-[var(--border)]/50 hover:bg-[var(--input-bg)] transition-colors"
              >
                <td className="py-2 px-2 font-mono text-[var(--accent-400)]">{project.slug}</td>
                <td className="py-2 px-2 text-[var(--text-secondary)]">{project.title}</td>
                <td className="py-2 px-2 text-[var(--text-muted)]">{project.category}</td>
                <td className="py-2 px-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    project.status === "live" ? "bg-green-500/20 text-green-400" :
                    project.status === "in-progress" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <div className={`w-2 h-2 rounded-full mx-auto ${project.visible ? "bg-green-500" : "bg-gray-500"}`} />
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditing({ ...project })}
                      className="text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors text-[10px] font-mono"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <FaTrash className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new button */}
      <button
        onClick={() => setEditing({ ...EMPTY_PROJECT })}
        className="bg-[var(--accent-400)]/10 hover:bg-[var(--accent-400)]/20 text-[var(--accent-400)] border border-[var(--accent-400)]/20 py-1.5 px-3 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors"
      >
        <FaPlus className="w-2.5 h-2.5" /> Add Project
      </button>

      {/* Edit form */}
      {editing && (
        <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              {editing.id ? "Edit Project" : "New Project"}
            </span>
            <button onClick={() => setEditing(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Slug</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.slug || ""}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Title</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.title || ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Subtitle</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.subtitle || ""}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Year</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.year || ""}
                onChange={(e) => setEditing({ ...editing, year: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Category</label>
              <select
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-mono rounded px-2 py-1.5 focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.category || "ai"}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as ProjectRow["category"] })}
              >
                {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Status</label>
              <select
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-mono rounded px-2 py-1.5 focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.status || "in-progress"}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ProjectRow["status"] })}
              >
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Role</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.role || ""}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Duration</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.duration || ""}
                onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Description</label>
              <textarea
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5 resize-none"
                rows={3}
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Live Link</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.link_live || ""}
                onChange={(e) => setEditing({ ...editing, link_live: e.target.value || null })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Repo Link</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.link_repo || ""}
                onChange={(e) => setEditing({ ...editing, link_repo: e.target.value || null })}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured || false}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="accent-[var(--accent-400)]"
                />
                <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.visible !== false}
                  onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
                  className="accent-[var(--accent-400)]"
                />
                <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Visible</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--overlay-10)] hover:bg-[var(--overlay-20)] text-white px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FaSave className="w-3 h-3" /> {saving ? "Saving..." : "Save Project"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-3 py-1.5 text-xs font-mono uppercase transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Social Links Manager
// ---------------------------------------------------------------------------

const EMPTY_LINK: Partial<SocialLinkRow> = {
  name: "",
  url: "",
  icon: "",
  description: null,
  sort_order: 0,
  visible: true,
};

const SocialLinksManager = memo(function SocialLinksManager() {
  const [links, setLinks] = useState<SocialLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<SocialLinkRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getSocialLinks();
    if (result.success && result.data) {
      setLinks(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const result = await upsertSocialLink(editing);
    if (result.success && result.data) {
      setLinks((prev) => {
        const exists = prev.find((l) => l.id === result.data!.id);
        if (exists) return prev.map((l) => l.id === result.data!.id ? result.data! : l);
        return [...prev, result.data!];
      });
      setEditing(null);
    } else {
      setError(result.error ?? "Save failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this social link?")) return;
    const result = await deleteSocialLink(id);
    if (result.success) {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (editing && "id" in editing && editing.id === id) setEditing(null);
    }
  };

  if (loading) return <div className="text-xs text-[var(--text-muted)] p-4">Loading social links...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</div>
      )}

      <div className="space-y-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--text-muted)] font-mono w-16">{link.icon}</span>
              <span className="text-xs text-[var(--text-secondary)] font-semibold">{link.name}</span>
              <span className="text-[10px] text-[var(--accent-400)] font-mono truncate max-w-[200px]">{link.url}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing({ ...link })}
                className="text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors text-[10px] font-mono"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(link.id)}
                className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                <FaTrash className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setEditing({ ...EMPTY_LINK })}
        className="bg-[var(--accent-400)]/10 hover:bg-[var(--accent-400)]/20 text-[var(--accent-400)] border border-[var(--accent-400)]/20 py-1.5 px-3 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors"
      >
        <FaPlus className="w-2.5 h-2.5" /> Add Link
      </button>

      {editing && (
        <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              {editing.id ? "Edit Link" : "New Link"}
            </span>
            <button onClick={() => setEditing(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Name</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.name || ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Icon</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.icon || ""}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                placeholder="e.g. github, twitter"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">URL</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.url || ""}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Description (optional)</label>
              <input
                className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value || null })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.visible !== false}
                onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
                className="accent-[var(--accent-400)]"
              />
              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Visible</span>
            </label>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--overlay-10)] hover:bg-[var(--overlay-20)] text-white px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FaSave className="w-3 h-3" /> {saving ? "Saving..." : "Save Link"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-3 py-1.5 text-xs font-mono uppercase transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Site Settings
// ---------------------------------------------------------------------------

const SiteSettings = memo(function SiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(
      SITE_SETTING_KEYS.map(async ({ key }) => {
        const result = await getSiteSetting(key);
        return { key, value: result.success ? (result.data ?? "") : "" };
      })
    );
    const map: Record<string, string> = {};
    for (const r of results) {
      map[r.key] = r.value;
    }
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const updates = Object.entries(settings).map(([key, value]) => updateSiteSetting(key, value));
    const results = await Promise.all(updates);
    const failed = results.find((r) => !r.success);
    if (failed && !failed.success) {
      setError(failed.error ?? "Save failed");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) return <div className="text-xs text-[var(--text-muted)] p-4">Loading settings...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</div>
      )}
      {SITE_SETTING_KEYS.map(({ key, label }) => (
        <div key={key}>
          <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase">{label}</label>
          <input
            className="w-full bg-[rgba(var(--overlay-invert),0.4)] border border-[var(--border)] rounded py-1.5 px-2 text-xs text-[var(--text-secondary)] focus:border-[var(--accent-400)]/50 focus:outline-none mt-0.5"
            value={settings[key] || ""}
            onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-[var(--overlay-10)] hover:bg-[var(--overlay-20)] text-white px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <FaSave className="w-3 h-3" /> {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && <span className="text-xs text-green-400 font-mono">Saved</span>}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main SiteTab
// ---------------------------------------------------------------------------

export default memo(function SiteTab() {
  const [expanded, setExpanded] = useState<SiteSection>("homepage");

  return (
    <div className="h-full p-3 flex flex-col gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <FaCircle className="w-2 h-2 text-[var(--accent-400)]" />
        <h2 className="text-sm font-mono uppercase tracking-wide text-[var(--text-primary)] font-semibold">
          Site Management
        </h2>
        <span className="text-xs text-[var(--text-muted)] font-medium">
          CMS
        </span>
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {SECTIONS.map(({ id, label, color }) => {
          const isExpanded = expanded === id;
          return (
            <div key={id} className="bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? expanded : id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--input-bg)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <FaChevronDown className={`w-3 h-3 ${color}`} />
                  ) : (
                    <FaChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                  )}
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{label}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-2">
                  {id === "homepage" && <HomepageEditor />}
                  {id === "projects" && <ProjectsManager />}
                  {id === "social" && <SocialLinksManager />}
                  {id === "settings" && <SiteSettings />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
