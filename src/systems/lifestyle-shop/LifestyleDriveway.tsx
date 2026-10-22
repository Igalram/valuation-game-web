import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { GameSave } from "../../progress/persistence/gameSave";
import LifestyleScene from "./LifestyleScene";

type LifestyleDrivewayProps = {
  save: GameSave;
};

function LifestyleDriveway({ save }: LifestyleDrivewayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const latestSaveRef = useRef(save);
  latestSaveRef.current = save;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;
    let game: Phaser.Game | null = null;
    const frame = window.requestAnimationFrame(() => {
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        backgroundColor: "#0c1321",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1200,
          height: 720,
        },
        scene: [new LifestyleScene(latestSaveRef.current)],
      });
      gameRef.current = game;
    });
    return () => {
      window.cancelAnimationFrame(frame);
      gameRef.current = null;
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const updateScene = () => {
      const scene = game.scene.getScene("LifestyleScene") as LifestyleScene | null;
      scene?.updateSave(latestSaveRef.current);
    };
    game.events.once(Phaser.Core.Events.READY, updateScene);
    updateScene();
    return () => {
      game.events.off(Phaser.Core.Events.READY, updateScene);
    };
  }, [save]);

  return <div className="lifestyle-driveway-canvas" ref={containerRef} aria-label="Lifestyle driveway scene" />;
}

export default LifestyleDriveway;
