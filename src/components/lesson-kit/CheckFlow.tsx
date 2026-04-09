import { useEffect, useState } from "react";
import FeedbackBox, { type FeedbackState } from "./FeedbackBox";

export type CheckButtonState = "disabled" | "ready" | "correct" | "wrong";

export interface CheckFlowProps {
  buttonState: CheckButtonState;
  feedback: FeedbackState;
  feedbackMessage?: string;
  hintText?: string;
  /** Step index — used to reset revealed hint when moving between steps. */
  hintKey?: number | string;
  onCheck: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

/**
 * Bottom-bar check/feedback controller. Matches legacy `.bottom-bar` +
 * `.check-btn` styling.
 */
export default function CheckFlow({
  buttonState,
  feedback,
  feedbackMessage,
  hintText,
  hintKey,
  onCheck,
  onContinue,
  onRetry,
}: CheckFlowProps) {
  const [hintShown, setHintShown] = useState(false);
  useEffect(() => {
    setHintShown(false);
  }, [hintKey]);
  const label =
    buttonState === "correct"
      ? "CONTINUE"
      : buttonState === "wrong"
      ? "TRY AGAIN"
      : "CHECK";

  const onClick =
    buttonState === "correct"
      ? onContinue
      : buttonState === "wrong"
      ? onRetry
      : buttonState === "ready"
      ? onCheck
      : undefined;

  const cls =
    buttonState === "correct"
      ? "check-btn next"
      : buttonState === "wrong"
      ? "check-btn try-again"
      : buttonState === "disabled"
      ? "check-btn disabled"
      : "check-btn";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const t = e.target as HTMLElement | null;
      // Allow Enter inside multiline textareas to insert newlines.
      if (t && t.tagName === "TEXTAREA") return;
      if (!onClick) return;
      e.preventDefault();
      onClick();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClick]);

  const showHintCtrl =
    !!hintText && (buttonState === "disabled" || buttonState === "ready");

  return (
    <div className="bottom-bar">
      <FeedbackBox state={feedback} message={feedbackMessage} />
      {showHintCtrl && (
        hintShown ? (
          <div className="hint-text" role="note">
            {hintText}
          </div>
        ) : (
          <button
            className="hint-btn"
            type="button"
            onClick={() => setHintShown(true)}
          >
            HINT
          </button>
        )
      )}
      <button className={cls} disabled={buttonState === "disabled"} onClick={onClick}>
        {label}
      </button>
    </div>
  );
}
