import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { GameSave } from "../../progress/persistence/gameSave";
import {
  LIFESTYLE_SHOPS,
  itemsForLifestyleShop,
  type LifestyleCategory,
} from "./catalog";
import { isLifestyleItemDisplayed, ownsLifestyleItem } from "./economy";
import LifestyleArtwork from "./LifestyleArtwork";
import PlayerIdentityCard from "../../components/PlayerIdentityCard";
const LifestyleDriveway = lazy(() => import("./LifestyleDriveway"));

type LifestyleScreenProps = {
  save: GameSave;
  onBackToMap: () => void;
  onDisplay: (productId: string) => void;
  onPurchase: (productId: string) => void;
  onEditProfile: () => void;
  profileEditing: boolean;
};

const money = (amount: number) => `$${amount.toLocaleString("en-US")}`;

function LifestyleScreen({
  save,
  onBackToMap,
  onDisplay,
  onPurchase,
  onEditProfile,
  profileEditing,
}: LifestyleScreenProps) {
  const [shop, setShop] = useState<LifestyleCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const products = useMemo(() => (shop ? itemsForLifestyleShop(shop) : []), [shop]);
  const selected = products.find((product) => product.id === selectedId) ?? products[0] ?? null;

  useEffect(() => {
    if (shop && !products.some((product) => product.id === selectedId)) {
      setSelectedId(products[0]?.id ?? null);
    }
  }, [products, selectedId, shop]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (profileEditing) return;
      if (event.key === "Escape") {
        if (shop) setShop(null);
        else onBackToMap();
        return;
      }
      if (!shop && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        const owned = save.ownedVehicleIds;
        if (owned.length < 2) return;
        const current = Math.max(0, owned.indexOf(save.equippedVehicleId));
        const direction = event.key === "ArrowRight" ? 1 : -1;
        onDisplay(owned[(current + direction + owned.length) % owned.length]!);
      } else if (shop && event.key === "ArrowRight") {
        const index = products.findIndex((product) => product.id === selected?.id);
        setSelectedId(products[(index + 1) % products.length]?.id ?? null);
      } else if (shop && event.key === "ArrowLeft") {
        const index = products.findIndex((product) => product.id === selected?.id);
        setSelectedId(products[(index - 1 + products.length) % products.length]?.id ?? null);
      } else if (shop && event.key.toLowerCase() === "b" && selected) {
        event.preventDefault();
        if (ownsLifestyleItem(save, selected)) onDisplay(selected.id);
        else if (save.availableCash >= selected.price) onPurchase(selected.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBackToMap, onDisplay, onPurchase, products, profileEditing, save, selected, shop]);

  const chooseShop = (category: LifestyleCategory) => {
    setShop(category);
    setSelectedId(itemsForLifestyleShop(category)[0]?.id ?? null);
  };

  const actionFor = (product: NonNullable<typeof selected>) => {
    if (isLifestyleItemDisplayed(save, product)) return "EQUIPPED / DISPLAYED";
    if (ownsLifestyleItem(save, product)) return product.category === "cars" || product.category === "fashion" || product.category === "jewelry"
      ? "EQUIP"
      : "DISPLAY";
    return save.availableCash >= product.price ? "BUY" : "INSUFFICIENT CASH";
  };

  return (
    <main className="lifestyle-screen">
      <header className="lifestyle-header">
        <div>
          <p className="eyebrow">VALUATION LAB</p>
          <h1>LIFESTYLE</h1>
        </div>
        <PlayerIdentityCard
          availableCash={save.availableCash}
          avatarId={save.playerAvatarId}
          completedStages={save.completedStages}
          name={save.playerName}
          onEdit={onEditProfile}
        />
        <div className="lifestyle-balances" aria-label="Player finances">
          <div><span>AVAILABLE CASH</span><strong>{money(save.availableCash)}</strong></div>
          <div><span>CAREER EARNINGS</span><strong>{money(save.careerEarnings)}</strong></div>
        </div>
        <button className="secondary-button" onClick={onBackToMap} type="button">CONTINUE TO MAP</button>
      </header>

      {shop === null ? (
        <section className="lifestyle-driveway-view" aria-label="Driveway and shops">
          <Suspense fallback={<div className="lifestyle-scene-loading" role="status">Loading driveway…</div>}>
            <LifestyleDriveway save={save} />
          </Suspense>
          <div className="driveway-controls">
            <div className="vehicle-controls">
              <button
                className="secondary-button"
                disabled={save.ownedVehicleIds.length < 2}
                onClick={() => {
                  const index = save.ownedVehicleIds.indexOf(save.equippedVehicleId);
                  onDisplay(save.ownedVehicleIds[(index - 1 + save.ownedVehicleIds.length) % save.ownedVehicleIds.length]!);
                }}
                type="button"
              >← PREVIOUS CAR</button>
              <span>{LIFESTYLE_SHOPS[0]?.name} · arrows to switch owned cars</span>
              <button
                className="secondary-button"
                disabled={save.ownedVehicleIds.length < 2}
                onClick={() => {
                  const index = save.ownedVehicleIds.indexOf(save.equippedVehicleId);
                  onDisplay(save.ownedVehicleIds[(index + 1) % save.ownedVehicleIds.length]!);
                }}
                type="button"
              >NEXT CAR →</button>
            </div>
            <h2>VISIT A SHOP</h2>
            <nav className="lifestyle-shop-nav" aria-label="Lifestyle shops">
              {LIFESTYLE_SHOPS.map((entry) => (
                <button
                  className="shop-nav-button"
                  key={entry.id}
                  onClick={() => chooseShop(entry.id)}
                  type="button"
                >{entry.name}<span>OPEN CATALOG →</span></button>
              ))}
            </nav>
          </div>
        </section>
      ) : (
        <section className="lifestyle-shop-view" aria-labelledby="shop-title">
          <div className="shop-heading-row">
            <button className="secondary-button" onClick={() => setShop(null)} type="button">← DRIVEWAY</button>
            <h2 id="shop-title">{LIFESTYLE_SHOPS.find((entry) => entry.id === shop)?.name}</h2>
            <span className="shop-key-hint">Arrows to browse · B to buy / equip · Esc to return</span>
          </div>
          <div className="lifestyle-catalog-layout">
            <div className="lifestyle-catalog-grid" aria-label={`${shop} product catalog`}>
              {products.map((product) => {
                const owned = ownsLifestyleItem(save, product);
                const affordable = save.availableCash >= product.price;
                return (
                  <button
                    aria-pressed={selected?.id === product.id}
                    className={`lifestyle-product-card${selected?.id === product.id ? " selected" : ""}${!owned && !affordable ? " unaffordable" : ""}`}
                    key={product.id}
                    onClick={() => setSelectedId(product.id)}
                    type="button"
                  >
                    <LifestyleArtwork item={product} className="product-artwork" />
                    <strong>{product.name}</strong>
                    <span className="product-price">{money(product.price)}</span>
                    <span className={owned ? "product-owned" : "product-status"}>{owned ? (isLifestyleItemDisplayed(save, product) ? "Equipped / displayed" : "Owned") : "Not owned"}</span>
                  </button>
                );
              })}
            </div>
            {selected && (
              <aside className="lifestyle-product-details" aria-label={`${selected.name} details`}>
                <LifestyleArtwork item={selected} className="product-preview-artwork" />
                <p className="lesson-kicker">{LIFESTYLE_SHOPS.find((entry) => entry.id === selected.category)?.name}</p>
                <h3>{selected.name}</h3>
                <strong className="product-detail-price">{money(selected.price)}</strong>
                <p>{selected.description}</p>
                <p className="product-ownership">
                  {ownsLifestyleItem(save, selected)
                    ? isLifestyleItemDisplayed(save, selected) ? "Currently equipped or displayed." : "Owned — no additional charge to equip or display."
                    : "Purchase once to add this item permanently to your collection."}
                </p>
                <button
                  className="primary-button lifestyle-action-button"
                  disabled={
                    isLifestyleItemDisplayed(save, selected) ||
                    (!ownsLifestyleItem(save, selected) && save.availableCash < selected.price)
                  }
                  onClick={() => {
                    if (ownsLifestyleItem(save, selected)) onDisplay(selected.id);
                    else onPurchase(selected.id);
                  }}
                  type="button"
                >
                  {actionFor(selected)}
                </button>
              </aside>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default LifestyleScreen;
