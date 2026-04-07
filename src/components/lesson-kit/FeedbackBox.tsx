export type FeedbackState = "idle" | "correct" | "wrong";

export interface FeedbackBoxProps {
  state: FeedbackState;
  message?: string;
}

/** Inline feedback bar. Matches legacy `.feedback-inline.correct/.wrong`. */
export default function FeedbackBox({ state, message }: FeedbackBoxProps) {
  if (state === "idle") return null;
  const isCorrect = state === "correct";
  return (
    <div className={`feedback-inline ${isCorrect ? "correct" : "wrong"}`}>
      {message || (isCorrect ? "Great job!" : "Not quite!")}
    </div>
  );
}
