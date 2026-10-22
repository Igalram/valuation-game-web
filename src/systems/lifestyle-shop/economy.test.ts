import { describe, expect, it } from "vitest";
import { createNewGame } from "../../progress/persistence/gameSave";
import {
  LIFESTYLE_ITEMS,
  LIFESTYLE_SHOPS,
  itemsForLifestyleShop,
} from "./catalog";
import {
  displayLifestyleItem,
  isLifestyleItemDisplayed,
  ownsLifestyleItem,
  purchaseLifestyleItem,
} from "./economy";

describe("Lifestyle catalog and economy", () => {
  it("preserves all Python shop sizes and the car price ladder", () => {
    expect(LIFESTYLE_SHOPS.map(({ id }) => itemsForLifestyleShop(id).length)).toEqual([8, 12, 10, 12, 6]);
    expect(itemsForLifestyleShop("cars").map(({ id, price }) => [id, price])).toEqual([
      ["car_01", 3_000],
      ["car_02", 18_000],
      ["car_03", 45_000],
      ["car_04", 65_000],
      ["car_05", 180_000],
      ["car_06", 250_000],
      ["car_07", 600_000],
      ["car_08", 1_500_000],
    ]);
    expect(LIFESTYLE_ITEMS).toHaveLength(48);
  });

  it("rejects unaffordable, unknown, and duplicate purchases", () => {
    const initial = { ...createNewGame(), availableCash: 99, careerEarnings: 25_000 };
    expect(purchaseLifestyleItem(initial, "home_01")).toBeNull();
    expect(purchaseLifestyleItem(initial, "not-a-product")).toBeNull();

    expect(purchaseLifestyleItem(initial, "outfit_01")).toBeNull();
    const purchased = purchaseLifestyleItem({ ...initial, availableCash: 100 }, "outfit_01")!;
    expect(purchased.availableCash).toBe(0);
    expect(purchased.careerEarnings).toBe(initial.careerEarnings);
    expect(purchased.ownedLifestyleIds).toContain("outfit_01");
    expect(ownsLifestyleItem(purchased, LIFESTYLE_ITEMS.find(({ id }) => id === "outfit_01")!)).toBe(true);
    expect(purchaseLifestyleItem(purchased, "outfit_01")).toBeNull();
  });

  it("deducts purchases once and equips owned items without charging again", () => {
    const initial = { ...createNewGame(), availableCash: 40_000, careerEarnings: 50_000 };
    const purchased = purchaseLifestyleItem(initial, "car_02")!;
    expect(purchased.availableCash).toBe(22_000);
    expect(purchased.careerEarnings).toBe(50_000);
    expect(purchased.ownedVehicleIds).toEqual(["car_01", "car_02"]);

    const equipped = displayLifestyleItem(purchased, "car_02")!;
    expect(equipped.equippedVehicleId).toBe("car_02");
    expect(equipped.availableCash).toBe(22_000);
    expect(isLifestyleItemDisplayed(equipped, LIFESTYLE_ITEMS.find(({ id }) => id === "car_02")!)).toBe(true);
    expect(displayLifestyleItem(equipped, "car_02")).toBeNull();

    const boughtOutfit = purchaseLifestyleItem(equipped, "outfit_01")!;
    const dressed = displayLifestyleItem(boughtOutfit, "outfit_01")!;
    expect(dressed.lifestyleSlots.clothing).toBe("outfit_01");
    expect(dressed.availableCash).toBe(21_900);
  });
});
