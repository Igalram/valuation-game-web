import Phaser from "phaser";
import type { GameSave } from "../../progress/persistence/gameSave";
import { getPlayerAvatar } from "../../game/logic/playerProfile";
import { LIFESTYLE_ITEM_BY_ID } from "./catalog";

const NAVY = 0x0c1321;
const PANEL = 0x182336;
const TEAL = 0x41b7c4;
const TEXT = 0xebf0f8;
const GOLD = 0xdcb257;
const LIGHT = 0xd2e1eb;
const DARK = 0x111e2d;
const PALETTE = [
  0x41b7c4, 0x8badc9, 0x6b87b3, 0xc28b6b, 0xbccbdd, 0x9ec0ae,
  0x527097, 0x3c4b6c, 0xb27197, 0xd4ac5b, 0x9977c4, 0xcd6b79,
];
const WORLD_SLOTS: Record<string, [number, number, number, number]> = {
  bicycle: [92, 427, 105, 58],
  two_wheeler: [211, 427, 112, 58],
  collectible_skateboard: [94, 373, 65, 24],
  collectible_basketball: [174, 366, 30, 32],
  collectible_toolbox: [221, 365, 46, 34],
  collectible_golf: [282, 351, 39, 63],
  collectible_sports: [342, 450, 48, 35],
  outdoor_surfboard: [433, 365, 32, 110],
  outdoor_atv: [582, 436, 76, 49],
  outdoor_jetski: [1054, 525, 92, 30],
};

export default class LifestyleScene extends Phaser.Scene {
  private save: GameSave;

  constructor(save: GameSave) {
    super("LifestyleScene");
    this.save = save;
  }

  preload() {
    for (let number = 1; number <= 8; number += 1) {
      const id = `car_${String(number).padStart(2, "0")}`;
      this.load.image(id, `${import.meta.env.BASE_URL}assets/lifestyle/cars/${id}.png`);
    }
  }

  create() {
    this.drawDriveway();
  }

  updateSave(save: GameSave) {
    this.save = save;
    if (this.scene.isActive()) this.drawDriveway();
  }

  private drawDriveway() {
    this.children.removeAll(true);
    const g = this.add.graphics();
    g.fillStyle(NAVY).fillRect(0, 0, 1200, 720);
    this.add.text(600, 24, "LIFESTYLE", {
      color: "#41b7c4", fontFamily: "Segoe UI, sans-serif", fontSize: "32px", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    this.add.text(600, 72, `Available cash: $${this.save.availableCash.toLocaleString("en-US")}`, {
      color: "#ebf0f8", fontFamily: "Segoe UI, sans-serif", fontSize: "17px",
    }).setOrigin(0.5, 0);

    g.fillStyle(0x275263).fillRoundedRect(30, 120, 1140, 440, 16);
    g.fillStyle(0xefc184).fillCircle(970, 218, 43);
    g.fillStyle(0x203f4e).fillPoints([
      new Phaser.Geom.Point(30, 360), new Phaser.Geom.Point(170, 290),
      new Phaser.Geom.Point(300, 345), new Phaser.Geom.Point(470, 278),
      new Phaser.Geom.Point(640, 353), new Phaser.Geom.Point(815, 303),
      new Phaser.Geom.Point(1040, 340), new Phaser.Geom.Point(1170, 290),
      new Phaser.Geom.Point(1170, 470), new Phaser.Geom.Point(30, 470),
    ], true);
    g.fillStyle(0x203f43).fillRect(30, 402, 1140, 158);
    g.fillStyle(0x4b5863).fillPoints([
      new Phaser.Geom.Point(300, 425), new Phaser.Geom.Point(1000, 425),
      new Phaser.Geom.Point(1170, 560), new Phaser.Geom.Point(60, 560),
    ], true);
    g.lineStyle(2, 0x66747b).lineBetween(50, 530, 1150, 530);

    this.drawHouse(g);
    this.drawDisplayedProperty(g);
    this.drawWorldItems(g);
    this.drawAvatar(g);
    this.drawVehicle(g);
    this.add.text(600, 575, LIFESTYLE_ITEM_BY_ID.get(this.save.equippedVehicleId)?.name ?? "Old Hatchback", {
      color: "#ebf0f8", fontFamily: "Segoe UI, sans-serif", fontSize: "23px",
    }).setOrigin(0.5);
    const ownedCars = this.save.ownedVehicleIds;
    const equippedIndex = Math.max(0, ownedCars.indexOf(this.save.equippedVehicleId));
    this.add.text(600, 621, `${equippedIndex + 1} / ${ownedCars.length} owned`, {
      color: "#41b7c4", fontFamily: "Segoe UI, sans-serif", fontSize: "17px",
    }).setOrigin(0.5);
    this.add.text(600, 677, "Use the shop controls below to browse and display your collection.", {
      color: "#9ba7ba", fontFamily: "Segoe UI, sans-serif", fontSize: "15px",
    }).setOrigin(0.5);
  }

  private drawHouse(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(PANEL).fillRect(65, 205, 350, 280);
    g.fillStyle(DARK).fillRect(50, 192, 380, 18);
    for (const x of [90, 245]) {
      g.fillStyle(0xe7b67c).fillRect(x, 227, 133, 84);
      g.lineStyle(6, PANEL).lineBetween(x + 66, 227, x + 66, 311);
    }
    g.fillStyle(0x0e1a26).fillRect(90, 341, 243, 144);
    for (let y = 355; y < 480; y += 22) {
      g.lineStyle(3, 0x2c3f4e).lineBetween(96, y, 327, y);
    }
    g.lineStyle(2, TEAL).strokeRect(347, 342, 43, 100);
    g.fillStyle(0xe6bb80).fillCircle(382, 398, 3);
  }

  private drawDisplayedProperty(g: Phaser.GameObjects.Graphics) {
    const propertyId = this.save.lifestyleSlots.property;
    if (!propertyId) return;
    const product = LIFESTYLE_ITEM_BY_ID.get(propertyId);
    if (!product) return;
    const color = PALETTE[product.variant % PALETTE.length]!;
    g.fillStyle(color).fillRect(65, 205, 350, 126);
    g.lineStyle(2, TEAL).strokeRect(65, 205, 350, 126);
    for (const x of [90, 245]) {
      g.fillStyle(GOLD).fillRect(x, 227, 133, 84);
      g.lineStyle(6, DARK).lineBetween(x + 66, 227, x + 66, 311);
    }
    if (product.variant >= 3) {
      g.fillStyle(LIGHT).fillRect(70, 211, 12, 116);
      g.fillRect(395, 211, 12, 116);
    }
    this.add.text(81, 210, product.name, {
      color: "#d2e1eb", fontFamily: "Segoe UI, sans-serif", fontSize: "12px",
    });
  }

  private drawWorldItems(g: Phaser.GameObjects.Graphics) {
    for (const [slot, bounds] of Object.entries(WORLD_SLOTS)) {
      const product = LIFESTYLE_ITEM_BY_ID.get(this.save.lifestyleSlots[slot as keyof GameSave["lifestyleSlots"]] ?? "");
      if (!product) continue;
      const [x, y, width, height] = bounds;
      this.drawProduct(g, product.illustration, product.variant, x, y, width, height);
    }
  }

  private drawAvatar(g: Phaser.GameObjects.Graphics) {
    const slots = this.save.lifestyleSlots;
    const avatar = getPlayerAvatar(this.save.playerAvatarId);
    g.setData("avatarArtKey", avatar.fullBodyAsset);
    const outfit = LIFESTYLE_ITEM_BY_ID.get(slots.clothing ?? "");
    const color = outfit ? PALETTE[outfit.variant % PALETTE.length]! : Phaser.Display.Color.HexStringToColor(avatar.shirt).color;
    const skin = Phaser.Display.Color.HexStringToColor(avatar.skin).color;
    const hair = Phaser.Display.Color.HexStringToColor(avatar.hair).color;
    const eyes = Phaser.Display.Color.HexStringToColor(avatar.eyes).color;
    g.fillStyle(0x24303c).fillEllipse(530, 512, 100, 14);
    g.lineStyle(17, 0x122031).lineBetween(511, 450, 508, 507);
    g.lineBetween(539, 450, 536, 507);
    g.fillStyle(TEXT).fillRoundedRect(496, 502, 25, 10, 4);
    g.fillRoundedRect(524, 502, 25, 10, 4);
    g.fillStyle(color).fillPoints([
      new Phaser.Geom.Point(501, 389), new Phaser.Geom.Point(543, 389),
      new Phaser.Geom.Point(558, 449), new Phaser.Geom.Point(494, 449),
    ], true);
    g.lineStyle(14, color).lineBetween(501, 399, 488, 440);
    g.lineBetween(546, 399, 562, 440);
    g.fillStyle(skin).fillCircle(523, 361, 34);
    g.fillStyle(hair);
    if (avatar.hairStyle === "curls" || avatar.hairStyle === "afro") {
      for (const [x, y, radius] of [[495, 344, 11], [508, 328, 12], [524, 324, 12], [540, 329, 12], [553, 345, 10]]) {
        g.fillCircle(x!, y!, avatar.hairStyle === "afro" ? radius! + 3 : radius!);
      }
    } else if (avatar.hairStyle === "long" || avatar.hairStyle === "waves") {
      g.fillRoundedRect(488, 338, 12, 47, 6).fillRoundedRect(547, 338, 12, 47, 6);
      g.fillEllipse(523, 337, 68, 38);
      if (avatar.hairStyle === "waves") {
        g.lineStyle(2, 0xffffff, 0.45).lineBetween(494, 343, 497, 371).lineBetween(552, 343, 549, 371);
      }
    } else if (avatar.hairStyle === "braids" || avatar.hairStyle === "locs") {
      g.fillEllipse(523, 337, 68, 38);
      for (let i = 0; i < 7; i += 1) {
        const x = 495 + i * 9;
        g.fillRoundedRect(x, 343 + (i % 2) * 3, avatar.hairStyle === "locs" ? 6 : 3, 38, 3);
      }
    } else if (avatar.hairStyle === "bob") {
      g.fillEllipse(523, 337, 68, 38);
      g.fillRoundedRect(490, 340, 13, 33, 6).fillRoundedRect(543, 340, 13, 33, 6);
    } else if (avatar.hairStyle === "bun") {
      g.fillCircle(543, 319, 13).fillEllipse(523, 337, 68, 38);
    } else if (avatar.hairStyle === "short") {
      g.fillPoints([
        new Phaser.Geom.Point(490, 354), new Phaser.Geom.Point(490, 335),
        new Phaser.Geom.Point(505, 321), new Phaser.Geom.Point(523, 326),
        new Phaser.Geom.Point(542, 321), new Phaser.Geom.Point(556, 339),
        new Phaser.Geom.Point(540, 341), new Phaser.Geom.Point(517, 337),
      ], true);
    } else if (avatar.hairStyle === "pixie") {
      g.fillPoints([
        new Phaser.Geom.Point(492, 350), new Phaser.Geom.Point(493, 334),
        new Phaser.Geom.Point(506, 322), new Phaser.Geom.Point(524, 328),
        new Phaser.Geom.Point(542, 323), new Phaser.Geom.Point(553, 339),
        new Phaser.Geom.Point(536, 337), new Phaser.Geom.Point(516, 340),
      ], true);
    } else if (avatar.hairStyle === "undercut") {
      g.fillPoints([
        new Phaser.Geom.Point(490, 354), new Phaser.Geom.Point(490, 337),
        new Phaser.Geom.Point(506, 321), new Phaser.Geom.Point(523, 326),
        new Phaser.Geom.Point(542, 321), new Phaser.Geom.Point(556, 339),
        new Phaser.Geom.Point(537, 338), new Phaser.Geom.Point(515, 335),
      ], true);
      g.lineStyle(2, 0xffffff, 0.35).lineBetween(496, 350, 499, 356);
    } else {
      g.fillPoints([
        new Phaser.Geom.Point(490, 357), new Phaser.Geom.Point(489, 333),
        new Phaser.Geom.Point(505, 320), new Phaser.Geom.Point(522, 326),
        new Phaser.Geom.Point(544, 320), new Phaser.Geom.Point(556, 341),
        new Phaser.Geom.Point(532, 337), new Phaser.Geom.Point(511, 342),
      ], true);
    }
    g.fillStyle(eyes).fillCircle(518, 362, 3).fillCircle(539, 362, 3);
    if (avatar.freckles) {
      g.fillStyle(0x8d573c);
      for (const [x, y] of [[508, 369], [512, 372], [534, 369], [538, 372]]) {
        g.fillCircle(x!, y!, 1.3);
      }
    }
    if (avatar.facialHair === "mustache") {
      g.fillStyle(hair).fillEllipse(528, 375, 14, 5);
    } else if (avatar.facialHair === "beard") {
      g.fillStyle(hair).fillPoints([
        new Phaser.Geom.Point(500, 373), new Phaser.Geom.Point(507, 381),
        new Phaser.Geom.Point(523, 388), new Phaser.Geom.Point(539, 381),
        new Phaser.Geom.Point(546, 373), new Phaser.Geom.Point(540, 378),
        new Phaser.Geom.Point(507, 378),
      ], true);
    }
    g.lineStyle(2, NAVY).lineBetween(521, 378, 535, 378);
    this.drawAvatarAccessories(g);
  }

  private drawAvatarAccessories(g: Phaser.GameObjects.Graphics) {
    const glasses = LIFESTYLE_ITEM_BY_ID.get(this.save.lifestyleSlots.eyes ?? "");
    const avatar = getPlayerAvatar(this.save.playerAvatarId);
    if (avatar.glasses) {
      g.lineStyle(2, NAVY);
      if (avatar.glasses === "round") {
        g.strokeCircle(512, 362, 9).strokeCircle(541, 362, 9);
      } else {
        g.strokeRect(504, 353, 17, 16).strokeRect(526, 353, 17, 16);
      }
      g.lineBetween(521, 358, 526, 358);
    } else if (glasses) {
      g.lineStyle(2, 0x101827).strokeRect(504, 353, 17, 12);
      g.strokeRect(526, 353, 17, 12);
      g.lineBetween(521, 358, 526, 358);
    }
    const chain = LIFESTYLE_ITEM_BY_ID.get(this.save.lifestyleSlots.neck ?? "");
    if (chain) {
      g.lineStyle(3, chain.variant % 2 ? GOLD : LIGHT).strokeEllipse(523, 393, 21, 15);
    }
    const watch = LIFESTYLE_ITEM_BY_ID.get(this.save.lifestyleSlots.wrist ?? "");
    if (watch) {
      g.fillStyle(GOLD).fillCircle(562, 438, 4);
    }
    const hat = LIFESTYLE_ITEM_BY_ID.get(this.save.lifestyleSlots.head ?? "");
    if (hat) {
      g.fillStyle(PALETTE[hat.variant % PALETTE.length]!).fillEllipse(523, 330, 78, 19);
    }
  }

  private drawVehicle(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(0x24303c).fillEllipse(897, 511, 470, 18);
    const id = this.save.equippedVehicleId;
    if (this.textures.exists(id)) {
      this.add.image(895, 513, id).setOrigin(0.5, 1).setScale(0.64);
    } else {
      g.fillStyle(TEAL).fillRoundedRect(700, 450, 390, 54, 24);
      g.fillStyle(LIGHT).fillRoundedRect(775, 420, 180, 38, 20);
      g.fillStyle(DARK).fillCircle(770, 505, 24).fillCircle(1010, 505, 24);
    }
  }

  private drawProduct(
    g: Phaser.GameObjects.Graphics,
    kind: string,
    variant: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const color = PALETTE[variant % PALETTE.length]!;
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (kind === "bicycle" || kind === "ebike" || kind === "motorcycle" || kind === "scooter" || kind === "atv") {
      const radius = Math.min(height * 0.42, 16);
      g.lineStyle(2, DARK).strokeCircle(x + radius, cy, radius).strokeCircle(x + width - radius, cy, radius);
      g.lineStyle(3, color);
      if (kind === "bicycle" || kind === "ebike") {
        g.lineBetween(x + radius, cy, cx - 3, y + 5);
        g.lineBetween(cx - 3, y + 5, x + width * 0.65, cy);
        g.lineBetween(x + radius, cy, x + width * 0.65, cy);
        g.lineBetween(cx - 3, y + 5, x + width - radius, y + 6);
        g.lineBetween(x + width - radius, y + 6, x + width - radius, cy);
      } else {
        g.lineBetween(x + radius, cy - 3, cx, y + 5);
        g.lineBetween(cx, y + 5, x + width - radius, cy - 4);
        g.lineBetween(cx - 4, y + 5, cx + width * 0.2, y + 5);
      }
      return;
    }
    if (kind === "skateboard") {
      g.fillStyle(color).fillRoundedRect(x + 3, cy - 6, width - 6, 12, 7);
      g.fillStyle(LIGHT).fillCircle(x + 12, cy + 8, 3).fillCircle(x + width - 12, cy + 8, 3);
    } else if (kind === "surfboard") {
      g.fillStyle(color).fillEllipse(cx, cy, Math.min(width * 0.8, 22), height * 0.9);
      g.lineStyle(2, GOLD).lineBetween(cx, y + 5, cx, y + height - 5);
    } else if (kind === "basketball") {
      g.fillStyle(0xd58244).fillCircle(cx, cy, Math.min(width, height) / 2 - 1);
      g.lineStyle(1, DARK).strokeCircle(cx, cy, Math.min(width, height) / 2 - 1);
      g.lineBetween(x + 2, cy, x + width - 2, cy);
      g.lineBetween(cx, y + 2, cx, y + height - 2);
    } else if (kind === "toolbox") {
      g.fillStyle(color).fillRoundedRect(x + 2, y + 9, width - 4, height - 10, 4);
      g.lineStyle(2, LIGHT).strokeRect(cx - 7, y + 2, 14, 10);
    } else if (kind === "golf") {
      g.lineStyle(2, LIGHT).lineBetween(x + 7, y + height - 4, x + 2, y + 5);
      g.lineBetween(cx, y + height - 4, cx - 4, y + 5);
      g.lineBetween(x + width - 6, y + height - 4, x + width - 11, y + 5);
      g.fillStyle(color).fillRoundedRect(x + 7, y + height * 0.42, width - 12, height * 0.46, 3);
    } else if (kind === "jetski") {
      g.fillStyle(color).fillPoints([
        new Phaser.Geom.Point(x, y + height * 0.52),
        new Phaser.Geom.Point(x + width * 0.86, y + height * 0.34),
        new Phaser.Geom.Point(x + width, y + height * 0.52),
        new Phaser.Geom.Point(x + width * 0.72, y + height),
        new Phaser.Geom.Point(x + width * 0.2, y + height),
      ], true);
    } else if (kind === "sports") {
      g.fillStyle(color).fillRoundedRect(x + 2, y + height * 0.5, width * 0.55, height * 0.45, 4);
      g.lineStyle(2, GOLD).strokeCircle(x + width * 0.75, y + height * 0.38, height * 0.25);
    }
  }
}
