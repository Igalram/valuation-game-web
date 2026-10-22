import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IntroChunk } from "../game/definitions/stages";
import { pressCalculator, EMPTY_CALCULATOR, type CalculatorState } from "../game/logic/calculator";
import { useTypewriter } from "../game/useTypewriter";
import FinancialText from "./FinancialText";

type IntroScreenProps = {
  chunk: IntroChunk;
  index: number;
  onAdvance: () => void;
  onSkip: () => void;
  onTypeTick: () => void;
  onCalculatorVisibility: (visible: boolean) => void;
  onCalculatorDemoState: (state: CalculatorState | null) => void;
};

const DEMO_STEPS: [number, string][] = [
  [0, "AC"], [180, "5"], [310, "0"], [440, "0"], [570, "0"], [700, "0"],
  [830, "÷"], [1030, "0"], [1160, "."], [1290, "0"], [1420, "4"], [1660, "="],
  [2750, "AC"], [2960, "5"], [3090, "0"], [3220, "0"], [3350, "0"], [3480, "0"],
  [3660, "÷"], [3860, "4"], [4010, "%"], [4250, "="], [5350, "__close__"],
];

function scriptFor(chunk: IntroChunk): string {
  const lines = [...chunk.paragraphs];
  if (chunk.equation) lines.splice(Math.max(0, lines.length - 1), 0, chunk.equation);
  lines.push(...(chunk.emphasis ?? []), ...(chunk.decisions ?? []));
  return lines.join("\n\n");
}

function IntroScreen({
  chunk,
  index,
  onAdvance,
  onSkip,
  onTypeTick,
  onCalculatorVisibility,
  onCalculatorDemoState,
}: IntroScreenProps) {
  const script = useMemo(() => scriptFor(chunk), [chunk]);
  const [demoPhase, setDemoPhase] = useState<"intro" | "highlight" | "running" | "conclusion">("intro");
  const [demoState, setDemoState] = useState<CalculatorState>(EMPTY_CALCULATOR);
  const stepRef = useRef(0);
  const demoStartedAt = useRef(0);
  const conclusionScript = [
    "Same answer.",
    "4% and 0.04 mean exactly the same thing.",
    "So when a question gives you a yield as a percentage, you can type the % directly into the calculator.",
  ].join("\n\n");
  const displayedScript = chunk.calculatorDemo && demoPhase === "conclusion"
    ? conclusionScript
    : script;
  const writer = useTypewriter(displayedScript, onTypeTick);

  useEffect(() => {
    onCalculatorDemoState(demoPhase === "running" ? demoState : null);
  }, [demoPhase, demoState, onCalculatorDemoState]);

  const revealDemoConclusion = useCallback(() => {
    onCalculatorVisibility(false);
    setDemoPhase("conclusion");
  }, [onCalculatorVisibility]);

  useEffect(() => {
    if (!chunk.calculatorDemo || demoPhase !== "intro" || !writer.isComplete) return;
    setDemoPhase("highlight");
    demoStartedAt.current = performance.now();
  }, [chunk.calculatorDemo, demoPhase, writer.isComplete]);

  useEffect(() => {
    if (demoPhase !== "highlight") return;
    const timeout = window.setTimeout(() => {
      setDemoState(EMPTY_CALCULATOR);
      stepRef.current = 0;
      demoStartedAt.current = performance.now();
      onCalculatorVisibility(true);
      setDemoPhase("running");
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [demoPhase, onCalculatorVisibility]);

  useEffect(() => {
    if (demoPhase !== "running") return;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - demoStartedAt.current;
      while (stepRef.current < DEMO_STEPS.length && elapsed >= DEMO_STEPS[stepRef.current]![0]) {
        const token = DEMO_STEPS[stepRef.current]![1];
        stepRef.current += 1;
        if (token === "__close__") {
          revealDemoConclusion();
          setDemoPhase("conclusion");
          window.clearInterval(timer);
          return;
        }
        setDemoState((current) => pressCalculator(current, token));
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [demoPhase, revealDemoConclusion]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
      } else if (event.key === " " || event.key === "Enter") {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const advance = () => {
    if (demoPhase === "highlight" || demoPhase === "running") {
      let finished: CalculatorState = EMPTY_CALCULATOR;
      for (const token of ["5", "0", "0", "0", "0", "÷", "0", ".", "0", "4", "="]) {
        finished = pressCalculator(finished, token);
      }
      for (const token of ["AC", "5", "0", "0", "0", "0", "÷", "4", "%", "="]) {
        finished = pressCalculator(finished, token);
      }
      setDemoState(finished);
      revealDemoConclusion();
      return;
    }
    if (!writer.isComplete) {
      writer.revealAll();
      return;
    }
    if (chunk.calculatorDemo && demoPhase === "intro") return;
    if (demoPhase === "conclusion" && !writer.isComplete) return;
    onAdvance();
  };

  const showConclusion = chunk.calculatorDemo && demoPhase === "conclusion";
  const complete = writer.isComplete;
  const canAdvance = complete && (!chunk.calculatorDemo || demoPhase === "conclusion");
  const finalCard = index === 5;

  return (
    <main className="lesson-screen">
      <section className="lesson-card" aria-labelledby="intro-title">
        <div className="lesson-kicker">A0 · MONEY THROUGH TIME</div>
        <div className="lesson-counter">{index + 1} / 6</div>
        <h1 id="intro-title">{showConclusion ? "USING THE CALCULATOR" : chunk.title}</h1>
        <div className="lesson-content" aria-live="polite">
          {showConclusion ? (
            <div className="lesson-copy conclusion-copy">
              {writer.visibleText.split("\n").map((line, lineIndex) => (
                line ? <p key={`${line}-${lineIndex}`}><FinancialText text={line} /></p> : <div className="copy-gap" key={`conclusion-gap-${lineIndex}`} />
              ))}
              <div className="demo-result">
                <span>5,000 ÷ 4%</span>
                <strong>{demoState.result}</strong>
              </div>
            </div>
          ) : (
            <div className={chunk.table ? "lesson-copy with-table" : "lesson-copy"}>
              <div className="typewriter-copy">
                {writer.visibleText.split("\n").map((line, lineIndex) => (
                  line ? (
                    <p
                      className={[
                        chunk.emphasis?.includes(line) || chunk.decisions?.includes(line) || line === chunk.equation
                          ? "emphasized-copy"
                          : "",
                        line.includes("MONEY TODAY IS WORTH MORE") ? "money-rule" : "",
                      ].filter(Boolean).join(" ")}
                      key={`${line}-${lineIndex}`}
                    >
                      <FinancialText text={line} />
                    </p>
                  ) : <div className="copy-gap" key={`gap-${lineIndex}`} />
                ))}
              </div>
              {chunk.table && complete && (
                <div className="yield-table" aria-label="Yield and multiple cheat sheet">
                  {chunk.table.map(([yieldRate, multiple]) => (
                    <div key={yieldRate}><span>{yieldRate}</span><strong>{multiple}</strong></div>
                  ))}
                </div>
              )}
            </div>
          )}
          {chunk.calculatorDemo && demoPhase === "running" && (
            <div className="demo-status" aria-live="polite">
              <span>CALCULATOR</span>
              <code>{demoState.expression || "0"}</code>
              <strong>{demoState.result}</strong>
            </div>
          )}
        </div>
        <div className="lesson-actions">
          <span className="lesson-hint">
            {complete ? "Click or press Space / Enter to continue" : "Click or press Space / Enter to reveal"}
          </span>
          <button className="secondary-button skip-button" onClick={onSkip} type="button">SKIP</button>
          <button className="primary-button" onClick={advance} type="button">
            {!complete ? "SHOW ALL →" : canAdvance ? finalCard ? "START A1 →" : "CONTINUE →" : "CONTINUE →"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default IntroScreen;
