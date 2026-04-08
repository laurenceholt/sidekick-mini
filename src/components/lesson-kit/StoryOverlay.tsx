import { useState } from "react";
import type { Story } from "@/lib/schemas/lesson";
import { parseMarkdown } from "@/lib/markdown";

export default function StoryOverlay({
  story,
  onClose,
}: {
  story: Story;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const page = story.pages[idx];
  const last = idx === story.pages.length - 1;

  return (
    <div className="story-overlay">
      <div className="story-card">
        <button className="story-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="story-page">
          <img className="story-img" src={page.image} alt="" />
          <div
            className="story-text"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(page.text || "") }}
          />
        </div>
        <div className="story-nav">
          <button
            className="story-prev"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
          >
            ← Prev
          </button>
          <span className="story-counter">
            {idx + 1} / {story.pages.length}
          </span>
          <button
            className="story-next"
            onClick={() => {
              if (last) onClose();
              else setIdx((i) => i + 1);
            }}
          >
            {last ? "Done" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
