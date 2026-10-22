import { nextStageA, STAGE_A } from "../game/definitions/stages";
import type { GameSave } from "../progress/persistence/gameSave";

type MapScreenProps = {
  save: GameSave;
  onContinue: () => void;
  onLifestyle: () => void;
  onMenu: () => void;
};

function MapScreen({ save, onContinue, onLifestyle, onMenu }: MapScreenProps) {
  const currentComplete = save.completedStages.includes(save.currentStageId);
  const nextId = currentComplete ? nextStageA(save.currentStageId) : null;
  const continueLabel = currentComplete
    ? nextId ? `CONTINUE TO ${nextId} →` : "STAGE A COMPLETE"
    : `RESUME ${save.currentStageId} →`;

  return (
    <main className="map-screen">
      <section className="map-card" aria-labelledby="map-title">
        <p className="lesson-kicker">PLAYER PROGRESSION</p>
        <h1 id="map-title">STAGE MAP</h1>
        <p className="map-description">Complete each substage to unlock the next stop on your valuation journey.</p>
        <div className="stage-map-list">
          {STAGE_A.map((stage) => {
            const completed = save.completedStages.includes(stage.id);
            const available = stage.id === save.currentStageId ||
              (currentComplete && stage.id === nextId);
            return (
              <div className={`stage-map-node${completed ? " completed" : ""}${available ? " available" : " locked"}`} key={stage.id}>
                <span className="stage-map-id">{stage.id}</span>
                <div><strong>{stage.title}</strong><span>{completed ? "COMPLETE" : available ? "AVAILABLE" : "LOCKED"}</span></div>
                {completed && <span aria-label="Completed">✓</span>}
              </div>
            );
          })}
        </div>
        <div className="map-actions">
          <button className="primary-button" disabled={!nextId && currentComplete} onClick={onContinue} type="button">
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
