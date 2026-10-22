import type { StageResult } from "../game/logic/progression";
import type { StageDefinition } from "../game/definitions/stages";
import { STAGE_A } from "../game/definitions/stages";

type CompletionScreenProps = {
  result: StageResult;
  stage: StageDefinition;
  careerEarnings: number;
  availableCash: number;
  completedStages: readonly string[];
  onLifestyle: () => void;
  onMap: () => void;
};

function CompletionScreen({
  result,
  stage,
  careerEarnings,
  availableCash,
  completedStages,
  onLifestyle,
  onMap,
}: CompletionScreenProps) {
  const completedCount = STAGE_A.filter(({ id }) => completedStages.includes(id)).length;
  return (
    <main className="summary-screen">
      <section className="summary-card" aria-labelledby="summary-title">
        <div className="lesson-kicker">SUBSTAGE COMPLETE</div>
        <h1 id="summary-title">{stage.id} · {stage.title.toUpperCase()}</h1>
        <div className="summary-rating">{result.result}</div>
        <div className="summary-score">
          <strong>{result.correctAnswers} / {result.totalQuestions}</strong>
          <span>correct · {result.accuracyPct}% accuracy</span>
        </div>
        <section className="stage-a-progress" aria-label="Stage A completion progress">
          <div className="stage-a-progress-heading">
            <span>STAGE A — TIME VALUE OF MONEY</span>
            <strong>{completedCount} / {STAGE_A.length} COMPLETE</strong>
          </div>
          <ol className="stage-a-progress-list">
            {STAGE_A.map((stageDefinition) => {
              const completed = completedStages.includes(stageDefinition.id);
              return (
                <li
                  aria-label={`${stageDefinition.id} ${completed ? "completed" : "not completed"}`}
                  className={completed ? "completed" : ""}
                  key={stageDefinition.id}
                >
                  <span>{stageDefinition.id}</span>
                  {completed && <span aria-hidden="true">✓</span>}
                </li>
              );
            })}
          </ol>
        </section>
        <div className="summary-stats">
          <div><span>SUBSTAGE EARNINGS</span><strong className="money-value">${result.earnings.toLocaleString("en-US")}</strong></div>
          <div><span>PERFORMANCE POINTS</span><strong>{result.performancePoints.toLocaleString("en-US")}</strong></div>
          <div><span>CASH CREDITED</span><strong className="money-value">${result.cashCredited.toLocaleString("en-US")}</strong></div>
          <div><span>AVAILABLE CASH</span><strong>${availableCash.toLocaleString("en-US")}</strong></div>
          <div><span>CAREER EARNINGS</span><strong>${careerEarnings.toLocaleString("en-US")}</strong></div>
        </div>
        <p className="next-stage-note">Your earnings are saved. Visit Lifestyle or continue to the Stage A map.</p>
        <div className="summary-actions">
          <button className="primary-button" onClick={onLifestyle} type="button">VISIT LIFESTYLE →</button>
          <button className="secondary-button" onClick={onMap} type="button">CONTINUE TO MAP →</button>
        </div>
      </section>
    </main>
  );
}

export default CompletionScreen;
