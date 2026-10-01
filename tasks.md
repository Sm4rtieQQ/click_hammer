# ClickHammer — bouwtaken

## Afwerking en werkwijze

- Voer taken bij voorkeur op volgorde uit; vermeld per taak de afhankelijkheid.
- Een taak is klein genoeg om in **1–4 uur** af te ronden.
- Gebruik voor alle variabelen, props, emits, functies en bestandsnamen Engelse identifiers.
- Een taak is pas klaar als de genoemde test of handmatige controle slaagt.
- De uiteindelijke game heeft de features uit `AGENTS.md`: klikken, projecten, munten, upgrades, exponentiële upgradekosten en LocalStorage-persistentie.

## Fase 1 — Projectfundament

- [x] **T01 — Leg de progressieregels vast (2 uur)**
  - **Afhankelijk van:** niets.
  - **Levering:** een korte `docs/game-rules.md` of een equivalente sectie in `README.md` met de beginstate, volgorde van projecten, punttoewijzing, coin-rewards en upgrade-herhalingen.
  - **Beslis:** hoeveel `clickPower` begint met, hoeveel punten een actief project krijgt, wanneer een project voltooid is en of een project meerdere keren kan worden gekocht.
  - **Test/acceptatie:** de regels bevatten minimaal één concreet voorbeeld voor projectvoltooiing en één voor een upgradekostenberekening.

- [x] **T02 — Initialiseer de Vite-app (3 uur)**
  - **Afhankelijk van:** T01.
  - **Levering:** een draaiende Vue 3 + TypeScript + Vite-app met `package.json`, `index.html`, `src/main.ts`, `src/App.vue` en de scripts `dev`, `build` en `preview`.
  - **Test/acceptatie:** `npm install` en `npm run build` slagen; de dev-server toont een lege Vue-app zonder runtimefouten.

- [x] **T03 — Zet type- en testtooling op (3 uur)**
  - **Afhankelijk van:** T02.
  - **Levering:** strict TypeScript-configuratie, Vitest, Vue Test Utils, een jsdom-achtige testomgeving en bruikbare scripts voor `typecheck`, `test` en `lint` (of een gedocumenteerde equivalente code-qualitycheck).
  - **Test/acceptatie:** een voorbeeldcomponent en een voorbeeldtest compileren; `npm run typecheck` en `npm run test` geven een groene uitkomst.

- [x] **T04 — Maak de bronstructuur en App-shell (2 uur)**
  - **Afhankelijk van:** T02, T03.
  - **Levering:** directories voor `src/components`, `src/composables`, `src/data`, `src/types` en `src/styles`, plus een `App.vue` die alleen de toekomstige layout bevat.
  - **Test/acceptatie:** de build slaagt; `App.vue` bevat nog geen spellogica en gebruikt de Composition API.

- [x] **T05 — Maak responsive basisstijlen (2 uur)**
  - **Afhankelijk van:** T04.
  - **Levering:** CSS-variabelen voor kleuren, typografie, spacing, focus states en panelen, met een layout die op smalle en brede schermen bruikbaar blijft.
  - **Test/acceptatie:** controleer op minimaal 320px en 1440px breedte; er is geen horizontale overflow en alle focusringen blijven zichtbaar.

## Fase 2 — Domeintypes en content

- [x] **T06 — Definieer de game-interfaces (2 uur)**
  - **Afhankelijk van:** T03, T04.
  - **Levering:** typed exports in `src/types` voor `Upgrade`, `Project` en `GameState`, met de velden uit `AGENTS.md`; voeg alleen extra types toe wanneer ze nodig zijn voor de beslissing uit T01.
  - **Test/acceptatie:** een typecheck-test gebruikt elk interface en er komt geen `any` in de game-interfaces voor.

- [x] **T07 — Maak de initial-state factory (1 uur)**
  - **Afhankelijk van:** T06, T01.
  - **Levering:** `createInitialGameState()` in `src/types` of `src/composables`, met `points: 0`, `coins: 0`, lege project- en upgradeverzamelingen en een lege `projectProgress`.
  - **Test/acceptatie:** twee aanroepen geven onafhankelijke objecten; wijzigingen in de ene state beïnvloeden de andere niet.

- [x] **T08 — Maak de projectcatalogus (2 uur)**
  - **Afhankelijk van:** T06, T01.
  - **Levering:** een typed `projects`-array met minimaal drie realiseerbare projecten, unieke numerieke `id`-waarden, positieve `requiredPoints` en positieve `coinReward`-waarden.
  - **Test/acceptatie:** een catalogustest controleert unieke IDs, naam/beschrijving, eindige getallen en de beslissing over projectvolgorde.

- [x] **T09 — Maak de upgradecatalogus (2 uur)**
  - **Afhankelijk van:** T06, T01.
  - **Levering:** een typed `upgrades`-array met minimaal drie upgrades, unieke numerieke `id`-waarden, positieve `baseCost`, een `costMultiplier` groter dan 1 en een niet-negatieve `clickBonus` als percentage (bijvoorbeeld `10` voor +10%).
  - **Test/acceptatie:** een catalogustest controleert alle invarianten, de percentage-interpretatie van `clickBonus` en berekent voor elke upgrade een verwachte eerste prijs.

- [x] **T10 — Maak het normalisatiecontract voor state (2 uur)**
  - **Afhankelijk van:** T07, T08, T09.
  - **Levering:** typed validators voor arrays, records, getallen en bekende catalog-IDs; leg vast welke afwijkende waarden naar een veilige beginwaarde worden teruggezet.
  - **Test/acceptatie:** tests voor ontbrekende velden, `NaN`, negatieve waarden, onbekende project-/upgrade-IDs en een volledig geldige state; corrupte invoer veroorzaakt geen exception.

## Fase 3 — Centrale gameplay-logica

- [x] **T11 — Initialiseer `useGameState` (2 uur)**
  - **Afhankelijk van:** T07, T10.
  - **Levering:** een Composition API-composable met één centrale `gameState`, readonly toegang voor consumers en typed actions voor clicks, projectvoortgang en upgrades.
  - **Test/acceptatie:** een unit test leest de beginstate en roept nog geen gameplayactie aan zonder de state te beschadigen.

- [x] **T12 — Implementeer klikken en `clickPower` (3 uur)**
  - **Afhankelijk van:** T11, T09.
  - **Levering:** `addPoints()` verhoogt `points` met de huidige `clickPower`; `clickPower` wordt berekend met de multiplicatieve productformule en niet door `clickBonus` op te tellen.
  - **Test/acceptatie:** tests controleren nul klikken, één klik, meerdere klikken, twee +10%-upgrades (`1.21` power), een upgrade met 0% en een geblokkeerde/ongeldige invoer.

- [x] **T13 — Implementeer projectvoortgang en beloning (4 uur)**
  - **Afhankelijk van:** T11, T08, T01.
  - **Levering:** `addPoints()` past de punten toe volgens de gekozen projectregel; `projectProgress` stijgt tot `requiredPoints`, `completedProjects` bevat een ID slechts één keer en `coins` krijgt precies één `coinReward`.
  - **Test/acceptatie:** tests dekken een project onder de drempel, exact op de drempel, over de drempel en herhaalde aanroepen na voltooiing; er wordt nooit dubbel uitgerekend.

- [x] **T14 — Bereken upgradekosten (2 uur)**
  - **Afhankelijk van:** T11, T09, T10.
  - **Levering:** een pure `getUpgradeCost(upgrade, purchaseCount)` die `floor(baseCost * costMultiplier ** purchaseCount)` gebruikt en nooit een waarde onder 1 teruggeeft.
  - **Test/acceptatie:** tests controleren nul, meerdere aankopen, decimale invoer, grote aantallen en een ongeldige multiplier; de berekening is reproduceerbaar en wijzigt geen state.

- [x] **T15 — Implementeer upgradeaankopen (3 uur)**
  - **Afhankelijk van:** T13, T14.
  - **Levering:** `buyUpgrade(id)` valideert de ID, controleert `coins`, trekt exact de huidige kost af, verhoogt `purchaseCount` en laat `clickPower` onmiddellijk met de productformule herberekenen.
  - **Test/acceptatie:** tests dekken een succesvolle eerste aankoop, een herhaalde aankoop met hogere kost, onvoldoende munten, een onbekende ID en mislukte transacties zonder mutatie.

- [x] **T16 — Maak afgeleide selectors (2 uur)**
  - **Afhankelijk van:** T12, T13, T14, T15.
  - **Levering:** `computed`-waarden voor de multiplicatieve `clickPower`, huidige upgradekosten, betaalbaarheid, voltooide projecten en resterende projectdoelen.
  - **Test/acceptatie:** selectors reageren op een statewijziging zonder extra handmatige synchronisatie; de bronstate blijft alleen via de composable gewijzigd.

## Fase 4 — Persistentie en lifecycle

- [x] **T17 — Maak de storage-adapter (2 uur)**
  - **Afhankelijk van:** T10.
  - **Levering:** functies voor load, serialize en save met één expliciete storage-key en alleen de noodzakelijke velden uit `GameState`.
  - **Test/acceptatie:** een fake LocalStorage bevat na serialize/save precies de afgesproken velden; een lege storage geeft de initial state terug.

- [x] **T18 — Implementeer veilig laden en fallback (4 uur)**
  - **Afhankelijk van:** T17, T10.
  - **Levering:** `loadGameState()` leest in `try/catch`, valideert/normaliseert de data en valt bij corrupte of onbruikbare opslag terug op `createInitialGameState()`.
  - **Test/acceptatie:** tests dekken geldige JSON, ontbrekende keys, verkeerde JSON, onbekende IDs, verkeerde types en een storage-read-exception; gameplay blijft in alle gevallen startbaar.

- [x] **T19 — Voeg gerichte persistence toe (3 uur)**
  - **Afhankelijk van:** T18.
  - **Levering:** een `watch`-strategie in `App.vue` of de composable schrijft niet rechtstreeks bij elke klik; gebruik een korte debounce en/of expliciete save-momenten bij projectvoltooiing en upgradeaankoop.
  - **Test/acceptatie:** een fake storage-teller bewijst dat een korte reeks clicks geen write per click veroorzaakt, terwijl een aankoop en projectvoltooiing wel worden opgeslagen.

- [x] **T20 — Integreer persistence-lifecycle (2 uur)**
  - **Afhankelijk van:** T19.
  - **Levering:** `App.vue` laadt één keer bij opstart, start de persistence-watch en ruim eventuele timers/persistence-resources op in `onUnmounted`; een opslagfataliteit blokkeert clicks niet.
  - **Test/acceptatie:** na remount wordt dezelfde voortgang teruggehaald; een write-error wordt afgehandeld en de game blijft speelbaar.

- [x] **T21 — Auditeer timer- en unmount-gedrag (1 uur)**
  - **Afhankelijk van:** T20.
  - **Levering:** controleer elke toekomstige `setInterval`/`setTimeout`; bewaar de return value in een `intervalId` of `timeoutId` en ruim die op in `onUnmounted` volgens de key rule.
  - **Test/acceptatie:** er zijn geen actieve timers na unmount; als er geen interval nodig is, blijft het spel zonder interval implementeren.

## Fase 5 — Vue-componenten

- [x] **T22 — Bouw `GameHeader.vue` (2 uur)**
  - **Afhankelijk van:** T04, T11, T05.
  - **Levering:** typed props voor `points` en `coins`, met score en munten zichtbaar en zonder projecttellers.
  - **Test/acceptatie:** componenttests controleren beide waarden, de lege/beginwaarden en de afwezigheid van projectinformatie.

- [x] **T23 — Bouw `GameButton.vue` (2 uur)**
  - **Afhankelijk van:** T05, T22.
  - **Levering:** een echte `<button>` die bij activatie één typed `click`-event emit, korte visuele feedback geeft en zelf geen state wijzigt.
  - **Test/acceptatie:** keyboardactivatie en klik geven elk precies één event; disabled/visuele feedback blijft toegankelijk.

- [x] **T24 — Bouw `ProjectTracker.vue` (3 uur)**
  - **Afhankelijk van:** T05, T13.
  - **Levering:** typed props voor projectgegevens en voortgang; toont een voortgangsbalk en status zonder resterende-puntenteller; emit `project-complete` precies op de voltooiingsgrens.
  - **Test/acceptatie:** tests dekken 0%, gedeeltelijke vooruitgang, 100% en herhaalde voltooiingsinput; `GameHeader` blijft vrij van deze teller.

- [x] **T25 — Bouw `UpgradeItem.vue` (3 uur)**
  - **Afhankelijk van:** T05, T14, T15.
  - **Levering:** typed props voor één `Upgrade`, `currentCost`, `purchaseCount` en betaalbaarheid; toont naam, beschrijving, bonus, huidige prijs en gekocht aantal; emit `buy-upgrade` met de upgrade-ID.
  - **Test/acceptatie:** een gekochte, betaalbare en niet-betaalbare variant worden correct weergegeven; de koopknop is semantisch disabled en dubbelklikken veroorzaakt geen extra lokale transactie.

- [x] **T26 — Bouw `UpgradeShop.vue` (3 uur)**
  - **Afhankelijk van:** T25, T15.
  - **Levering:** rendert de beschikbare catalogus via `UpgradeItem`, geeft `coins` en purchase counts door en geeft `buy-upgrade` door naar `App.vue`.
  - **Test/acceptatie:** tests controleren catalogusvolgorde, prijsupdates na aankoop, onvoldoende munten, empty state en correct event-payloads.

- [x] **T27 — Bouw de App-layout en event-wiring (3 uur)**
  - **Afhankelijk van:** T22–T26, T19.
  - **Levering:** `App.vue` gebruikt `useGameState`, geeft state en actions via props door, luistert naar typed emits en beheert project- en upgrade-events volgens de architectuur.
  - **Test/acceptatie:** een App-componenttest laat een click, projectvoltooiing en upgradeaankoop doorlopen en controleert dat alle drie de centrale state wijzigen.

## Fase 5b — Repetitieve opdrachten en projectprogressie

- [x] **T27A — Breid domeintypes uit voor materialen, items en opdrachten (2 uur)**
  - **Afhankelijk van:** T06, T08, T09.
  - **Levering:** typed `Material`, `Item`, `OrderDefinition` en `WorkOrder`-velden in `GameState`.
  - **Test/acceptatie:** type-tests gebruiken alle nieuwe interfaces zonder `any`.

- [x] **T27B — Maak materiaal-, item- en ordercatalogi (4 uur)**
  - **Afhankelijk van:** T27A, T01.
  - **Levering:** 5 materialen, 10 items en 50 combinaties met exponentiële unlock-rangen; `quantity`, `requiredPoints`, `coinReward` en commandformat worden pure berekend.
  - **Test/acceptatie:** catalogustest bewijst unieke rangen, geldige multiplers, cross-material unlockvolgorde en de progressieve aantallen.

- [x] **T27C — Breid normalisatie en opslag uit (3 uur)**
  - **Afhankelijk van:** T10, T17, T27B.
  - **Levering:** `GameState` bevat ordervelden; oude saves zonder ordervelden worden onder dezelfde storage-key volledig vervangen.
  - **Test/acceptatie:** tests dekken ontbrekende ordervelden, ongeldige workorders, dubbele items, onbekende IDs en fallback zonder exceptions.

- [x] **T27D — Implementeer ordergeneratie, selectie en beloning (4 uur)**
  - **Afhankelijk van:** T27B, T27C.
  - **Levering:** twee aanbiedingen, één keuze, itemuniciteit, actieve order, clickvoortgang, eenmalige beloning en direct nieuwe aanbiedingen.
  - **Test/acceptatie:** tests bewijzen dat project 1 orders blokkeert, dat een order exact eenmaal betaalt en dat materialen opnieuw mogen voorkomen.

- [x] **T27E — Herwerk projectontgrendeling en projectreward (3 uur)**
  - **Afhankelijk van:** T27C, T13.
  - **Levering:** unieke `unlockPoints`, eerste project zonder munten, veel grotere latere projectkosten en -rewards.
  - **Test/acceptatie:** projecten worden alleen op unieke grenzen ontgrendeld en een voltooid project wordt nooit dubbel beloond.

- [x] **T27F — Bouw order- en projectcomponenten (4 uur)**
  - **Afhankelijk van:** T27D, T27E, T05.
  - **Levering:** `OrderSelection.vue`, `OrderTracker.vue` en `ProjectList.vue`; ordercomponenten tonen geen vereiste punten.
  - **Test/acceptatie:** componenttests controleren commandotekst, één herstartende itemstatusbalk, totale balk, beloning en beperkte projectweergave.

- [x] **T27G — Voeg Projecten-view en navigatie toe (3 uur)**
  - **Afhankelijk van:** T27F, T27, T19.
  - **Levering:** `projects`, `smithy` en `upgrades` als views; clicks worden per view aan een project of order toegewezen.
  - **Test/acceptatie:** App-test doorloopt project → orderkeuze → ordervoltooiing → upgradeaankoop.

- [x] **T27H — Werk gameplaydocumentatie en acceptatie bij (2 uur)**
  - **Afhankelijk van:** T27A–T27G.
  - **Levering:** `AGENTS.md`, `docs/game-rules.md` en `tasks.md` beschrijven orders, unlockmatrix, projecten, opslagvervanging en de nieuwe views.
  - **Test/acceptatie:** documentatie bevat de commandovorm, een unlockvoorbeeld en de project-/orderregels.

## Fase 6 — UX, toegankelijkheid en integratie

- [x] **T28 — Voeg lege, laden- en foutstates toe (2 uur)**
  - **Afhankelijk van:** T18, T24, T26.
  - **Levering:** duidelijke states voor initialisatie, geen projecten, geen beschikbare upgrades en niet-betaalbare aankopen zonder layoutverschuivingen.
  - **Test/acceptatie:** iedere state is zichtbaar en voorkomt dat de gebruiker een onmogelijke actie kan uitvoeren.
  - **Uitgevoerd:**
    - `gameStorage.ts`: naast `loadGameState` is er `loadGameStateResult`, dat een `GameLoadStatus` teruggeeft: `restored`, `fresh`, `recovered` of `unavailable`. `loadGameState` blijft de bestaande API en levert dezelfde state.
    - `useGamePersistence.ts`: levert `hasWriteError` (computed). De vlag gaat aan zodra een save faalt en gaat weer uit zodra een save slaagt, zodat een herstelde opslag geen spookmelding laat staan.
    - `GameStatusPanel.vue` (nieuw): één presentational paneel voor alle statusmeldingen, met `tone` `info`, `warning` of `error`. `info` gebruikt `role="status"` met `aria-live="polite"`, de andere tonen `role="alert"` met `aria-live="assertive"`. Slots: `eyebrow` en default.
    - Initialisatie: het laden blijft synchroon, dus in plaats van een kunstmatige laadspinner toont een vers spel direct zijn eerste doel. De verse stand herken je aan het ontbreken van enige melding; `App.test.ts` bewijst dat expliciet.
    - Foutstate: een onbruikbare of herstelde save, of een mislukte write, tonen een niet-blokkerende `warning` met een "Melding sluiten"-knop. `App.vue` combineert loadstatus en writefouten in `hasStorageNotice`.
    - Alle projecten klaar: zonder actief project verdwijnt de aambeeldknop en verschijnt een `info`-paneel "Alle projecten voltooid" dat naar de smederij verwijst.
    - Lege states: `ProjectList.vue` en `OrderSelection.vue` tonen een `role="status"`-melding in plaats van een lege lijst; `UpgradeShop.vue` behoudt zijn lege catalogus-melding.
    - Niet-betaalbare aankopen: `UpgradeItem.vue` krijgt de prop `coins` en toont `Nog N munten nodig`, zodat duidelijk is waarom de knop disabled is.
  - **Let op:** de eerste opslagmelding verandert de score na een herstelde save niet; tests die een specifiek paneel willen gebruiken, selecteren `.game-notice--storage` of `.game-notice--projects` in plaats van `.game-notice`.

- [x] **T29 — Verbeter toetsenbord- en schermlezertoegang (2 uur)**
  - **Afhankelijk van:** T23, T24, T25, T28.
  - **Levering:** labels, focusvolgorde, `aria-live` voor punten/munten, duidelijke disabled-statussen en voldoende contrast.
  - **Test/acceptatie:** alle interacties zijn uitsluitend met keyboard te bedienen; een screenreader-/accessibility-check meldt geen kritieke fouten.
  - **Uitgevoerd:**
    - `GameHeader.vue`: de `dl` met score en munten is een `aria-live="polite"` en `aria-atomic="true"` regio, zodat waarden na een klik worden voorgelezen.
    - `GameNavigation.vue`: de tablist is een volledig toetsenbordpatroon. Pijltjestoetsen (`ArrowLeft/Right/Up/Down`), `Home` en `End` wisselen de view met wrap-around, sluiten disabled views uit en verplaatsen de focus naar de nieuwe tab; `Escape` sluit het mobiele menu en herstelt de focus op de menuknop. Onbekende toetsen doen niets.
    - `OrderSelection.vue`: de commandoregel is een `h3` en elke knop krijgt een `aria-label` met de volledige opdracht (`Kies opdracht: smeed 10 bronzen klinknagels`) plus `aria-disabled` tijdens een lopende keuze, zodat de twee identieke knoplabels te onderscheiden zijn.
    - `UpgradeItem.vue`: de koopknop noemt prijs en status in het `aria-label` (`Koop X voor 10 munten` of `Niet betaalbaar: X kost 10 munten`) en `aria-disabled` loopt mee met `disabled`.
    - `GameButton.vue`: het decoratieve hamer-glyph is `aria-hidden`; de knop blijft een native `<button>` met `disabled` en `aria-disabled`.
    - Contrast: disabled states zijn opgehaald (tab van `45%` naar `70%` alpha, knoppen van `opacity 0.65` naar `0.85` op `--color-surface-raised`). Alle tekstcombinaties halen nu minimaal 4.5:1; gemeten waarden: `text`/`bg` 15.2:1, `muted`/`bg` 9.3:1, `accent`/`bg` 6.3:1, `focus`/`bg` 12.8:1, `muted`/`raised` 6.9:1, `accent`/`raised` 4.7:1, disabled tab 4.7:1, disabled knop 5.2:1.
    - `eslint.config.js`: browser-globals zijn expliciet gedefinieerd zodat `document` en de `HTMLElement`-types niet als `no-undef` falen.
    - Tests: `GameNavigation.test.ts` dekt roving focus, disabled-skip en Escape met focusherstel; `GameHeader.test.ts` dekt de live-regio; `OrderComponents.test.ts` en `UpgradeItem.test.ts` dekken de labels; `App.test.ts` heeft een keyboard-only flow die project en order volledig met Enter, spatie en pijltjestoetsen afrondt.

- [x] **T30 — Voeg responsive en visuele feedback af (3 uur)**
  - **Afhankelijk van:** T22–T28.
  - **Levering:** consistente kaartlayout, responsive winkel en projectweergave, click-feedback en focus/hover/active states op desktop en mobiel.
  - **Test/acceptatie:** handmatige controles op 320px, 768px en 1440px; de primaire click- en buy-acties blijven zichtbaar en goed bruikbaar.
  - **Uitgevoerd:**
    - `main.css`: nieuwe tokens `--control-min-height: 2.75rem`, `--transition-fast: 100ms ease` en `--transition-medium: 180ms ease`. `.panel` krijgt een uniforme overgang op rand, schaduw en transform, zodat elke kaart dezelfde feedback voelt.
    - `main.css`: `prefers-reduced-motion: reduce` zet alle animaties en transities op 1ms. Dit was een expliciete vereuze uit T40 en lag logisch bij de visuele feedback.
    - `GameButton.vue`: de strike-animatie en hover/active gebruiken de tokens; `min-width` werd `width: min(100%, 18rem)` zodat de knop op smalle schermen niet krimpt.
    - `GameNavigation.vue`: tabs, menuknop en mobiele items krijgen hover- en active-states met `:not(:disabled)`, zodat een geblokkeerde view geen hoverfeedback geeft. De actieve tab behoudt zijn accent op hover.
    - `OrderSelection.vue`, `UpgradeItem.vue`, `ProjectList.vue`: kaarten krijgen een subtiele rand-hover; koop- en orderknoppen krijgen hover (licht op) en active (0.1rem omlaag) naast hun bestaande disabled-stijl. Locked projectkaarten reageren niet.
    - Alle schuifknoppen gebruiken nu `--control-min-height`, ook de meldingsknop in `App.vue` en de resetknop in `TestControls.vue`.
    - Responsive: de bestaande bretes van `48rem` en `36rem` blijven leidend; de winkel en projectweergave blijven één kolom binnen de `44rem`-contentbreedte, en de aambeeldknop schaalt mee van 18rem tot de volle breedte.
  - **Handmatige controle:** gemeten in een headless Edge via het DevTools-protocol op 320px, 768px en 1440px, op alle drie de views met een vooruitgeladen save. Op elke breedte is de horizontale overflow 0 en vallen de aambeeldknop (288 × 64px), de ordertracker en de koopknoppen volledig binnen het venster. De kleinste interactieve target is 44px (2.75rem). Met `prefers-reduced-motion: reduce` daalt `transition-duration` naar 0.001s.

- [x] **T31 — Test een volledige projectsessie end-to-end (3 uur)**
  - **Afhankelijk van:** T27, T28, T29.
  - **Levering:** een geautomatiseerde of reproduceerbare testscriptflow: clicks op Projecten, `Herstel het aambeeld` zonder munten voltooien, een order kiezen en een tweede order voltooien.
  - **Test/acceptatie:** de flow eindigt met correcte `points`, `coins`, `projectProgress` en `completedProjects`; de reward wordt niet dubbel toegekend.
  - **Uitgevoerd:** `src/App.sessions.test.ts` bevat de flow in `describe('T31 full project session')`, met gedeelde helpers `clickAnvil`, `gotoView`, `chooseOrder` en `completeOrder` die alleen door de UI navigeren.
    - Verse save: klik 10 keer op Projecten, daarna `points === 10`, `completedProjects === [1]`, `projectProgress === { 1: 10 }` en `coins === 0`, want het eerste project levert nul munten.
    - Geen dubbele beloning: extra `addPoints('project')` laten `completedProjects` op `[1]` en `coins` op 0.
    - Eerste order: de smederij toont direct twee offers zodra project 1 klaar is; na het kiezen verdwijnen de offers en verschijnt `OrderTracker`. Na `requiredPoints` clicks staan `completedOrderCount === 1`, `coins === coinReward` en is de order gesloten.
    - Tweede order: `quantity` en `coinReward` zijn strikt groter dan bij de eerste, en `coins` is exact de som van beide beloningen.
    - Persistentie: met `vi.useFakeTimers()` en 300ms vooruitlopen wordt de opgeslagen state gecontroleerd op `completedProjects`, `completedOrderCount`, `coins` en `projectProgress`; een remount levert exact dezelfde stand op.
    - Tweede test: 25 extra projectklikken en 25 extra orderklikken veranderen de beloning of tellen niets dubbel.
  - **Let op:** na project 1 is er bij 15 punten geen actief project meer, dus is er op het projecttabblad geen aambeeldknop. Die extra klikken worden daarom via de geëxposeerde `addPoints` gezet; dat is dezelfde code als de UI aanroept.

- [x] **T32 — Test een volledige upgradesessie end-to-end (3 uur)**
  - **Afhankelijk van:** T27, T28, T29.
  - **Levering:** een flow van een voltooide order met munten naar eerste upgradeaankoop, herberekende kost, tweede aankoop en verhoogde `clickPower` volgens de productformule.
  - **Test/acceptatie:** de flow toont nooit een negatieve coinbalans; de derde catalogusprijs volgt exact de AGENTS-formule.
  - **Uitgevoerd:** `src/App.sessions.test.ts` bevat de flow in `describe('T32 full upgrade session')`.
    - Munten verdienen: vier orders achter elkaar via `completeOrder`, zodat er genoeg munten zijn voor twee aankopen.
    - Prijsregel: `getUpgradeCost` wordt in de test naast de echte cataloguswaarden gezet, dus `firstCost === baseCost`, `secondCost === floor(baseCost * costMultiplier ** 1)` en `thirdCost === floor(baseCost * costMultiplier ** 2)` voor `Sterkere hamer` (10 → 15 → 22).
    - Aankopen: de eerste aankoop trekt exact `firstCost` af en toont `Gekocht 1×` met de herberekende prijs; de tweede aankoop trekt `secondCost` af en toont `Gekocht 2×` met de derde catalogusprijs.
    - `clickPower`: met twee `+10%`-upgrades is de power `1.1 * 1.1 = 1.21`. De test sluit een order met `ceil(requiredPoints / 1.21)` klikken en bewijst dat dit strikt minder klikken zijn dan `requiredPoints`.
    - Geen negatieve balans: na elke aankoop en na drie rondes "koop alles wat koopbaar is" wordt `coins >= 0` gecontroleerd.
  - **Let op:** één order levert te weinig munten voor twee aankopen (14 munten tegen 10 + 15), dus de flow verdient eerst meerdere orders. Dat is gameplay, geen testontkorting.

## Fase 7 — Pixel-art en visuele feedback

- [x] **T33 — Definieer de pixel-artstijl en assetpipeline (2 uur)**
  - **Afhankelijk van:** T05, T08, T09.
  - **Levering:** een korte `docs/visual-style.md` met charmante pixel-artrichtlijnen, palet, spritegrid, schaalregels, assetformaten en een besluit over bronbestanden versus CSS/SVG.
  - **Test/acceptatie:** maak een voorbeeldsprite en controleer die op 1x, 2x en 4x; pixelranden blijven scherp, kleuren blijven consistent en smoothing is uitgeschakeld.
  - **Uitgevoerd:**
    - `docs/visual-style.md` legt vast: `16 × 16` grid, vormen alleen uit `<rect>` op gehele coördinaten met getrappeerde diagonalen, geen curves en geen `stroke` in silhouetten.
    - Schaalregels: `small` 20px, `medium` 32px, `large` 48px, altijd een geheel veelvoud van het grid.
    - Assetbesluit: silhouetten zijn losse `.svg` omdat vorm met de hand getekend wordt; kleuren horen in TypeScript; upgrades krijgen eigen bestanden omdat geen upgrade samenvalt met item plus materiaal.
    - `sprite-check.html` in de projectroot rendert alle 50 combinaties op 16px, 32px en 64px via dezelfde `src/sprites/sprites.ts` als de game. De pagina wordt niet meegebouwd.
    - **Controle:** de galerij is op 16px, 32px en 64px gescreend. Pixelranden blijven scherp omdat alle vormen op gehele coördinaten staan en elke schaling een geheel veelvoud van 16 is; de kleuren per materiaal blijven over de drie schaalstappen identiek. Een eerste ronde leverde vijf onleesbare silhouetten op; de bijl, dolk, helm, harnas en speer zijn opnieuw getekend tot ze op 16px onderscheidbaar zijn van hun buren.

- [x] **T33A — Bouw het sprite-compositiesysteem voor items (3 uur)**
  - **Afhankelijk van:** T33, T27B.
  - **Levering:** losse SVG-bestanden per item in `src/sprites/items/`, kleurpaletten per materiaal in `src/sprites/materials.ts`, en een component `ItemSprite.vue` die een `itemId` en `materialId` combineert tot één sprite. Item bepaalt de vorm, materiaal de kleur; alle 50 combinaties zijn afgeleid, niet apart getekend.
  - **Test/acceptatie:** een catalogustest bewijst dat elk item één silhouetbestand heeft en elk materiaal één palet, dat alle 50 combinaties renderen, dat twee items met hetzelfde materiaal dezelfde kleur maar een andere vorm hebben, en dat de schaalbaarheid bij 1x, 2x en 4x pixelranden scherp houdt.
  - **Uitgevoerd:**
    - `src/sprites/items/` bevat tien witte silhouetten op een `16 × 16` grid: `1-hoefijzer.svg`, `2-klinknagel.svg`, `3-pijlpunt.svg`, `4-bijl.svg`, `5-schild.svg`, `6-dolk.svg`, `7-speer.svg`, `8-zwaard.svg`, `9-helm.svg`, `10-harnas.svg`.
    - `src/sprites/sprites.ts` koppelt elk item aan zijn silhouet en elk materiaal aan een palet van `base`, `highlight` en `shadow`. Alle vijf materialen hebben een eigen `base`-kleur en er is een neutrale `fallbackMaterialPalette` voor onbekende IDs.
    - `ItemSprite.vue` zet het silhouet als CSS `mask-image` en vult het met `linear-gradient(160deg, highlight, base, shadow)`. De sprite is één `<span>` met `role="img"` en een `aria-label` zoals `IJzer dolken`; een onbekende `itemId` rendert een gestippelde placeholder met het label `Onbekend voorwerp`.
    - Geïntegreerd in `OrderSelection.vue` (sprite boven de commandoregel in elke offertekaart) en `OrderTracker.vue` (sprite links van de lopende opdracht).
    - `src/sprites/sprites.test.ts` (14 tests) bewijst dat elk item één uniek silhouet heeft, elk materiaal één palet, dat alle 50 ordercombinaties renderen, dat de vijf materialen bij één item vijf kleuren maar één vorm geven, dat de tien items bij één materiaal tien vormen maar één kleur geven, en dat de sprite reageert op propwijzigingen.
    - `OrderComponents.test.ts` controleert dat beide componenten de sprite van de order doorgeven.
  - **Let op:** de kleuren staan bewust in TypeScript en niet in de SVG-bestanden. De silhouetten zijn wit, zodat ze als mask dienstdoen; zo levert één bestand alle vijf kleuravarianten en hoeft er geen 50 bestanden te bestaan. Upgrades krijgen eigen losse sprites, want een upgrade valt niet samen met een item-materiaalcombinatie.

- [ ] **T34 — Maak de pixel-artachtergrond van een middeleeuwse smederij (3 uur)**
  - **Afhankelijk van:** T33.
  - **Levering:** een achtergrond met een herkenbare medieval blacksmith-setting: smederij, aambeeld, vuur/forge, houten structuren en warm licht, zonder de leesbaarheid van de UI te ondermijnen.
  - **Test/acceptatie:** maak screenshots op 320px en 1440px; de sfeer is duidelijk zichtbaar, de achtergrond veroorzaakt geen horizontale overflow en tekst/knoppen blijven leesbaar.

- [ ] **T35 — Maak aambeeld-, hamer- en smitsesprites (3 uur)**
  - **Afhankelijk van:** T33, T34.
  - **Levering:** pixel-sprites voor een idle-aambeeld, hamer en minimaal idle-, pressed- en strike-poses; de spriteposities sluiten op elkaar aan zonder losse assets.
  - **Test/acceptatie:** de handmatige strike-toont correcte framevolgorde en terugkeer naar idle; alle frames hebben dezelfde pixelgrid en blijven scherp bij schalen.

- [ ] **T36 — Scheid handmatige en automatische clickfeedback (3 uur)**
  - **Afhankelijk van:** T23, T35.
  - **Levering:** een expliciete `manualClick`-/`autoClick`-onderscheiding in de clickflow; alleen `manualClick` activeert de hamer-op-aambeeld-animatie, terwijl beide routes punten kunnen toevoegen volgens de gekozen gameplayregels.
  - **Test/acceptatie:** unit- en componenttests bewijzen dat één handmatige klik precies één strike start en een automatische klik geen hameranimatie of vonken activeert.

- [ ] **T37 — Implementeer vonken bij de hamerklap (3 uur)**
  - **Afhankelijk van:** T35, T36.
  - **Levering:** een korte pixelart-vonkenburst op het contactpunt van hamer en aambeeld, met gecontroleerde duur, positie en opruiming van tijdelijke effecten.
  - **Test/acceptatie:** een handmatige klik toont de vonken precies tijdens de strike; de burst verdwijnt daarna, veroorzaakt geen layoutverschuiving en wordt niet getriggerd door `autoClick`.

- [ ] **T38 — Maak de gouden muntenexplosie bij projectvoltooiing (3 uur)**
  - **Afhankelijk van:** T24, T34, T37.
  - **Levering:** een confetti-achtige explosie van gouden pixel-munten die vanuit het aambeeld vertrekt bij `project-complete`; de explosie gebruikt bestaande coin-/rewarddata en herhaalt niet bij een dubbele completion-event.
  - **Test/acceptatie:** een projectvoltooiing toont één explosie met herkenbare gouden munten; een tweede event voor dezelfde `projectId` start geen tweede explosie en de tekst blijft leesbaar.

- [x] **T39 — Maak passende sprites voor upgrades (4 uur)**
  - **Afhankelijk van:** T09, T25, T33.
  - **Levering:** minimaal één herkenbare pixel-art sprite per upgrade, gekoppeld aan het `id` van de upgrade en passend bij de beschrijving en de percentagebonus `clickBonus`; voeg hover/focus/disabled varianten toe waar zinvol.
  - **Test/acceptatie:** een catalogustest controleert dat elke upgrade een sprite heeft, alle bestanden laden zonder fouten en de upgrade op desktop en mobiel herkenbaar blijft.
  - **Uitgevoerd:**
    - `src/sprites/upgrades/` bevat drie witte silhouetten op een `16 × 16` grid: `101-sterkere-hamer.svg` (hamer), `102-geborgen-hout.svg` (houten handvat), `103-vanur-van-de-meester.svg` (vlam).
    - `src/sprites/sprites.ts` koppelt elke upgrade aan zijn silhouet en een eigen palet (ijzer, hout, vuur) via `getUpgradeSilhouetteUrl`, `getUpgradePalette`, `getKnownUpgradeIds` en `getUpgradeById`.
    - `UpgradeSprite.vue` (nieuw) toont één upgrade met `role="img"` en een `aria-label` met de naam; een onbekende `upgradeId` rendert een gestippelde placeholder met het label `Onbekende upgrade`.
    - `UpgradeItem.vue` gebruikt `UpgradeSprite` in plaats van het ✦-teken; de sprite is 2.5rem en schaalt mee op desktop en mobiel.
    - `src/sprites/sprites.test.ts` (12 nieuwe tests) bewijst dat elke upgrade één uniek silhouet heeft, elke upgrade één palet, dat de drie upgrades drie kleuren hebben, dat de sprite reageert op propwijzigingen, dat de size-prop werkt en dat een onbekende upgrade degradeert naar een placeholder.

- [ ] **T40 — Integreer de visuele effecten en toonprestaties (3 uur)**
  - **Afhankelijk van:** T30, T33–T39.
  - **Levering:** zet pixel-art, blacksmith-achtergrond, strike, vonken, coin-explosie en upgrade-sprites samen in de responsive UI; beperk animaties tot korte, efficiënte effecten en respecteer `prefers-reduced-motion`.
  - **Test/acceptatie:** handmatige controles op 320px, 768px en 1440px tonen geen clipping of flicker; met reduced motion blijven alle visuele aanwijzingen en gameplayfeedback begrijpelijk.

## Fase 7b — Auto-clicker en leerling

- [x] **T46 — Voeg de auto-clicker upgrade en leerling-tab toe (3 uur)**
  - **Afhankelijk van:** T15, T16, T27.
  - **Levering:** een eenmalige upgrade (ID 104, "Leerling") die de auto-clicker ontgrendelt; een nieuw tabblad 'leerling' met een `ApprenticePanel` die de auto-clicker-snelheid toont; een `setInterval` dat elke seconde 10% van de clickkracht toevoegt aan het actieve doel.
  - **Test/acceptatie:** de upgrade kan slechts één keer gekocht worden; na aankoop verschijnt het leerling-tab; de auto-clicker voedt het actieve project of de actieve order; de upgrade staat na aankoop op 'ontgrendeld'. `npm run typecheck`, `npm run lint` en `npm run test` slagen (258 tests, 33 bestanden).
  - **Uitgevoerd:**
    - `src/types/game.ts`: `Upgrade` krijgt optionele velden `autoClickerUnlocker` en `maxPurchases`; `GameState` krijgt `autoClickerUnlocked: boolean`; `createInitialGameState()` initialiseert het op `false`.
    - `src/data/upgrades.ts`: nieuwe upgrade 104 "Leerling" met `baseCost: 50`, `costMultiplier: 1.5`, `clickBonus: 0`, `autoClickerUnlocker: true`, `maxPurchases: 1`.
    - `src/types/ui.ts`: `GameView` krijgt `'apprentice'`; `backgroundUrlsByView` krijgt een entry voor `'apprentice'` (geen achtergrond).
    - `src/composables/useGameState.ts`: `buyUpgrade` controleert `maxPurchases` en weigert een tweede aankoop; bij `autoClickerUnlocker` wordt `state.autoClickerUnlocked` gezet op `true`; `currentUpgradeCosts` en `affordableUpgradeIds` sluiten maxed-out upgrades uit; nieuw computed `autoClickerRate` (`clickPower * autoClickerShare`); `startAutoClicker()` en `stopAutoClicker()` met een `setInterval` van `autoClickerIntervalMs` (1000ms); een `watch` op `autoClickerUnlocked` start/stopt de interval; beide functies geëxposeerd via `UseGameStateReturn`.
    - `src/components/UpgradeItem.vue`: nieuw computed `isMaxPurchased`; toont "Ontgrendeld" in plaats van prijs; knop disabled met label "Ontgrendeld".
    - `src/components/GameNavigation.vue`: nieuwe tab `{ id: 'apprentice', label: 'Leerling' }`.
    - `src/App.vue`: `disabledViews` push `'apprentice'` zolang `autoClickerUnlocked` onwaar is; `onMounted` start de auto-clicker, `onUnmounted` stopt hem; nieuwe `ApprenticePanel` view; `defineExpose` uitgebreid.
    - `src/components/ApprenticePanel.vue` (nieuw): presentational component met props `autoClickerRate` en `clickPower`; toont punten/sec, punten/min en een uitleg.
    - `src/composables/gameStorage.ts`: `GameStateSnapshot` en `serializeGameState` bevatten `autoClickerUnlocked`.
    - `src/types/gameStateNormalization.ts`: `normalizeGameState` valideert `autoClickerUnlocked` als boolean, default `false`.
    - `src/sprites/upgrades/104-leerling.svg` (nieuw): wit silhouet op een `16 × 16` grid (kop, romp, uitgestrekte armen, benen), gekoppeld in `sprites.ts` met een eigen groen palet, zodat de sprite-regel uit `AGENTS.md` geldt voor elke upgrade.
    - Tests: `src/composables/useGameState.autoClicker.test.ts` (10 tests) dekt vergrendeld starten, eenmalig kopen zonder dubbele charge, 10% per seconde, schaling met click-upgrades, voeden van een actieve order, stoppen, geen dubbele interval, scope-opruiming en reset; `src/App.autoClicker.test.ts` (4 tests) dekt de disabled tab, aankoop → "Ontgrendeld" → panel, punten zonder klik en interval-opruiming na unmount; `src/components/ApprenticePanel.test.ts` (3 tests) dekt rate, minuut-projectie en `aria-labelledby`; `gameStorage.test.ts` krijgt herstel na reload en een ongeldige vlag.
  - **Let op:**
    - De interval moest `applyPoints(target, amount)` gebruiken in plaats van `addPoints()`. `addPoints` rekent met de volledige clickkracht en zou de leerling dus 10× zo snel laten werken; de eerste testrun ving dit op. `addPoints` is nu een dunne wrapper die de doelselectie doet en `applyPoints` aanroept.
    - `useGameState` registreert `onScopeDispose(stopAutoClicker)` zodra de interval start en er een component scope actief is. Zonder die extra vangnet zou een unmount van een willekeurige component die de composable gebruikt de timer laten hangen; `App.vue` blijft `stopAutoClicker` in `onUnmounted` aanroepen.
    - De bestaande sprite- en catalogustests werkten met array-indexen (`upgrades[0]`, `upgrades[4]`) in `sprites.ts`. Door het invoegen van 104 liepen die stil scheef: 105 kreeg het silhouet van 103. De mapping gebruikt nu de ID-positie van de nieuwe upgrade en de tests controleren catalogus en sprites samen.
    - Twee faalgevonden kwamen uit het ongecommitte werk van een eerdere sessie en niet uit deze taak, maar blokkeerden `npm run test`: de dev-only upgrade 105 had `costMultiplier: 1` (in strijd met de catalogusinvariant `> 1`) en deelde het silhouet van 103. De multiplier is nu `1.5` en 105 heeft een eigen bliksem-silhouet gekregen.
    - `UpgradeShop.vue` had al een `showDevUpgrades`-prop die `App.vue` niet doorgaf; die is nu aangesloten op `showTestControls`, anders was de winkel-test kapot.

## Fase 8 — Kwaliteit en oplevering

- [ ] **T41 — Breid unit tests uit voor de hele core (4 uur)**
  - **Afhankelijk van:** T15, T16, T18, T19.
  - **Levering:** deterministische tests voor clicks, projectgrenzen, beloningen, upgradekosten, aankoopfouten, selectors, opslagvalidatie en recovery.
  - **Test/acceptatie:** `npm run test` slaagt en de tests bewijzen dat edge cases niet stil falen of uitzonderingen lekken.

- [ ] **T42 — Breid componenttests uit (4 uur)**
  - **Afhankelijk van:** T27, T28, T29, T40.
  - **Levering:** tests voor `GameHeader`, `GameButton`, `ProjectTracker`, `UpgradeItem`, `UpgradeShop`, App-eventkoppelingen en de visuele feedbackcontracten.
  - **Test/acceptatie:** snapshots of expliciete assertions controleren tekst, props, disabled states, typed emit-payloads, sprite-toewijzingen en het verschil tussen handmatige en automatische clicks.

- [ ] **T43 — Voer een release-build en kwaliteitschecks uit (2 uur)**
  - **Afhankelijk van:** T41, T42.
  - **Levering:** een schone `npm run typecheck`, `npm run lint`, `npm run test` en productiebuild met geen ongebruikte of foutieve imports.
  - **Test/acceptatie:** alle checks geven exitcode 0; de build kan lokaal via `npm run preview` worden gestart.

- [ ] **T44 — Werk de README en deploymentinstructies bij (2 uur)**
  - **Afhankelijk van:** T01, T40, T43.
  - **Levering:** installatie-, ontwikkel-, test- en buildinstructies, uitleg van opslag/localStorage, controles om opgeslagen data te resetten en uitleg van de gekozen progressie- en pixel-artregels.
  - **Test/acceptatie:** een nieuwe gebruiker kan met alleen de README de app installeren, starten, testen en bouwen zonder bestaande kennis uit de sessie.

- [ ] **T45 — Voer de finale acceptatietest uit (2 uur)**
  - **Afhankelijk van:** T30–T44.
  - **Levering:** een afvinklijst voor clicks, projecten, munten, upgrades, exponentiële kosten, reload-persistentie, foutafhandeling, pixel-art, blacksmith-sfeer, spritefeedback en toegankelijkheid.
  - **Test/acceptatie:** elke checklistregel is aantoonbaar uitgevoerd; handmatige clicks slaan het aambeeld, automatische clicks doen dat niet, projectvoltooiing explodeert gouden munten en elke upgrade heeft een passende sprite.

## Definitie van “done”

De game is klaar wanneer:

- `npm run typecheck`, `npm run lint`, `npm run test` en `npm run build` slagen.
- Een nieuwe speler opent op Projecten, voltooit `Herstel het aambeeld` zonder munten, kiest een repetitieve order, voltooit orders en kan munten/upgrades gebruiken.
- De multiplicatieve `clickPower`, `purchaseCount` en projectvoortgang correct en reactief worden bijgewerkt.
- Upgradekosten exact volgens `floor(baseCost * costMultiplier ** purchaseCount)` met minimumwaarde 1 worden berekend.
- Een reload de voortgang herstelt; corrupte of niet-beschikbare LocalStorage blokkeert gameplay niet.
- Componenten props naar beneden en typed events naar boven gebruiken, en `App.vue` de centrale lifecycle/persistence beheert.
- Het projecttabblad toont alleen voltooide projecten en het volgende project; de smederij toont orders zonder vereiste puntkosten.
- Alle stijlen en sprites vormen een charmante pixel-artstijl en de achtergrond heeft een middeleeuwse-smithsfeer.
- Alleen handmatige clicks laten de hamer het aambeeld raken en vonken veroorzaken; automatische clicks veroorzaken geen hamerklap.
- Projectvoltooiing veroorzaakt een confetti-achtige explosie van gouden munten vanuit het aambeeld en upgrades hebben passende sprites.
- De UI op mobiel en desktop bruikbaar en toegankelijk is.
