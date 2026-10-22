type LandingScreenProps = {
  hasSavedGame: boolean;
  confirmNewGame: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onConfirmNewGame: () => void;
  onCancelNewGame: () => void;
  onOpenMap: () => void;
  onOpenLifestyle: () => void;
};

function LandingScreen({
  hasSavedGame,
  confirmNewGame,
  onContinue,
  onNewGame,
  onConfirmNewGame,
  onCancelNewGame,
  onOpenMap,
  onOpenLifestyle,
}: LandingScreenProps) {
  return (
    <main className="landing-screen">
      <section className="landing-content" aria-labelledby="game-title">
        <p className="eyebrow">A learning game</p>
        <h1 id="game-title">VALUATION LAB</h1>
        <p className="landing-description">
          Learn how money changes value over time.
        </p>
        {confirmNewGame ? (
          <div className="confirmation-card" role="alertdialog" aria-labelledby="confirm-title">
            <h2 id="confirm-title">Start a new game?</h2>
            <p>Your current browser save will be replaced.</p>
            <div className="landing-actions">
              <button className="primary-button" onClick={onConfirmNewGame} type="button">
                START NEW GAME
              </button>
              <button className="secondary-button" onClick={onCancelNewGame} type="button">
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div className="landing-menu-actions">
            <div className="landing-actions">
              {hasSavedGame && (
                <button className="primary-button" onClick={onContinue} type="button">
                  CONTINUE
                </button>
              )}
              <button
                className={hasSavedGame ? "secondary-button" : "primary-button"}
                onClick={onNewGame}
                type="button"
              >
                NEW GAME
              </button>
            </div>
            <div className="landing-actions">
              <button className="secondary-button" onClick={onOpenMap} type="button">STAGE MAP</button>
              <button className="secondary-button" onClick={onOpenLifestyle} type="button">LIFESTYLE</button>
            </div>
          </div>
        )}
        <p className="save-caption">Progress saves in this browser.</p>
      </section>
    </main>
  );
}

export default LandingScreen;
