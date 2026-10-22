import { useEffect, useState } from "react";
import {
  EMPTY_CALCULATOR,
  pressCalculator,
  type CalculatorState,
} from "../game/logic/calculator";

const BUTTONS = [
  ["AC", "⌫", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "=", "xʸ"],
];

type CalculatorProps = {
  visible: boolean;
  onClose: () => void;
  onEscape: () => void;
  demoState?: CalculatorState | null;
  demoActiveButton?: string | null;
  demoHint?: string | null;
  preventDemoClose?: boolean;
};

export type CalculatorHandle = {
  press: (label: string) => void;
};

function Calculator({
  visible,
  onClose,
  onEscape,
  demoState = null,
  demoActiveButton = null,
  demoHint = null,
  preventDemoClose = false,
}: CalculatorProps) {
  const [state, setState] = useState<CalculatorState>(EMPTY_CALCULATOR);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key.toLowerCase() === "c") {
        event.preventDefault();
        onEscape();
        return;
      }
      if (demoState !== null) return;
      const keyMap: Record<string, string> = {
        Enter: "=",
        "=": "=",
        Backspace: "⌫",
        Delete: "AC",
        "*": "×",
        "/": "÷",
        "-": "−",
      };
      const label = keyMap[event.key] ?? event.key;
      if (/^\d$/.test(label) || [".", "%", "+", "−", "×", "÷", "^", "=", "⌫", "AC"].includes(label)) {
        event.preventDefault();
        setState((current) => pressCalculator(current, label));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [demoState, onEscape, visible]);

  if (!visible) return null;
  const displayedState = demoState ?? state;
  const demonstrationRunning = demoState !== null;

  return (
    <div className="calculator-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Calculator"
        className="calculator-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="calculator-header">
          <span>CALCULATOR</span>
          <button aria-label="Close calculator" disabled={preventDemoClose} onClick={onClose} type="button">
            ×
          </button>
        </header>
        <div className="calculator-display" aria-live="polite">
          <div className="calculator-expression">{displayedState.expression || "0"}</div>
          <output className={displayedState.error ? "calculator-result is-error" : "calculator-result"}>
            {displayedState.result}
          </output>
        </div>
        <div className="calculator-keys">
          {BUTTONS.flat().map((label) => (
            <button
              className={[
                ["÷", "×", "−", "+", "=", "xʸ"].includes(label) ? "operator-key" : "",
                demonstrationRunning && demoActiveButton === label ? "demo-active-key" : "",
              ].filter(Boolean).join(" ")}
              data-demo-active={demonstrationRunning && demoActiveButton === label ? "true" : undefined}
              disabled={demonstrationRunning}
              key={label}
              onClick={() => setState((current) => pressCalculator(current, label))}
              type="button"
            >
              {label}
              {label === "xʸ" && <small>(××)</small>}
            </button>
          ))}
        </div>
        <p className="calculator-hint">
          {demonstrationRunning
            ? demoHint ?? "The lesson is demonstrating the calculator."
            : "C / Esc to close · % means ÷ 100"}
        </p>
      </section>
    </div>
  );
}

export default Calculator;
