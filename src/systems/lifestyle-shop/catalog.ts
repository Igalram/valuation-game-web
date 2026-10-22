export type LifestyleCategory = "cars" | "fashion" | "jewelry" | "toys" | "property";
export type LifestyleSlot =
  | "vehicle"
  | "clothing"
  | "wrist"
  | "neck"
  | "eyes"
  | "head"
  | "bicycle"
  | "two_wheeler"
  | "collectible_skateboard"
  | "collectible_basketball"
  | "collectible_toolbox"
  | "collectible_golf"
  | "collectible_sports"
  | "outdoor_surfboard"
  | "outdoor_atv"
  | "outdoor_jetski"
  | "property";

export type LifestyleItem = {
  id: string;
  name: string;
  category: LifestyleCategory;
  price: number;
  displaySlot: LifestyleSlot;
  illustration: string;
  variant: number;
  description: string;
};

export const LIFESTYLE_SHOPS: { id: LifestyleCategory; name: string }[] = [
  { id: "cars", name: "Car Dealership" },
  { id: "fashion", name: "Fashion Store" },
  { id: "jewelry", name: "Jewelry & Accessories" },
  { id: "toys", name: "Garage & Toys" },
  { id: "property", name: "Realtor" },
];

const item = (
  id: string,
  name: string,
  category: LifestyleCategory,
  price: number,
  displaySlot: LifestyleSlot,
  illustration: string,
  variant = 0,
): LifestyleItem => ({
  id,
  name,
  category,
  price,
  displaySlot,
  illustration,
  variant,
  description: "Add this to your collection, then equip or display it in your Lifestyle scene.",
});

export const LIFESTYLE_ITEMS: LifestyleItem[] = [
  item("car_01", "Old Hatchback", "cars", 3_000, "vehicle", "car"),
  item("car_02", "Economy Sedan", "cars", 18_000, "vehicle", "car"),
  item("car_03", "Classic Roadster", "cars", 45_000, "vehicle", "car"),
  item("car_04", "Electric SUV", "cars", 65_000, "vehicle", "car"),
  item("car_05", "Luxury Sedan", "cars", 180_000, "vehicle", "car"),
  item("car_06", "Red Sports Coupe", "cars", 250_000, "vehicle", "car"),
  item("car_07", "Orange Supercar", "cars", 600_000, "vehicle", "car"),
  item("car_08", "Golden Limousine", "cars", 1_500_000, "vehicle", "car"),
  ...(
    [
      ["Everyday Casual", 100],
      ["Weekend Hoodie", 250],
      ["Sport Tracksuit", 500],
      ["Denim Jacket", 900],
      ["Smart Casual", 1_500],
      ["Linen Ensemble", 2_500],
      ["Tailored Suit", 5_000],
      ["Evening Tuxedo", 9_000],
      ["Streetwear Set", 15_000],
      ["Designer Collection", 30_000],
      ["Couture Statement", 75_000],
      ["Runway Royalty", 150_000],
    ] as const
  ).map(([name, price], index) =>
    item(`outfit_${String(index + 1).padStart(2, "0")}`, name, "fashion", price, "clothing", "outfit", index),
  ),
  ...(
    [
      ["Sport Watch", 200, "wrist", "watch"],
      ["Steel Watch", 1_500, "wrist", "watch"],
      ["Gold Watch", 15_000, "wrist", "watch"],
      ["Platinum Watch", 80_000, "wrist", "watch"],
      ["Silver Chain", 700, "neck", "chain"],
      ["Gold Chain", 7_000, "neck", "chain"],
      ["Classic Sunglasses", 150, "eyes", "glasses"],
      ["Designer Shades", 2_500, "eyes", "glasses"],
      ["Everyday Cap", 80, "head", "hat"],
      ["Designer Fedora", 4_000, "head", "hat"],
    ] as const
  ).map(([name, price, slot, illustration], index) =>
    item(
      `accessory_${String(index + 1).padStart(2, "0")}`,
      name,
      "jewelry",
      price,
      slot,
      illustration,
      index,
    ),
  ),
  ...(
    [
      ["Bicycle", 400, "bicycle", "bicycle"],
      ["Electric Bike", 2_500, "bicycle", "ebike"],
      ["Motorcycle", 12_000, "two_wheeler", "motorcycle"],
      ["Scooter", 1_800, "two_wheeler", "scooter"],
      ["Skateboard", 120, "collectible_skateboard", "skateboard"],
      ["Surfboard", 600, "outdoor_surfboard", "surfboard"],
      ["Basketball", 50, "collectible_basketball", "basketball"],
      ["Toolbox", 350, "collectible_toolbox", "toolbox"],
      ["Golf Clubs", 1_600, "collectible_golf", "golf"],
      ["ATV", 9_000, "outdoor_atv", "atv"],
      ["Jet Ski", 18_000, "outdoor_jetski", "jetski"],
      ["Sports Equipment", 800, "collectible_sports", "sports"],
    ] as const
  ).map(([name, price, slot, illustration], index) =>
    item(`toy_${String(index + 1).padStart(2, "0")}`, name, "toys", price, slot, illustration, index),
  ),
  ...(
    [
      ["Starter Home", 80_000],
      ["Garden Cottage", 180_000],
      ["Modern Townhouse", 400_000],
      ["Coastal Villa", 900_000],
      ["Hilltop Estate", 2_500_000],
      ["Luxury Mansion", 7_000_000],
    ] as const
  ).map(([name, price], index) =>
    item(`home_${String(index + 1).padStart(2, "0")}`, name, "property", price, "property", "house", index),
  ),
];

export const LIFESTYLE_ITEM_BY_ID = new Map(LIFESTYLE_ITEMS.map((product) => [product.id, product]));

export function itemsForLifestyleShop(category: LifestyleCategory): LifestyleItem[] {
  return LIFESTYLE_ITEMS.filter((product) => product.category === category);
}
