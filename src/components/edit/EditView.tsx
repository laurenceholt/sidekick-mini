import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContentData, Story } from "@/lib/schemas/lesson";

export default function EditView() {
  const [data, setData] = useState<ContentData | null>(null);
  const [tab, setTab] = useState<"steps" | "stories">("steps");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("lessons_content")
      .select("data")
      .eq("id", "main")
      .single()
      .then(({ data: row, error }) => {
        if (error) setError(String(error.message));
        else setData(row!.data as ContentData);
      });
  }, []);

  async function save(next: ContentData) {
    setData({ ...next });
    setSaving(true);
    const { error } = await supabase
      .from("lessons_content")
      .update({ data: next, updated_at: new Date().toISOString() })
      .eq("id", "main");
    setSaving(false);
    if (error) alert("Save failed: " + error.message);
  }

  if (error) return <div className="edit-content">Error: {error}</div>;
  if (!data) return <div className="edit-content">Loading…</div>;

  return (
    <div>
      <div className="edit-header">
        <a className="edit-back" href="/">
          ← Back to map
        </a>
        <div className="edit-title">
          Content editor {saving && <span style={{ fontSize: 13, color: "#888" }}>— saving…</span>}
        </div>
      </div>
      <div className="edit-content">
        <div className="edit-tabs">
          {(["steps", "stories"] as const).map((t) => (
            <button
              key={t}
              className={`edit-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "steps" ? "Steps" : "Stories"}
            </button>
          ))}
        </div>
        {tab === "steps" ? <StepsTab data={data} save={save} /> : <StoriesTab data={data} save={save} />}
      </div>
      <div className="step-number">astro edit</div>
    </div>
  );
}

function StepsTab({
  data,
  save,
}: {
  data: ContentData;
  save: (d: ContentData) => void;
}) {
  // Build list of all mini-lesson ids (m-s-l-ml)
  const miniIds: string[] = [];
  data.modules.forEach((mod, mi) =>
    mod.sections.forEach((sec, si) =>
      sec.lessons.forEach((les, li) =>
        les.miniLessons.forEach((_ml, mli) => {
          miniIds.push(`${mi + 1}-${si + 1}-${li + 1}-${mli + 1}`);
        }),
      ),
    ),
  );
  const [filter, setFilter] = useState<string>("all");

  return (
    <>
      <div style={{ margin: "0 0 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#666" }}>
          Mini-lesson:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            border: "2px solid #e5e5e5",
            borderRadius: 8,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <option value="all">All</option>
          {miniIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <table className="edit-table">
      <thead>
        <tr>
          <th>Loc</th>
          <th style={{ width: "12%" }}>Type</th>
          <th>Instruction</th>
          <th>Hint button</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data.modules.map((mod, mi) =>
          mod.sections.map((sec, si) =>
            sec.lessons.map((les, li) =>
              les.miniLessons.map((ml, mli) => {
                const mlId = `${mi + 1}-${si + 1}-${li + 1}-${mli + 1}`;
                if (filter !== "all" && filter !== mlId) return null;
                return ml.steps.map((step, sti) => (
                  <tr key={`${mi}-${si}-${li}-${mli}-${sti}`}>
                    <td className="edit-loc">
                      {mi + 1}-{si + 1}-{li + 1}-{mli + 1}-{sti + 1}
                    </td>
                    <td className="edit-type-desc" style={{ width: "12%", whiteSpace: "normal" }}>
                      {(step as any).type}
                    </td>
                    <td>
                      <textarea
                        className="edit-instruction-input"
                        rows={2}
                        defaultValue={(step as any).instruction || ""}
                        onBlur={(e) => {
                          (step as any).instruction = e.target.value;
                          save(data);
                        }}
                      />
                    </td>
                    <td>
                      <textarea
                        className="edit-instruction-input"
                        rows={2}
                        defaultValue={(step as any).hintButton || ""}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (v) (step as any).hintButton = v;
                          else delete (step as any).hintButton;
                          save(data);
                        }}
                      />
                    </td>
                    <td>
                      <span className="edit-saved show">Saved</span>
                    </td>
                  </tr>
                ));
              }),
            ),
          ),
        )}
      </tbody>
    </table>
    </>
  );
}

function StoriesTab({
  data,
  save,
}: {
  data: ContentData;
  save: (d: ContentData) => void;
}) {
  if (!data.stories) data.stories = [];
  const stories = data.stories;

  const addStory = () => {
    const id = "story-" + (stories.length + 1);
    stories.push({ id, tag: "", offer: "", pages: [{ image: "", text: "" }] });
    save(data);
  };

  return (
    <div className="stories-edit">
      {stories.map((story, si) => (
        <StoryCard key={si} story={story} data={data} save={save} />
      ))}
      <button className="story-add-btn" onClick={addStory}>
        + New story
      </button>
    </div>
  );
}

function StoryCard({
  story,
  data,
  save,
}: {
  story: Story;
  data: ContentData;
  save: (d: ContentData) => void;
}) {
  return (
    <div className="story-edit-card">
      <div className="story-edit-title">
        Story: {story.id} (tag: {story.tag})
      </div>
      <label className="story-edit-row">
        <span>Tag (mini-lesson, e.g. 1-1-1-2)</span>
        <input
          type="text"
          defaultValue={story.tag}
          onBlur={(e) => {
            story.tag = e.target.value.trim();
            save(data);
          }}
        />
      </label>
      <label className="story-edit-row">
        <span>Offer text</span>
        <textarea
          rows={2}
          defaultValue={story.offer}
          onBlur={(e) => {
            story.offer = e.target.value;
            save(data);
          }}
        />
      </label>
      <div className="story-pages-edit">
        {story.pages.map((_, pi) => (
          <StoryPageEditor
            key={pi}
            story={story}
            pi={pi}
            data={data}
            save={save}
          />
        ))}
      </div>
      <button
        className="story-add-page-btn"
        onClick={() => {
          story.pages.push({ image: "", text: "" });
          save(data);
        }}
      >
        + Add page
      </button>
    </div>
  );
}

function StoryPageEditor({
  story,
  pi,
  data,
  save,
}: {
  story: Story;
  pi: number;
  data: ContentData;
  save: (d: ContentData) => void;
}) {
  const page = story.pages[pi];
  const [uploading, setUploading] = useState(false);
  const [img, setImg] = useState(page.image);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${story.id}/page${pi + 1}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("stories")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("stories").getPublicUrl(path);
      page.image = pub.publicUrl;
      setImg(page.image);
      save(data);
    } catch (e: any) {
      alert("Upload failed: " + (e.message || e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="story-page-edit">
      <div className="story-page-img-col">
        {img ? (
          <img className="story-page-thumb" src={img} alt="" />
        ) : (
          <div className="story-page-thumb" />
        )}
        <label className="story-upload-btn" style={{ display: "block", textAlign: "center" }}>
          {uploading ? "Uploading…" : img ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="story-file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="story-page-text-col">
        <div className="story-page-label">Page {pi + 1} text</div>
        <textarea
          rows={3}
          defaultValue={page.text}
          onBlur={(e) => {
            page.text = e.target.value;
            save(data);
          }}
        />
        <button
          className="story-page-del"
          onClick={() => {
            if (!confirm("Delete page " + (pi + 1) + "?")) return;
            story.pages.splice(pi, 1);
            save(data);
          }}
        >
          Delete page
        </button>
      </div>
    </div>
  );
}
