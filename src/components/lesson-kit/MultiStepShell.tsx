import { useState } from "react";
import type { MiniLesson, Step } from "@/lib/schemas/lesson";
import LessonScreen from "./LessonScreen";
import CheckFlow, { type CheckButtonState } from "./CheckFlow";
import type { FeedbackState } from "./FeedbackBox";
import PlacePoint, { gradePlacePoint } from "./PlacePoint";

export interface MultiStepShellProps {
  miniLesson: MiniLesson;
  /** e.g. "1-1-1-1" — the mini-lesson path; step index is appended for display. */
  stepIdPrefix?: string;
  onExit?: () => void;
  onComplete?: () => void;
}

export default function MultiStepShell({
  miniLesson,
  stepIdPrefix,
  onExit,
  onComplete,
}: MultiStepShellProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [buttonState, setButtonState] = useState<CheckButtonState>("disabled");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
  const [bobaCount] = useState(0);

  const step = miniLesson.steps[stepIdx] as Step | undefined;
  const total = miniLesson.steps.length;

  if (!step) {
    return (
      <div className="celebrate">
        <div className="trophy">🏆</div>
        <div className="congrats-text">Amazing work!</div>
        <div className="sub-text">Mini-lesson complete!</div>
        <button className="check-btn next" onClick={onComplete}>
          CONTINUE
        </button>
      </div>
    );
  }

  const reset = () => {
    setSelectedValue(null);
    setButtonState("disabled");
    setFeedback("idle");
    setFeedbackMessage(undefined);
  };

  const handleCheck = () => {
    if (selectedValue === null) return;
    if (step.type === "place-point") {
      const result = gradePlacePoint(step as any, selectedValue);
      if (result.correct) {
        setFeedback("correct");
        setFeedbackMessage("Great job!");
        setButtonState("correct");
      } else {
        setFeedback("wrong");
        setFeedbackMessage(result.hint);
        setButtonState("wrong");
      }
    }
  };

  const handleContinue = () => {
    reset();
    setStepIdx((i) => i + 1);
  };

  const handleRetry = () => {
    reset();
    setAttemptKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="top-bar">
        <button className="close-btn" onClick={onExit} aria-label="Close">
          ×
        </button>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${(stepIdx / total) * 100}%` }}
          />
        </div>
        <div className="boba-display">
          <img src="/boba.svg" className="boba-icon" alt="boba" />
          <span>{bobaCount}</span>
        </div>
      </div>

      <div>
        <LessonScreen prompt={step.instruction as string | undefined}>
          {step.type === "place-point" && (
            <PlacePoint
              step={step as any}
              attemptKey={attemptKey}
              onSelect={(v) => {
                setSelectedValue(v);
                setButtonState(v === null ? "disabled" : "ready");
              }}
              onAnswer={() => {}}
            />
          )}
          {step.type !== "place-point" && (
            <div className="text-sm font-bold text-neutral-500">
              Step type <code>{step.type}</code> not yet ported in this spike.
            </div>
          )}
        </LessonScreen>
      </div>

      {stepIdPrefix && (
        <div className="step-number">{stepIdPrefix}-{stepIdx + 1}</div>
      )}

      <CheckFlow
        buttonState={buttonState}
        feedback={feedback}
        feedbackMessage={feedbackMessage}
        onCheck={handleCheck}
        onContinue={handleContinue}
        onRetry={handleRetry}
      />
    </div>
  );
}
