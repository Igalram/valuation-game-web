import { ALL_SCORED_STAGES, nextStage } from "../game/definitions/stages";
import type { GameSave } from "../progress/persistence/gameSave";

type MapScreenProps = {
  save: GameSave;
  onContinue: () => void;
  onLifestyle: () => void;
  onMenu: () => void;
};

function MapScreen({ save, onContinue, onLifestyle, onMenu }: MapScreenProps) {
  const currentComplete = save.completedStages.includes(save.currentStageId);
  const nextId = currentComplete ? nextStage(save.currentStageId) : null;
  const stageAComplete = ALL_SCORED_STAGES
    .filter(({ id }) => id.startsWith("A"))
    .every(({ id }) => save.completedStages.includes(id));
  const stageBIntroSeen = save.tutorialsSeenStages.includes("B0");
  const openIntro = stageAComplete && !stageBIntroSeen;
  const continueLabel = openIntro
    ? "CONTINUE TO B0 →"
    : currentComplete
      ? nextId ? `CONTINUE TO ${nextId} →` : "ALL STAGES COMPLETE"
      : `RESUME ${save.currentStageId} →`;

  return (
    <main className="map-screen">
      <section className="map-card" aria-labelledby="map-title">
        <p className="lesson-kicker">PLAYER PROGRESSION</p>
        <h1 id="map-title">STAGE MAP</h1>
        <p className="map-description">Complete each substage to unlock the next stop on your valuation journey.</p>
        <div className="stage-map-list">
          {ALL_SCORED_STAGES.map((stage) => {
            const completed = save.completedStages.includes(stage.id);
            const available = stage.id === save.currentStageId ||
              (currentComplete && stage.id === nextId &&
                (stage.id !== "B1" || stageBIntroSeen)) ||
              (stage.id === "B1" && stageBIntroSeen && !completed);
            return (
              <div className={`stage-map-node ${completed ? "completed" : available ? "available" : "locked"}`} key={stage.id}>
                <span className="stage-map-id">{stage.id}</span>
                <div><strong>{stage.title}</strong><span>{completed ? "COMPLETE" : available ? "AVAILABLE" : "LOCKED"}</span></div>
                {completed && <span aria-label="Completed">✓</span>}
              </div>
            );
          })}
        </div>
        <section className={`stage-map-node ${stageBIntroSeen ? "completed" : stageAComplete ? "available" : "locked"}`} aria-label="Stage B introduction">
          <span className="stage-map-id">B0</span>
          <div>
            <strong>Yield &amp; Valuation Intro</strong>
            <span>{stageBIntroSeen ? "COMPLETE" : stageAComplete ? "AVAILABLE" : "LOCKED · COMPLETE STAGE A"}</span>
          </div>
          {stageBIntroSeen && <span aria-label="Completed">✓</span>}
        </section>
        <div className="map-actions">
          <button className="primary-button" disabled={!openIntro && !nextId && currentComplete} onClick={onContinue} type="button">
            {continueLabel}
          </button>
          <button className="secondary-button" onClick={onLifestyle} type="button">VISIT LIFESTYLE</button>
          <button className="secondary-button" onClick={onMenu} type="button">MAIN MENU</button>
        </div>
      </section>
    </main>
  );
}

export default MapScreen;
