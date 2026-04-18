import { useState } from "react";
import type { MiniLesson, Step, Story } from "@/lib/schemas/lesson";
import LessonScreen from "./LessonScreen";
import CheckFlow, { type CheckButtonState } from "./CheckFlow";
import type { FeedbackState } from "./FeedbackBox";
import PlacePoint, { gradePlacePoint } from "./PlacePoint";
import MultipleChoice, { gradeMultipleChoice } from "./MultipleChoice";
import EquationInput, { gradeEquationInput } from "./EquationInput";
import MovePoint, { gradeMovePoint } from "./MovePoint";
import NumberLineChoice, { gradeNumberLineChoice } from "./NumberLineChoice";
import Thermometer, {
  gradeThermometer,
  ThermometerCompare,
  gradeThermometerCompare,
} from "./Thermometer";
import Elevation, { gradeElevation } from "./Elevation";
import CompareSign, { gradeCompareSign } from "./CompareSign";
import InequalityInput, { gradeInequalityInput } from "./InequalityInput";
import TapPoint, { gradeTapPoint } from "./TapPoint";
import InequalityBuild, { gradeInequalityBuild } from "./InequalityBuild";
import InequalityWrite, { gradeInequalityWrite } from "./InequalityWrite";
import CoordPlot, { gradeCoordPlot } from "./CoordPlot";
import CoordTap, { gradeCoordTap } from "./CoordTap";
import StreakToast from "./StreakToast";
import Confetti from "./Confetti";
import StoryOverlay from "./StoryOverlay";
import { playCorrect, playWrong, playBonus } from "@/lib/sounds";
import { logEvent } from "@/lib/events";

export interface MultiStepShellProps {
  miniLesson: MiniLesson;
  stepIdPrefix?: string;
  initialStepIdx?: number;
  stories?: Story[];
  /** The m-s-l-ml id string, used to find matching story by tag. */
  storyTag?: string;
  onExit?: () => void;
  onComplete?: () => void;
}

type Phase = "steps" | "fix-intro" | "finish" | "story";

const EASY_PRAISE = [
  "Correct.",
  "Nice work.",
  "That works.",
  "Yep.",
  "Right.",
  "Got it.",
  "Exactly.",
  "Nice.",
];
const LEARNING_PRAISE = [
  "You're getting it.",
  "Nice, you're picking this up.",
  "There you go.",
  "That's the idea.",
];
const HARD_PRAISE = [
  "Nice job figuring that out.",
  "Tricky one, nicely done.",
  "Good thinking.",
  "Well reasoned.",
];

function pickPraise(wasRetry: boolean, difficulty?: "easy" | "medium" | "hard"): string {
  const pool =
    difficulty === "hard"
      ? HARD_PRAISE
      : wasRetry
        ? LEARNING_PRAISE
        : Math.random() < 0.2
          ? LEARNING_PRAISE
          : EASY_PRAISE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function MultiStepShell({
  miniLesson,
  stepIdPrefix,
  initialStepIdx = 0,
  stories,
  storyTag,
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
  const [attempt, setAttempt] = useState(1);
  const [streak, setStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const [wrongSteps, setWrongSteps] = useState<number[]>([]);
  const [inFixMistakes, setInFixMistakes] = useState(false);
  const [fixQueue, setFixQueue] = useState<Step[]>([]);
  const [phase, setPhase] = useState<Phase>("steps");
  const [finishing, setFinishing] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const addBoba = (n: number) => {
    setBobaCount((c) => {
      const next = c + n;
      if (typeof window !== "undefined") {
        localStorage.setItem("bobaCount", String(next));
      }
      return next;
    });
  };

  const steps: Step[] = inFixMistakes ? fixQueue : (miniLesson.steps as Step[]);
  const total = steps.length;
  const step = steps[stepIdx];

  const matchingStory: Story | undefined =
    stories && storyTag ? stories.find((s) => s.tag === storyTag) : undefined;

  // ── Fix Mistakes intro screen ─────────────────────────────
  if (phase === "fix-intro") {
    return (
      <Shell
        bobaCount={bobaCount}
        onExit={onExit}
        progressPct={100}
        stepIdPrefix={stepIdPrefix}
        stepLabel={stepIdx + 1}
        hideCheck
      >
        <div className="celebrate">
          <img
            src="/boba-spilled.svg"
            alt="spilled boba"
            style={{ width: 160, height: 120 }}
          />
          <div
            className="congrats-text"
            style={{ color: "#1a1a2e", fontSize: 24 }}
          >
            Let's fix some mistakes!
          </div>
          <div className="sub-text">Let's go over them one more time.</div>
          <button
            className="continue-map-btn"
            onClick={() => {
              setFixQueue(wrongSteps.map((i) => miniLesson.steps[i] as Step));
              setInFixMistakes(true);
              setStepIdx(0);
              setAttempt(1);
              setStreak(0);
              setWrongSteps([]);
              resetAnswerState();
              setPhase("steps");
            }}
          >
            CONTINUE
          </button>
        </div>
      </Shell>
    );
  }

  // ── Finish Lesson screen ───────────────────────────────────
  if (phase === "finish") {
    return (
      <>
        <Shell
          bobaCount={bobaCount}
          onExit={onExit}
          progressPct={100}
          stepIdPrefix={stepIdPrefix}
          stepLabel={stepIdx + 1}
          hideCheck
        >
          <div className="celebrate">
            <div className="trophy">🏆</div>
            <div className="congrats-text">Amazing work!</div>
            <div className="sub-text">Mini-lesson complete!</div>
            <div className="gems-earned">
              <img src="/boba.svg" className="boba-icon" alt="boba" /> +20 boba!
            </div>
            {matchingStory ? (
              <>
                <div className="story-offer-text">{matchingStory.offer}</div>
                <div className="celebrate-btn-row">
                  <button
                    className="continue-map-btn yes-btn"
                    onClick={() => setStoryOpen(true)}
                  >
                    YES
                  </button>
                  <button
                    className="continue-map-btn no-btn"
                    onClick={onComplete}
                  >
                    NO, CONTINUE
                  </button>
                </div>
              </>
            ) : (
              <button className="continue-map-btn" onClick={onComplete}>
                CONTINUE
              </button>
            )}
          </div>
        </Shell>
        <Confetti />
        {storyOpen && matchingStory && (
          <StoryOverlay story={matchingStory} onClose={onComplete ?? (() => {})} />
        )}
      </>
    );
  }

  if (!step || step.type === "celebrate") {
    // Ran off the end without hitting advanceStep (edge case) — just finish.
    if (!finishing) {
      setFinishing(true);
      finishLessonNow();
    }
    return null;
  }

  function resetAnswerState() {
    setAnswer(null);
    setButtonState("disabled");
    setFeedback("idle");
    setFeedbackMessage(undefined);
  }

  function finishLessonNow() {
    addBoba(20);
    setPhase("finish");
  }

  function advance() {
    resetAnswerState();
    setWasRetry(false);
    setAttempt(1);
    const next = stepIdx + 1;
    if (next < total) {
      setStepIdx(next);
      return;
    }
    // End of queue
    if (!inFixMistakes && wrongSteps.length > 0) {
      setPhase("fix-intro");
      return;
    }
    finishLessonNow();
  }

  const handleSelect = (v: unknown) => {
    setAnswer(v);
    setButtonState(v === null || v === undefined ? "disabled" : "ready");
  };

  const handleCheck = () => {
    if (answer === null || answer === undefined) return;
    let result: { correct: boolean; hint?: string } = { correct: false };
    const s = step as any;
    if (s.type === "place-point") result = gradePlacePoint(s, answer as number);
    else if (s.type === "multiple-choice")
      result = gradeMultipleChoice(s, answer as number);
    else if (s.type === "equation-input")
      result = gradeEquationInput(s, answer as string);
    else if (s.type === "move-point") result = gradeMovePoint(s, answer as number);
    else if (s.type === "number-line-choice")
      result = gradeNumberLineChoice(s, answer as number);
    else if (s.type === "thermometer")
      result = gradeThermometer(s, answer as number);
    else if (s.type === "thermometer-compare")
      result = gradeThermometerCompare(s, answer as number);
    else if (s.type === "elevation") result = gradeElevation(s, answer as number);
    else if (s.type === "compare-sign") result = gradeCompareSign(s, answer as string);
    else if (s.type === "inequality-input") result = gradeInequalityInput(s, answer as string);
    else if (s.type === "tap-point") result = gradeTapPoint(s, answer as number[]);
    else if (s.type === "inequality-build")
      result = gradeInequalityBuild(s, answer as any);
    else if (s.type === "inequality-write")
      result = gradeInequalityWrite(s, answer as any);
    else if (s.type === "coord-plot") result = gradeCoordPlot(s, answer as any);
    else if (s.type === "coord-tap") result = gradeCoordTap(s, answer as any);

    // Event id extension:
    //   first try          → 1-1-1-1-1
    //   retry in main pass → 1-1-1-1-1.r2, .r3, …
    //   fix-mistakes pass  → 1-1-1-1-1.fix (+ .fix.r2 on retries)
    const base = `${stepIdPrefix ?? ""}-${stepIdx + 1}`;
    let suffix = "";
    if (inFixMistakes) suffix += ".fix";
    if (attempt > 1) suffix += `.r${attempt}`;
    const stepIdStr = base + suffix;
    const ansStr =
      answer === null || answer === undefined ? null : String(answer);

    if (result.correct) {
      const earned = wasRetry ? 2 : 5;
      addBoba(earned);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > 0 && newStreak % 5 === 0) {
        addBoba(10);
        setShowStreak(true);
        playBonus();
      } else {
        playCorrect();
      }
      setFeedback("correct");
      setFeedbackMessage(
        stepIdx === 0 && !inFixMistakes
          ? `Nice! +${earned} boba`
          : pickPraise(wasRetry, (step as any).difficulty),
      );
      setButtonState("correct");
      logEvent({ stepId: stepIdStr, answer: ansStr, correct: true, bobaTotal: bobaCount + earned });
    } else {
      if (!inFixMistakes && !wrongSteps.includes(stepIdx)) {
        setWrongSteps((w) => [...w, stepIdx]);
      }
      addBoba(1);
      setStreak(0);
      playWrong();
      setFeedback("wrong");
      setFeedbackMessage(result.hint);
      setButtonState("wrong");
      logEvent({ stepId: stepIdStr, answer: ansStr, correct: false, bobaTotal: bobaCount + 1 });
    }
  };

  const handleContinue = () => advance();

  const handleRetry = () => {
    resetAnswerState();
    setWasRetry(true);
    setAttempt((a) => a + 1);
    setAttemptKey((k) => k + 1);
  };

  const locked = buttonState === "wrong" || buttonState === "correct";

  return (
    <Shell
      bobaCount={bobaCount}
      onExit={onExit}
      progressPct={(stepIdx / total) * 100}
      stepIdPrefix={stepIdPrefix}
      stepLabel={stepIdx + 1}
      buttonState={buttonState}
      feedback={feedback}
      feedbackMessage={feedbackMessage}
      hintText={(step as any).hintButton || undefined}
      hintKey={`${inFixMistakes ? "f" : "m"}-${stepIdx}`}
      onCheck={handleCheck}
      onContinue={handleContinue}
      onRetry={handleRetry}
    >
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
            result={buttonState === "correct" ? "correct" : buttonState === "wrong" ? "wrong" : null}
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
        {step.type === "move-point" && (
          <MovePoint
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
        {step.type === "number-line-choice" && (
          <NumberLineChoice
            key={stepIdx}
            step={step as any}
            locked={locked}
            selectedIdx={answer as number | null}
            result={buttonState === "correct" ? "correct" : buttonState === "wrong" ? "wrong" : null}
            onSelect={handleSelect}
          />
        )}
        {step.type === "thermometer" && (
          <Thermometer
            key={stepIdx}
            step={step as any}
            locked={locked}
            selectedIdx={answer as number | null}
            result={buttonState === "correct" ? "correct" : buttonState === "wrong" ? "wrong" : null}
            onSelect={handleSelect}
          />
        )}
        {step.type === "thermometer-compare" && (
          <ThermometerCompare
            key={stepIdx}
            step={step as any}
            locked={locked}
            selectedIdx={answer as number | null}
            result={buttonState === "correct" ? "correct" : buttonState === "wrong" ? "wrong" : null}
            onSelect={handleSelect}
          />
        )}
        {step.type === "elevation" && (
          <Elevation
            key={stepIdx}
            step={step as any}
            locked={locked}
            selectedIdx={answer as number | null}
            result={buttonState === "correct" ? "correct" : buttonState === "wrong" ? "wrong" : null}
            onSelect={handleSelect}
          />
        )}
        {step.type === "compare-sign" && (
          <CompareSign
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
        {step.type === "inequality-input" && (
          <InequalityInput
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
        {step.type === "tap-point" && (
          <TapPoint
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
        {step.type === "inequality-build" && (
          <InequalityBuild
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
        {step.type === "inequality-write" && (
          <InequalityWrite
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
        {step.type === "coord-plot" && (
          <CoordPlot
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
        {step.type === "coord-tap" && (
          <CoordTap
            key={stepIdx}
            step={step as any}
            attemptKey={attemptKey}
            locked={locked}
            onSelect={handleSelect}
          />
        )}
      </LessonScreen>
      {showStreak && <StreakToast onDone={() => setShowStreak(false)} />}
    </Shell>
  );
}

// ─── Chrome shell (top bar, step badge, bottom bar) ──────────

interface ShellProps {
  bobaCount: number;
  onExit?: () => void;
  progressPct: number;
  stepIdPrefix?: string;
  stepLabel: number;
  hideCheck?: boolean;
  buttonState?: CheckButtonState;
  feedback?: FeedbackState;
  feedbackMessage?: string;
  hintText?: string;
  hintKey?: number | string;
  onCheck?: () => void;
  onContinue?: () => void;
  onRetry?: () => void;
  children: React.ReactNode;
}

function Shell({
  bobaCount,
  onExit,
  progressPct,
  stepIdPrefix,
  stepLabel,
  hideCheck,
  buttonState,
  feedback,
  feedbackMessage,
  hintText,
  hintKey,
  onCheck,
  onContinue,
  onRetry,
  children,
}: ShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="top-bar">
        <button className="close-btn" onClick={onExit} aria-label="Close">
          ×
        </button>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="boba-display">
          <img src="/boba.svg" className="boba-icon" alt="boba" />
          <span>{bobaCount}</span>
        </div>
      </div>

      <div>{children}</div>

      <div className="step-number">
        astro{stepIdPrefix ? ` ${stepIdPrefix}-${stepLabel}` : ""}
      </div>

      {!hideCheck && buttonState && (
        <CheckFlow
          buttonState={buttonState}
          feedback={feedback!}
          feedbackMessage={feedbackMessage}
          hintText={hintText}
          hintKey={hintKey}
          onCheck={onCheck!}
          onContinue={onContinue!}
          onRetry={onRetry!}
        />
      )}
    </div>
  );
}
