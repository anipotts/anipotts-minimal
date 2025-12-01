"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { upsertThought, deleteThought, logout } from "../actions";

export default function AdminInterface() {
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchThoughts();
  }, []);

  const fetchThoughts = async () => {
    const { data } = await supabase
      .from("thoughts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setThoughts(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertThought(editing);
      setEditing(null);
      fetchThoughts();
    } catch (err) {
      alert("Error saving");
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this thought?")) return;
    try {
      await deleteThought(id);
      fetchThoughts();
    } catch (err) {
      alert("Error deleting");
    }
  };

  const startNew = () => {
    setEditing({
      title: "",
      slug: "",
      summary: "",
      content: "",
      tags: [],
      published: false,
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading text-gray-100">Admin</h1>
        <button onClick={() => logout().then(() => window.location.reload())} className="text-sm text-gray-500 hover:text-gray-300">
          Logout
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4 bg-white/5 p-6 rounded-lg border border-white/10">
          <h2 className="text-xl font-bold text-gray-200">{editing.id ? "Edit" : "New"} Thought</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="bg-black/50 border border-white/10 p-2 rounded text-gray-200"
              placeholder="Title"
              value={editing.title}
              onChange={e => setEditing({ ...editing, title: e.target.value, slug: !editing.id ? e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : editing.slug })}
            />
            <input
              className="bg-black/50 border border-white/10 p-2 rounded text-gray-200"
              placeholder="Slug"
              value={editing.slug}
              onChange={e => setEditing({ ...editing, slug: e.target.value })}
            />
          </div>

          <textarea
            className="bg-black/50 border border-white/10 p-2 rounded text-gray-200 h-20"
            placeholder="Summary"
            value={editing.summary}
            onChange={e => setEditing({ ...editing, summary: e.target.value })}
          />

          <textarea
            className="bg-black/50 border border-white/10 p-2 rounded text-gray-200 h-64 font-mono text-sm"
            placeholder="Content (Markdown)"
            value={editing.content}
            onChange={e => setEditing({ ...editing, content: e.target.value })}
          />

          <input
            className="bg-black/50 border border-white/10 p-2 rounded text-gray-200"
            placeholder="Tags (comma separated)"
            value={Array.isArray(editing.tags) ? editing.tags.join(", ") : editing.tags}
            onChange={e => setEditing({ ...editing, tags: e.target.value.split(",").map((t: string) => t.trim()) })}
          />

          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={editing.published}
              onChange={e => setEditing({ ...editing, published: e.target.checked })}
            />
            Published
          </label>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="bg-accent-400 text-black px-4 py-2 rounded font-bold hover:bg-accent-400/90">
              {loading ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-200">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={startNew} className="bg-white/10 text-gray-200 px-4 py-2 rounded hover:bg-white/20 self-start">
          + New Thought
        </button>
      )}

      <div className="flex flex-col gap-4">
        {thoughts.map(thought => (
          <div key={thought.id} className="flex items-center justify-between p-4 bg-white/5 rounded border border-white/5">
            <div>
              <h3 className="font-bold text-gray-200">{thought.title}</h3>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{thought.slug}</span>
                <span>•</span>
                <span className={thought.published ? "text-green-400" : "text-yellow-400"}>
                  {thought.published ? "Published" : "Draft"}
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <button onClick={() => setEditing(thought)} className="text-accent-400 hover:underline">Edit</button>
              <button onClick={() => handleDelete(thought.id)} className="text-red-400 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
