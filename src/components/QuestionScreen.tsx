import type { TimeValueQuestion } from "../game/logic/questions";
import { potentialPoints, roundedPoints } from "../game/logic/speed";
import { getStageA } from "../game/definitions/stages";
import FinancialText from "./FinancialText";
import PlayerIdentityCard from "./PlayerIdentityCard";
import type { PlayerAvatarId } from "../game/logic/playerProfile";

type QuestionScreenProps = {
  question: TimeValueQuestion;
  questionNumber: number;
  answeredQuestions: number;
  elapsedMs: number;
  questionPerformancePoints: number;
  feedback: string[];
  answered: boolean;
  onAnswer: (answer: string) => void;
  onContinue: () => void;
  onTutorial: () => void;
  onCalculator: () => void;
  audioMuted: boolean;
  availableCash: number;
  completedStages: readonly string[];
  playerName: string;
  playerAvatarId: PlayerAvatarId;
  streak: number;
  onToggleAudio: () => void;
  onMenu: () => void;
  onEditProfile: () => void;
};

function formatClock(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function QuestionScreen({
  question,
  questionNumber,
  answeredQuestions,
  elapsedMs,
  questionPerformancePoints,
  feedback,
  answered,
  onAnswer,
  onContinue,
  onTutorial,
  onCalculator,
  audioMuted,
  availableCash,
  completedStages,
  playerName,
  playerAvatarId,
  streak,
  onToggleAudio,
  onMenu,
  onEditProfile,
}: QuestionScreenProps) {
  const points = roundedPoints(
    potentialPoints(elapsedMs / 1000 / getStageA(question.stageId).timeFactor),
  );
  const displayedPoints = answered ? questionPerformancePoints : points;
  const stage = getStageA(question.stageId);
  const timeline = answered ? question.completedDiagram : question.diagram;

  return (
    <main className="game-screen">
      <header className="game-topbar">
        <PlayerIdentityCard
          availableCash={availableCash}
          avatarId={playerAvatarId}
          completedStages={completedStages}
          name={playerName}
          onEdit={onEditProfile}
        />
        <div className="progress-block" aria-label={`A1 question ${questionNumber} of 8`}>
          <div className="progress-caption"><span>{stage.id} · {stage.title.toUpperCase()}</span><strong>{questionNumber} / 8</strong></div>
          <div className="progress-track"><span style={{ width: `${(answeredQuestions / 8) * 100}%` }} /></div>
          <div className="stage-letters" aria-hidden="true">
            {"ABCDEFGH".split("").map((letter, index) => (
              <span className={index === 0 ? "current" : ""} key={letter}>{letter}</span>
            ))}
          </div>
        </div>
        <div className="timer-card" aria-live="off">
          <div className="timer-heading"><span>TIME</span><strong>{formatClock(elapsedMs)}</strong></div>
          <div className="fee-track"><span style={{ width: `${Math.min(100, (Math.max(0, displayedPoints) / 100_000) * 100)}%` }} /></div>
          <div className="fee-heading">
            <span>{answered ? "Points scored" : "Potential points"}</span>
            <strong>{displayedPoints < 0 ? `−${Math.abs(displayedPoints).toLocaleString("en-US")}` : displayedPoints.toLocaleString("en-US")}</strong>
          </div>
        </div>
        <div className="top-actions">
          <button aria-label="Open calculator" onClick={onCalculator} type="button" title="Calculator (C)">⌗</button>
          <button onClick={onTutorial} type="button">EXAMPLE</button>
          <button aria-label={audioMuted ? "Turn sound on" : "Mute sound"} onClick={onToggleAudio} type="button">
            {audioMuted ? "SOUND OFF" : "SOUND ON"}
          </button>
          <button aria-label="Open game menu" onClick={onMenu} type="button">MENU</button>
        </div>
      </header>

      <section className="question-panel" aria-labelledby="question-title">
        <div className="question-copy">
          <div className="question-kicker">MONEY THROUGH TIME</div>
          <h1 id="question-title">{stage.title}</h1>
          <p className="question-prompt"><FinancialText text={question.prompt} /></p>
          <div className="answer-grid">
            {question.choices.map((choice, index) => (
              <button
                aria-label={`${index + 1}. ${choice}`}
                className={`answer-choice${answered && choice === question.correctAnswer ? " correct-choice" : ""}`}
                data-testid="answer-choice"
                disabled={answered}
                key={choice}
                onClick={() => onAnswer(choice)}
                type="button"
              >
                <span className="choice-number">[{index + 1}]</span>
                <strong className={choice.includes("%") ? "financial-rate" : ""}>
                  <FinancialText text={choice} />
                </strong>
              </button>
            ))}
          </div>
          {answered && (
            <div className="answer-feedback" role="status">
              {feedback.map((line, index) => (
                <p className={index === 0 && line.startsWith("Correct") ? "feedback-correct" : ""} key={line}>
                  <FinancialText text={line} />
                </p>
              ))}
              <button className="primary-button continue-button" onClick={onContinue} type="button">
                CONTINUE →
              </button>
            </div>
          )}
          <div className="question-footer">
            <span>Choose an answer · Press 1, 2 or 3</span>
            <span>Correct streak: {streak}</span>
          </div>
        </div>
        <aside className="timeline-card" aria-label="Money timeline">
          <h2>MONEY TIMELINE</h2>
          <svg aria-hidden="true" className="timeline-graphic" viewBox="0 0 300 116">
            <line x1="36" y1="50" x2="264" y2="50" />
            {timeline.map(([label, value], index) => {
              const x = timeline.length === 1 ? 150 : 36 + (index * 228) / (timeline.length - 1);
              return (
                <g key={label}>
                  <circle cx={x} cy="50" r="5" />
                  <text className="timeline-label" textAnchor="middle" x={x} y="24">{label}</text>
                  <text
                    className={`timeline-value${value.includes("%") ? " rate-value" : label.includes("YEAR") ? " time-value" : ""}`}
                    textAnchor="middle"
                    x={x}
                    y="82"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="timeline-note">
            {stage.id === "A2"
              ? "A negative return reduces the starting value."
              : "Interest is the price paid for using money over time."}
          </p>
        </aside>
      </section>
    </main>
  );
}

export default QuestionScreen;
