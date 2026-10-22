export type CalculatorState = {
  expression: string;
  result: string;
  error: boolean;
  justEvaluated: boolean;
};

export const EMPTY_CALCULATOR: CalculatorState = {
  expression: "",
  result: "0",
  error: false,
  justEvaluated: false,
};

type Token = { kind: "number" | "operator"; value: number | string };

class CalculatorInputError extends Error {}

function tokenize(expression: string): Token[] {
  const normalized = expression
    .split("×").join("*")
    .split("÷").join("/")
    .split("−").join("-");
  const tokens: Token[] = [];
  let index = 0;
  while (index < normalized.length) {
    const character = normalized[index]!;
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    const number = normalized.slice(index).match(/^(?:\d+\.?\d*|\.\d+)/);
    if (number) {
      const raw = number[0];
      index += raw.length;
      let value = Number(raw);
      if (normalized[index] === "%") {
        value /= 100;
        index += 1;
      }
      tokens.push({ kind: "number", value });
      continue;
    }
    if ("+-*/^()".includes(character)) {
      tokens.push({ kind: "operator", value: character });
      index += 1;
      continue;
    }
    throw new CalculatorInputError("Invalid expression");
  }
  return tokens;
}

class ExpressionParser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    if (this.tokens.length === 0) throw new CalculatorInputError("Invalid expression");
    const result = this.sum();
    if (this.position !== this.tokens.length) {
      throw new CalculatorInputError("Invalid expression");
    }
    if (!Number.isFinite(result) || Math.abs(result) >= 1e100) {
      throw new CalculatorInputError("Result is out of range");
    }
    return result;
  }

  private sum(): number {
    let value = this.product();
    while (this.match("+") || this.match("-")) {
      const operator = this.previous();
      const right = this.product();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  private product(): number {
    let value = this.unary();
    while (this.match("*") || this.match("/")) {
      const operator = this.previous();
      const right = this.unary();
      if (operator === "/" && right === 0) {
        throw new CalculatorInputError("Division by zero");
      }
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  private unary(): number {
    if (this.match("+")) return this.unary();
    if (this.match("-")) return -this.unary();
    return this.power();
  }

  private power(): number {
    const value = this.primary();
    if (this.match("^")) {
      const exponent = this.unary();
      if (Math.abs(exponent) > 100) {
        throw new CalculatorInputError("Exponent is out of range");
      }
      return value ** exponent;
    }
    return value;
  }

  private primary(): number {
    if (this.match("(")) {
      const value = this.sum();
      if (!this.match(")")) throw new CalculatorInputError("Invalid expression");
      return value;
    }
    const token = this.tokens[this.position];
    if (token?.kind === "number") {
      this.position += 1;
      if (typeof token.value === "number") return token.value;
    }
    throw new CalculatorInputError("Invalid expression");
  }

  private match(value: string): boolean {
    if (this.tokens[this.position]?.value !== value) return false;
    this.position += 1;
    return true;
  }

  private previous(): string {
    return this.tokens[this.position - 1]!.value as string;
  }
}

export function evaluateExpression(expression: string): number {
  return new ExpressionParser(tokenize(expression)).parse();
}

export function formatResult(value: number): string {
  if (value === Math.trunc(value)) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  const precision = Math.abs(value) >= 100 ? 2 : 8;
  return value
    .toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    })
    .replace(/\.?0+$/, (trailing) => (trailing.startsWith(".") ? "" : trailing));
}

function append(state: CalculatorState, character: string): CalculatorState {
  const expression =
    state.justEvaluated && (/\d/.test(character) || character === ".")
      ? character
      : `${state.expression}${character}`;
  return {
    expression,
    result: state.justEvaluated && (/\d/.test(character) || character === ".")
      ? "0"
      : state.result,
    error: false,
    justEvaluated: false,
  };
}

export function pressCalculator(
  state: CalculatorState,
  label: string,
): CalculatorState {
  if (label === "AC") return EMPTY_CALCULATOR;
  if (label === "⌫") {
    return {
      ...state,
      expression: state.expression.slice(0, -1),
      error: false,
      justEvaluated: false,
    };
  }
  if (label === "=") {
    try {
      return {
        ...state,
        result: formatResult(evaluateExpression(state.expression)),
        error: false,
        justEvaluated: true,
      };
      } catch (error) {
        if (!(error instanceof CalculatorInputError)) throw error;
        return { ...state, result: "Error", error: true, justEvaluated: true };
    }
  }
  if (["+", "−", "×", "÷", "xʸ", "^"].includes(label)) {
    const symbol = label === "−" ? "-" : label === "xʸ" ? "^" : label;
    if (!state.expression && symbol !== "-") return state;
    if (symbol === "×" && state.expression.endsWith("×")) {
      return {
        ...state,
        expression: `${state.expression.slice(0, -1)}^`,
        error: false,
        justEvaluated: false,
      };
    }
    const expression = /[+\-×÷^]$/.test(state.expression)
      ? state.expression.slice(0, -1)
      : state.expression;
    return append({ ...state, expression }, symbol);
  }
  if (label === "%") {
    if (!state.expression || !/[\d.]$/.test(state.expression)) return state;
    return append(state, "%");
  }
  if (label === ".") {
    const parts = state.expression.split(/[+\-×÷^]/);
    const current = parts[parts.length - 1] ?? "";
    if (current.includes(".")) return state;
    return append(state, current ? "." : "0.");
  }
  if (/^\d$/.test(label)) return append(state, label);
  return state;
}
