import Phaser from "phaser";

class PlaceholderScene extends Phaser.Scene {
  constructor() {
    super("PlaceholderScene");
  }

  create() {
    this.add
      .text(480, 245, "PHASER PLACEHOLDER", {
        color: "#f4f7fb",
        fontFamily: "Arial, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(480, 290, "Game content will be added later", {
        color: "#aab8cc",
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
      })
      .setOrigin(0.5);
  }
}

export default PlaceholderScene;
