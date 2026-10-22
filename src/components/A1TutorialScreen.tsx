import { useEffect, useMemo, useRef, useState } from "react";
import { getStageA, type StageAId } from "../game/definitions/stages";
import { EMPTY_CALCULATOR, pressCalculator, type CalculatorState } from "../game/logic/calculator";
import { useTypewriter } from "../game/useTypewriter";
import FinancialText from "./FinancialText";

type FutureValueDemoAction = {
  button: string;
  narration: string | null;
};

const FUTURE_VALUE_DEMO: FutureValueDemoAction[] = [
  { button: "AC", narration: "Clear the calculator." },
  { button: "1", narration: "Enter the present value, $1,000." },
  { button: "0", narration: null },
  { button: "0", narration: null },
  { button: "0", narration: null },
  { button: "×", narration: "Multiply by the future-value growth factor." },
  { button: "1", narration: "The base is 1 + r = 1 + 5% = 1.05." },
  { button: ".", narration: null },
  { button: "0", narration: null },
  { button: "5", narration: null },
  { button: "xʸ", narration: "Press xʸ to raise this base to a power." },
  { button: "5", narration: "Enter n = 5 years as the exponent." },
  { button: "=", narration: "Press equals: 1,000 × 1.05⁵ = $1,276.28." },
];

type A1TutorialScreenProps = {
  stageId?: StageAId;
  onContinue: () => void;
  onTypeTick: () => void;
  onCalculatorDemo: (
    visible: boolean,
    state: CalculatorState | null,
    activeButton: string | null,
    hint: string | null,
  ) => void;
};

function A1TutorialScreen({
  stageId = "A1",
  onContinue,
  onTypeTick,
  onCalculatorDemo,
}: A1TutorialScreenProps) {
  const stage = getStageA(stageId);
  const script = useMemo(
    () =>
      [
        stage.tutorial.opportunity,
        ...(stage.tutorial.formula ? [`FORMULA  ${stage.tutorial.formula}`] : []),
        ...stage.tutorial.steps.map((step, index) => `${index + 1}.  ${step}`),
        `FINAL ANSWER  ${stage.tutorial.finalAnswer}`,
        ...(stage.tutorial.notes ? [stage.tutorial.notes] : []),
      ].join("\n\n"),
    [stage],
  );
  const writer = useTypewriter(script, onTypeTick);
  const compoundVisual = stage.tutorial.visualKind === "compound_walkthrough";
  const futureValueDemo = stage.id === "A4";
  const [demoStarted, setDemoStarted] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);
  const [demoState, setDemoState] = useState<CalculatorState>(EMPTY_CALCULATOR);
  const [demoNarration, setDemoNarration] = useState<string | null>(null);
  const actionIndex = useRef(0);
  const demoStateRef = useRef<CalculatorState>(EMPTY_CALCULATOR);
  const narrationRef = useRef<string>("Clear the calculator.");
  const visible = writer.visibleText;
  const advance = () => {
    if (futureValueDemo && writer.isComplete && !demoStarted) {
      startFutureValueDemo();
      return;
    }
    if (futureValueDemo && demoStarted && !demoComplete) return;
    if (writer.isComplete) onContinue();
    else writer.revealAll();
  };

  const startFutureValueDemo = () => {
    setDemoState(EMPTY_CALCULATOR);
    setDemoNarration("Clear the calculator.");
    demoStateRef.current = EMPTY_CALCULATOR;
    narrationRef.current = "Clear the calculator.";
    actionIndex.current = 0;
    setDemoStarted(true);
    onCalculatorDemo(true, EMPTY_CALCULATOR, "AC", "Clear the calculator.");
  };

  useEffect(() => {
    if (!futureValueDemo || !demoStarted || demoComplete) return;
    const timer = window.setInterval(() => {
      const action = FUTURE_VALUE_DEMO[actionIndex.current];
      if (!action) {
        window.clearInterval(timer);
        setDemoComplete(true);
        setDemoNarration("Calculation complete. The future value is about $1,276.");
        onCalculatorDemo(false, null, null, null);
        return;
      }
      actionIndex.current += 1;
      const nextState = pressCalculator(
        action.button === "AC" && actionIndex.current === 1
          ? EMPTY_CALCULATOR
          : demoStateRef.current,
        action.button,
      );
      demoStateRef.current = nextState;
      setDemoState(nextState);
      if (action.narration) setDemoNarration(action.narration);
      onCalculatorDemo(
        true,
        nextState,
        action.button,
        action.narration ?? narrationRef.current,
      );
      narrationRef.current = action.narration ?? narrationRef.current;
    }, 360);
    return () => window.clearInterval(timer);
  }, [demoComplete, demoStarted, futureValueDemo, onCalculatorDemo]);

  useEffect(() => {
    demoStateRef.current = demoState;
  }, [demoState]);

  useEffect(() => () => onCalculatorDemo(false, null, null, null), [onCalculatorDemo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!futureValueDemo || demoComplete) onContinue();
      } else if (event.key === " " || event.key === "Enter") {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <main className="lesson-screen">
      <section className="lesson-card stage-tutorial-card" aria-labelledby="tutorial-title">
        <div className="lesson-kicker">{stage.id} · {stage.title.toUpperCase()}</div>
        <h1 id="tutorial-title">{stage.tutorial.title}</h1>
        <div className={compoundVisual ? "compound-tutorial-layout" : ""} aria-live="polite">
          <div className="stage-tutorial-copy">
            {visible.split("\n").map((line, lineIndex) =>
              line ? (
                <p
                  className={
                    line.startsWith("FINAL ANSWER")
                      ? "final-answer"
                      : line.startsWith("FORMULA")
                        ? "formula-line"
                        : line === stage.tutorial.notes
                          ? "lesson-note"
                          : ""
                  }
                  key={`${line}-${lineIndex}`}
                >
                  <FinancialText text={line} />
                </p>
              ) : <div className="copy-gap" key={`tutorial-gap-${lineIndex}`} />,
            )}
          </div>
          {compoundVisual && (
            <aside className="compound-walkthrough" aria-label="Compound interest worked visualization">
              <p>START</p>
              <strong>$1,000</strong>
              <span className="compound-rate">3% PER YEAR</span>
              {visible.includes("multiply our money by 1.03.") && (
                <div className="compound-step">
                  <p>YEAR 1</p>
                  <span>$1,000 × 1.03</span>
                  <strong>$1,030</strong>
                </div>
              )}
              {visible.includes("$1,030 we now have.") && (
                <div className="compound-handoff">$1,030 BECOMES YEAR 2'S START ↓</div>
              )}
              {visible.includes("$1,030 × 1.03 = $1,060.90.") && (
                <div className="compound-step">
                  <p>YEAR 2</p>
                  <span>$1,030 × 1.03</span>
                  <strong>$1,060.90</strong>
                </div>
              )}
              {visible.includes("we can write × 1.03².") && (
                <div className="compound-shortcut">$1,000 × 1.03² = $1,060.90</div>
              )}
              {visible.includes("Future Value = Starting Money") && (
                <div className="compound-shortcut">
                  Future Value = Starting Money × (1 + rate)^years
                </div>
              )}
            </aside>
          )}
          {futureValueDemo && writer.isComplete && (
            <aside className="future-value-demo" aria-live="polite">
              <h2>CALCULATOR WALKTHROUGH</h2>
              <p>{demoNarration ?? "Watch how to enter the base, power, and exponent."}</p>
              {demoComplete && (
                <div className="future-value-demo-result">
                  <code>1,000 × 1.05⁵</code>
                  <strong>${demoState.result}</strong>
                </div>
              )}
            </aside>
          )}
        </div>
        <footer className="lesson-actions">
          <span className="lesson-hint">
            {futureValueDemo && writer.isComplete && !demoComplete
              ? demoStarted ? "Follow the calculator demonstration" : "Run the calculator demonstration before starting"
              : writer.isComplete ? "Click or press Space / Enter to begin" : "Click or press Space / Enter to reveal"}
          </span>
          <button
            className="secondary-button skip-button"
            disabled={futureValueDemo && !demoComplete}
            onClick={onContinue}
            title={futureValueDemo && !demoComplete ? "Complete the Future Value calculator walkthrough first." : undefined}
            type="button"
          >
            SKIP
          </button>
          <button className="primary-button" disabled={demoStarted && !demoComplete} onClick={advance} type="button">
            {!writer.isComplete
              ? "SHOW ALL →"
              : futureValueDemo && !demoStarted
                ? "DEMO CALCULATOR →"
                : futureValueDemo && !demoComplete
                  ? "CALCULATING…"
                  : `START ${stage.id} →`}
          </button>
        </footer>
      </section>
    </main>
  );
}

export default A1TutorialScreen;
