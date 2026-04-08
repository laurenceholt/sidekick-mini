import { useState } from "react";
import type { MiniLesson, Step } from "@/lib/schemas/lesson";
import LessonScreen from "./LessonScreen";
import CheckFlow, { type CheckButtonState } from "./CheckFlow";
import type { FeedbackState } from "./FeedbackBox";
import PlacePoint, { gradePlacePoint } from "./PlacePoint";
import MultipleChoice, { gradeMultipleChoice } from "./MultipleChoice";
import EquationInput, { gradeEquationInput } from "./EquationInput";

export interface MultiStepShellProps {
  miniLesson: MiniLesson;
  stepIdPrefix?: string;
  initialStepIdx?: number;
  onExit?: () => void;
  onComplete?: () => void;
}

export default function MultiStepShell({
  miniLesson,
  stepIdPrefix,
  initialStepIdx = 0,
  onExit,
  onComplete,
}: MultiStepShellProps) {
  const [stepIdx, setStepIdx] = useState(initialStepIdx);
  const [attemptKey, setAttemptKey] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [buttonState, setButtonState] = useState<CheckButtonState>("disabled");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
  const [bobaCount, setBobaCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem("bobaCount") || "0", 10) || 0;
  });
  const [wasRetry, setWasRetry] = useState(false);

  const addBoba = (n: number) => {
    setBobaCount((c) => {
      const next = c + n;
      if (typeof window !== "undefined") {
        localStorage.setItem("bobaCount", String(next));
      }
      return next;
    });
  };

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
    setAnswer(null);
    setButtonState("disabled");
    setFeedback("idle");
    setFeedbackMessage(undefined);
  };

  const handleSelect = (v: unknown) => {
    setAnswer(v);
    setButtonState(v === null || v === undefined ? "disabled" : "ready");
  };

  const handleCheck = () => {
    if (answer === null || answer === undefined) return;
    let result: { correct: boolean; hint?: string } = { correct: false };
    if (step.type === "place-point") {
      result = gradePlacePoint(step as any, answer as number);
    } else if (step.type === "multiple-choice") {
      result = gradeMultipleChoice(step as any, answer as number);
    } else if (step.type === "equation-input") {
      result = gradeEquationInput(step as any, answer as string);
    }
    if (result.correct) {
      const earned = wasRetry ? 2 : 5;
      addBoba(earned);
      setFeedback("correct");
      setFeedbackMessage(`Great job! +${earned} boba`);
      setButtonState("correct");
    } else {
      addBoba(1);
      setFeedback("wrong");
      setFeedbackMessage(result.hint);
      setButtonState("wrong");
    }
  };

  const handleContinue = () => {
    reset();
    setWasRetry(false);
    setStepIdx((i) => i + 1);
  };

  const handleRetry = () => {
    reset();
    setWasRetry(true);
    setAttemptKey((k) => k + 1);
  };

  const locked = buttonState === "wrong";

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
              key={stepIdx}
              step={step as any}
              attemptKey={attemptKey}
              locked={locked}
              onSelect={handleSelect}
              onAnswer={() => {}}
            />
          )}
          {step.type === "multiple-choice" && (
            <MultipleChoice
              key={stepIdx}
              step={step as any}
              attemptKey={attemptKey}
              locked={locked}
              selectedIdx={answer as number | null}
              result={
                buttonState === "correct"
                  ? "correct"
                  : buttonState === "wrong"
                  ? "wrong"
                  : null
              }
              onSelect={handleSelect}
            />
          )}
          {step.type === "equation-input" && (
            <EquationInput
              key={stepIdx}
              step={step as any}
              attemptKey={attemptKey}
              locked={locked}
              onSelect={handleSelect}
            />
          )}
          {step.type !== "place-point" &&
            step.type !== "multiple-choice" &&
            step.type !== "equation-input" && (
              <div className="text-sm font-bold text-neutral-500">
                Step type <code>{step.type}</code> not yet ported.
              </div>
            )}
        </LessonScreen>
      </div>

      <div className="step-number">astro{stepIdPrefix ? ` ${stepIdPrefix}-${stepIdx + 1}` : ""}</div>

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
