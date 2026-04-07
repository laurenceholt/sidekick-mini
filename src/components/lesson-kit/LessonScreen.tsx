import type { ReactNode } from "react";
import { parseMarkdown } from "@/lib/markdown";

export interface LessonScreenProps {
  prompt?: string;
  children?: ReactNode;
}

/**
 * Lesson content container. Matches legacy `.step-content` + `.instruction`
 * layout: left-aligned prompt, left-padded column, children stretched.
 */
export default function LessonScreen({ prompt, children }: LessonScreenProps) {
  return (
    <div className="step-content">
      {prompt && (
        <div
          className="instruction"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(prompt) }}
        />
      )}
      {children}
    </div>
  );
}
