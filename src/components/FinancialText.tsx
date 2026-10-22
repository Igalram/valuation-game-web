import type { ReactNode } from "react";

type FinancialTextProps = {
  text: string;
};

const FINANCIAL_VALUE = /(\$[\d,]+(?:\.\d+)?(?:[mk])?|\b\d+(?:\.\d+)?%|\b\d+\s+years?\b|\bYEAR\s+\d+\b|\bTODAY\b|\bFOREVER\b)/gi;

function financialClass(value: string): string {
  if (value.startsWith("$")) return "financial-money";
  if (value.includes("%")) return "financial-rate";
  return "financial-time";
}

function FinancialText({ text }: FinancialTextProps) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = FINANCIAL_VALUE.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(
      <span className={financialClass(match[0])} key={`${match.index}-${match[0]}`}>
        {match[0]}
      </span>,
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  FINANCIAL_VALUE.lastIndex = 0;
  return <>{parts}</>;
}

export default FinancialText;
