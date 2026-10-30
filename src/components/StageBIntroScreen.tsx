import { useState } from "react";
import { B0_TUTORIAL } from "../game/definitions/stages";
import FinancialText from "./FinancialText";

type StageBIntroScreenProps = {
  onBack: () => void;
  onStartStage: () => void;
  onCalculator: () => void;
};

function StageBIntroScreen({ onBack, onStartStage, onCalculator }: StageBIntroScreenProps) {
  const [index, setIndex] = useState(0);
  const chunk = B0_TUTORIAL[index]!;
  const finalChunk = index === B0_TUTORIAL.length - 1;

  return (
    <main className="lesson-screen">
      <section className="lesson-card" aria-labelledby="stage-b-intro-title">
        <div className="lesson-kicker">B0 · YIELD &amp; VALUATION INTRO</div>
        <div className="lesson-counter">{index + 1} / {B0_TUTORIAL.length}</div>
        <h1 id="stage-b-intro-title">{chunk.title}</h1>
        <div className="lesson-content">
          <div className={chunk.table ? "lesson-copy with-table" : "lesson-copy"}>
            <div className="typewriter-copy">
              {chunk.paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  className={chunk.emphasis?.includes(paragraph) || chunk.decisions?.includes(paragraph) ? "emphasized-copy" : ""}
                  key={`${paragraphIndex}-${paragraph}`}
                >
                  <FinancialText text={paragraph} />
                </p>
              ))}
              {chunk.equation && <p className="formula-line">{chunk.equation}</p>}
              {chunk.calculatorDemo && (
                <button className="secondary-button" onClick={onCalculator} type="button">
                  OPEN CALCULATOR
                </button>
              )}
            </div>
            {chunk.table && (
              <div className="yield-table" aria-label="Yield and multiple cheat sheet">
                {chunk.table.map(([yieldRate, multiple]) => (
                  <div key={yieldRate}><span>{yieldRate}</span><strong>{multiple}</strong></div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="lesson-actions">
          {index > 0 ? (
            <button className="secondary-button" onClick={() => setIndex((current) => current - 1)} type="button">
              ← PREVIOUS
            </button>
          ) : (
            <button className="secondary-button" onClick={onBack} type="button">BACK TO MAP</button>
          )}
          {finalChunk ? (
            <button className="primary-button" onClick={onStartStage} type="button">START B1 →</button>
          ) : (
            <button className="primary-button" onClick={() => setIndex((current) => current + 1)} type="button">
              CONTINUE →
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default StageBIntroScreen;
