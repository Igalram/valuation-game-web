import { useEffect, useRef } from "react";
import Phaser from "phaser";
import PlaceholderScene from "../game/scenes/PlaceholderScene";

type GameViewportProps = {
  onBack: () => void;
};

function GameViewport({ onBack }: GameViewportProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = gameContainerRef.current;
    if (!parent) {
      return;
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: "#17243a",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 540,
      },
      scene: [PlaceholderScene],
    });

    return () => game.destroy(true);
  }, []);

  return (
    <section className="game-screen" aria-labelledby="game-area-title">
      <header className="game-header">
        <h1 id="game-area-title">Game area</h1>
        <button className="back-button" onClick={onBack} type="button">
          Back
        </button>
      </header>
      <div
        className="game-container"
        ref={gameContainerRef}
        aria-label="Placeholder game area"
      />
    </section>
  );
}

export default GameViewport;
