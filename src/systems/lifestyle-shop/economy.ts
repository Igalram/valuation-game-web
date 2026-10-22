import type { GameSave } from "../../progress/persistence/gameSave";
import { LIFESTYLE_ITEM_BY_ID, type LifestyleItem } from "./catalog";

export function ownsLifestyleItem(save: GameSave, product: LifestyleItem): boolean {
  return product.category === "cars"
    ? save.ownedVehicleIds.includes(product.id)
    : save.ownedLifestyleIds.includes(product.id);
}

export function isLifestyleItemDisplayed(save: GameSave, product: LifestyleItem): boolean {
  return product.displaySlot === "vehicle"
    ? save.equippedVehicleId === product.id
    : save.lifestyleSlots[product.displaySlot] === product.id;
}

export function purchaseLifestyleItem(save: GameSave, productId: string): GameSave | null {
  const product = LIFESTYLE_ITEM_BY_ID.get(productId);
  if (!product || ownsLifestyleItem(save, product) || save.availableCash < product.price) return null;

  if (product.category === "cars") {
    return {
      ...save,
      availableCash: save.availableCash - product.price,
      ownedVehicleIds: [...save.ownedVehicleIds, product.id],
    };
  }

  return {
    ...save,
    availableCash: save.availableCash - product.price,
    ownedLifestyleIds: [...save.ownedLifestyleIds, product.id],
  };
}

export function displayLifestyleItem(save: GameSave, productId: string): GameSave | null {
  const product = LIFESTYLE_ITEM_BY_ID.get(productId);
  if (!product || !ownsLifestyleItem(save, product) || isLifestyleItemDisplayed(save, product)) {
    return null;
  }
  if (product.displaySlot === "vehicle") {
    return { ...save, equippedVehicleId: product.id };
  }
  return {
    ...save,
    lifestyleSlots: { ...save.lifestyleSlots, [product.displaySlot]: product.id },
  };
}
