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

- [x] **T34 — Maak de pixel-artachtergrond van een middeleeuwse smederij (3 uur)**
  - **Afhankelijk van:** T33.
  - **Levering:** een achtergrond met een herkenbare medieval blacksmith-setting: smederij, aambeeld, vuur/forge, houten structuren en warm licht, zonder de leesbaarheid van de UI te ondermijnen.
  - **Test/acceptatie:** maak screenshots op 320px en 1440px; de sfeer is duidelijk zichtbaar, de achtergrond veroorzaakt geen horizontale overflow en tekst/knoppen blijven leesbaar.
  - **Uitgevoerd:**
    - `src/sprites/backgrounds/smederij.svg` (240 rechthoeken, 40 kleuren, `viewBox="0 0 320 200"`, `shape-rendering="crispEdges"`): bakstenen muur, houten balken en posten, een getrapt rookvangscherm boven een haard met gloeiende kolen, een hangende lamp met koel licht, een gereedschapsrek met tang, hamer, helm en schild, een houtstapel, een vat met koelwater en een donker aambeeld op een boom.
    - `src/types/ui.ts`: `backgroundUrlsByView` koppelt `smithy` aan de nieuwe import. `upgrades` en `apprentice` blijven zonder scène; dat blijft een bewuste keuze en de tests bewaken dat.
    - `src/App.vue`: de sluier is omgezet naar `--scenery-veil-top/mid/bottom` met een standaardwaarde op `.app-content--scenery` en een eigen modifier `.app-content--scenery--smithy`. `sceneryClasses` zet de modifier aan de hand van de actieve view, zodat een volgende locatie alleen CSS hoeft toe te voegen. De dubbele commentbovenblok bij de sluier en een drievoudige lege regel zijn opgeruimd.
    - `src/types/ui.test.ts` (8 tests): de smithytest verwacht nu een scène; er zijn tests bijgekomen voor het wisselen van modifier en achtergrond bij het openen van de smederij, voor het afvallen van de modifier bij terugkeren naar projecten en voor het geblokkeerde tabblad tijdens project één. De test zet een save met `createTestGameState({ completedProjects: [1] })`, want anders is het tabblad nog disabled.
    - `docs/visual-style.md` heeft een sectie *Achtergrondscenes* met het `320 × 200`-formaat, de rect-only-regel en de belangrijkste valkuil: op 1440px schaalt de scène met `cover` 3.8x en valt de bovenste strook weg, op 320px is alleen de onderste strook over, dus herkenbare elementen horen in de randen.
    - **Controle:** `npm run lint`, `npm run typecheck`, `npm run build` en `npm run test` slagen (271 tests, 33 bestanden). De render is via het DevTools-protocol op 320px en 1440px gemeten: `documentElement.scrollWidth === innerWidth`, dus geen horizontale overflow, en `main.scrollWidth === main.clientWidth` (288 en 1216px). De sluier komt als `linear-gradient(rgba(32, 21, 17, 0.58) …, rgba(22, 13, 10, 0.74))` in beeld, dus de eigen modifier zit er echt. In de zichtbare randstroken van de 1440px-screenshot is de haard de warmste en helderste plek en het gereedschap de koelste; op 320px loopt de gloed warm langs de linkerrand en is het staal koel aan de rechterrand, met een donkere vloerstrook onder het paneel. De tekst haalt 5.27:1 op het paneel.
  - **Let op:**
    - De eerste sluier voor de smederij was warmbruin op 68%. Die bleek te zwaar: de koude staalkleuren neutraliseerden volledig en de hele scène las als één bruin blok. De sluier is nu bijna kleurloos en lichter, zodat het vuur warm en het gereedschap koel blijft zonder dat het tegen de panelen gaat spelen. Gemeten in de randstroken: het bereik in helderheid steeg van 37 naar 44 links en van 47 naar 60 rechts.
    - De sluier hoeft zelf geen 4.5:1 te halen, want er staat geen tekst direct op de scène. De taalcontrasten komen uit de panelen; de taal haalt daar 5.27:1.
    - Op 320px blijft er van de scène een rand van 12px links en rechts en 16px onder het paneel over. Dat is hetzelfde gedrag als de bestaande stadssceen en voldoet aan de acceptatie, maar het betekent dat het mobiele uitsnede-ontwerp grotendeels door de randen en niet door het midden bepaald wordt.
    - Het aambeeld is in T35 uit de scène gehaald en vervangen door de sprite uit `src/sprites/forge/anvil-sheet.svg`. De rekhamer is toen weggevallen, zodat er maar één hamer in beeld is. De scène telt daardoor nog 224 rechthoeken.

- [x] **T35 — Maak aambeeld-, hamer- en smitsesprites (3 uur)**
  - **Afhankelijk van:** T33, T34.
  - **Levering:** pixel-sprites voor een idle-aambeeld, hamer en minimaal idle-, pressed- en strike-poses; de spriteposities sluiten op elkaar aan zonder losse assets.
  - **Test/acceptatie:** de handmatige strike-toont correcte framevolgorde en terugkeer naar idle; alle frames hebben dezelfde pixelgrid en blijven scherp bij schalen.
  - **Uitgevoerd:**
    - `src/sprites/forge/anvil-sheet.svg`: één sheet van 144 bij 48 met drie cellen van 48 bij 48, van links naar rechts `idle`, `pressed` en `strike`. 75 rechthoeken, alleen `<rect>`, `shape-rendering="crispEdges"`, geen `stroke` en geen `defs`. Het aambeeld en de stam herhalen per frame; alleen de hamer verschuift. `FACE_TOP` is 25, dus de hamerkop raakt in `strike` het aambeeld exact en zakt er nooit doorheen.
    - `src/sprites/forge-sheet.ts`: `FORGE_POSES`, het type `ForgePose`, `forgeSheetUrl`, `FORGE_CELL_SIZE`, `FORGE_FRAME_COUNT`, `FORGE_FRAME_STEP` en `isForgePose`. De sheet is de enige bron van de framevolgorde, zodat component en asset niet uit elkaar kunnen lopen.
    - `src/components/GameButton.vue` is herschreven van knop met tekst naar het aambeeld zelf: een native `<button>` zonder rand en zonder achtergrond, met `aria-label="Sla op het aambeeld"` en een `aria-hidden` spritekind. Het zichtbare zinnetje "Sla op het aambeeld" en de emoji-hamer zijn weg. De poseruntime zit in state (`isPressed` en `isStruck`), niet in een CSS-animatie, en de `setTimeout` wordt in `onUnmounted` opgeruimd.
    - `src/App.vue`: `<GameButton>` staat bovenaan in `.game-view` in plaats van midden in `.game-primary`, in beide views. Zo wisselt hij niet van plaats zodra er een melding of projectkaart bijkomt. De knop hangt aan `v-if="activeProject"` respectievelijk `v-if="activeOrder"`, dus zonder actief doel is er geen klikvlak. De afstand tussen aambeeld en paneel komt uit `.game-view > .game-button + .game-primary`. De bestaande `.game-primary > :first-child { justify-self: center }` geldt nu voor het paneel zelf in plaats van voor de knop; gemeten is dat geen verandering, want de panelen hebben `width: 100%` en vullen op 320px, 768px en 1440px nog steeds de volle 264, 704 en 704px.
    - `src/sprites/backgrounds/smederij.svg`: het getekende aambeeld met stam en de hamer op de gereedschapsrek zijn verwijderd, plus de bijbehorende comments en de coördinatenvermelding in de compositiebeschrijving. Er staat nog één aambeeld in beeld en dat is de sprite.
    - `src/components/GameButton.test.ts` (20 tests): de zichtbare-tekstclaim is vervangen door een `aria-label`-claim, en er is een blok bij voor de volledige poseruntime `idle → pressed → strike → idle`, een snelle tweede klik die de slag herstart, pointercancel en blur, het opruimen van de timer bij unmount en de koppeling van `data-pose` op de frameindex.
    - `src/sprites/forge-sheet.test.ts` (9 tests, nieuw): leest het asset met `?raw` en controleert de volgorde van de poses, het type-guard, de `viewBox`, dat alle 75 rechthoeken gehele coördinaten hebben en binnen de cel vallen, dat er geen `stroke`, curve, `defs` of gradient in zit, dat elke frame gevuld is en dat alle frames even groot zijn. De framestap wordt nagerekend: `1 / (frames - 1) = 50%`.
    - `sprite-check.html` heeft een forge-sectie die de drie poses op 48, 96 en 144px toont, dus 1x, 2x en 3x, met dezelfde 50%-stap als het spel.
    - `docs/visual-style.md` heeft een sectie *Forge-sheet* met het sheetformaat, de `300%`-regel, de herkomst van de 50%-stap, de gehele veelvouden en de reden dat de runtime in state moet staan.
    - **Controle:** `npm run lint`, `npm run typecheck`, `npm run build` en `npm run test` slagen (286 tests, 34 bestanden). Gemeten via het DevTools-protocol op 320px, 768px en 1440px, in beide views: `documentElement.scrollWidth === innerWidth`, dus geen horizontale overflow. De knop meet 120 bij 120px op 320px en 216 bij 216px vanaf 768px, met een sprite van 96 en 192px, wat 2x en 4x de cel van 48px is. De sprite staat op alle drie de breedtes exact gecentreerd in de view en overlapt het paneel niet. De knop is doorgerekend tot `background-size: 300% 100%` met `background-position` `0%` in idle en `100%` in strike, dus twee frames van 50% precies op een hele cel. De sprite heeft in beeld 39 tot 55 unieke kleuren met een helderheidsbereik van 31 tot 151, dus er staat een echte tekening en geen leeg vlak. De hamer zakt tussen idle en strike exact 8 spritepixels en komt met zijn donkere onderkant op rij 24 tegen het aambeeld op rij 25. `data-pose` loopt van `idle` naar `pressed` bij pointerdown, naar `strike` bij de klik en terug naar `idle` na 140ms, in beide views, terwijl `data-strike-count` van 0 naar 1 gaat.
  - **Let op:**
    - De `v-else-if` van de melding "Alle projecten voltooid" hing in de oude markup stilzwijgend aan `GameButton v-if="activeProject"`, omdat een tussenliggend element de v-if-keten breekt. Door de knop te verplaatsen sprong de keten naar `hasStorageNotice` en verschenen bij een gerepareerde save beide meldingen tegelijk. De conditie noemt nu zelf het ontbreken van een actief project, en de helper `storeState` in `App.test.ts` normaliseert voor het opslaan, zodat alleen tests die daar echt over gaan een opslagstatus zien.
    - Er staat geen losse smitsfiguur in de sheet. De taaknoemt "smitsesprites", maar de levering vraagt om een idle-aambeeld, hamer en poses; een handfiguur die zelf slaan zou de klikfeedback in de weg staan. Welke pose dan ook zichtbaar is, het is het aambeeld.
    - De stap is 50%, niet `100 / 3 = 33,33%`. Bij `background-size: 300%` is het verschil tussen element en tekening twee elementen breed, dus 50% haalt precies één cel op. Bij vier frames zou 33,33% een derde cel zijn en de sprite op een halve cel staan knippen. `FORGE_FRAME_STEP` staat in `forge-sheet.ts` en de test rekent de relatie na.
    - De spritegrootte is 6rem, 9rem of 12rem, dus 2x, 3x of 4x de cel van 48px. Eerst stond er 7rem, maar dat is geen geheel veelvoud en zou sommige pixelrijen drie schermpixels dik maken en andere twee.

- [x] **T36 — Scheid handmatige en automatische clickfeedback (3 uur)**
  - **Afhankelijk van:** T23, T46.
  - **Levering:** een expliciete `manualClick`-/`autoClick`-onderscheiding in de clickflow; alleen `manualClick` activeert de hamer-op-aambeeld-animatie, terwijl beide routes punten kunnen toevoegen volgens de gekozen gameplayregels.
  - **Test/acceptatie:** unit- en componenttests bewijzen dat één handmatige klik precies één strike start en een automatische klik geen hameranimatie activeert.
  - **Uitgevoerd:**
    - `src/types/ui.ts`: nieuw type `ClickSource = 'manual' | 'auto'`.
    - `src/composables/useGameState.ts`: `addPoints(target?, source = 'manual')` neemt de bron als tweede parameter; `applyPoints(target, amount)` geeft nu een boolean terug zodat een klik zonder doel niet geteld wordt; nieuwe computed `manualClickCount` en `autoClickCount` staan buiten de state (geen save, want het is geen spelstand).
    - De interval van de leerling blijft `applyPoints('order', autoClickerRate.value)` gebruiken en telt daarna zelf één automatische klik; `addPoints(target, 'auto')` zou met de volledige clickkracht rekenen. Zie T36A: het doel is daar vastgezet op `'order'`.
    - `src/components/GameButton.vue`: een `strikeCount`-ref verhoogt alleen bij een echte activatie; de slag-animatie hangt aan de klasse `game-button__hammer--striking` in plaats van aan `:active`, met de teller als `:key` zodat elke klik zichtbaar is. `data-strike-count` maakt de toestand toetsbaar.
    - `src/App.vue`: `handleProjectClick` en `handleOrderClick` geven expliciet `'manual'` door.
    - Tests: `useGameState.autoClicker.test.ts` krijgt 3 tests (tellers gescheiden, klik zonder doel telt niet, de leerling verhoogt nooit de handmatige teller), `App.autoClicker.test.ts` krijgt 2 tests (hamer blijft stil tijdens 5 seconden leerlingtijd, handmatige klik telt) en `GameButton.test.ts` krijgt 4 tests (geen strike bij mount, strike bij klik en Enter, geen strike op irrelevante toets, geen herhaling bij ingedrukte spatie). Volledige suite: 267 tests, 33 bestanden; typecheck, lint en build slagen.
  - **Let op:**
    - De tellers moeten `ref` zijn, geen gewone `let`. Een `computed(() => manualClicks)` over een `let` heeft geen reactieve afhankelijkheid, cached de eerste waarde en verandert daarna nooit meer; de eerste testrun ving dat.
    - De slag-animatie is van `:active` naar een tellerclass verplaatst. Bij `:active` verdwijnt de animatie nogal snel en ziet een snelle klik niets; met een teller per activatie is elke handmatige klik zichtbaar. Het visueel resultaat is hetzelfde, maar nu ook testbaar en niet uit te lokken door de leerling.
    - De taak noemde "vonken" in de acceptatie, maar vonken zijn T37 en bestaan nog niet. Deze taak begrenst zich tot de hamerfeedback; de leerling activeert die ook niet.

- [x] **T36A — Beperk de leerling tot actieve orders (1 uur)**
  - **Afhankelijk van:** T36.
  - **Levering:** de leerling (autoclicker) voegt punten toe uitsluitend aan de actieve order in de smederij; aan projecten helpt hij nooit mee en die vorder je alleen met een handmatige klik.
  - **Test/acceptatie:** zonder actieve order verandert `points` en `projectProgress` niet door leerlingtijd; mét actieve order loopt de voortgang op en `autoClickCount` mee.
  - **Uitgevoerd:**
    - `src/composables/useGameState.ts`: de doelkeuze in de interval is weg. Waar `state.activeOrder === null ? 'project' : 'order'` stond, staat nu vast `applyPoints('order', autoClickerRate.value)`. Omdat `applyPoints` zonder actieve order `false` teruggeeft, vallen de punten, de voortgang en de automatische teller vanzelf weg zonder extra conditie.
    - Nieuwe computed `isAutoClickerWorking` (`autoClickerUnlocked && activeOrder !== null`), toegevoegd aan `UseGameStateReturn`. Die is de enige bron van waarheid voor het paneel, zodat `App.vue` de situatie niet zelf hoeft af te leiden.
    - De interval wordt nog steeds gestart en gestopt op `autoClickerUnlocked` en niet op `activeOrder`. Zo wisselen een order kiezen en een order afronden de timer niet en blijft `vi.getTimerCount()` voorspelbaar op 1 zolang de leerling ontgrendeld is.
    - `src/components/ApprenticePanel.vue`: nieuwe prop `isWorking`. Zonder actieve order toont het paneel alleen een wachtstatus met `role="status"` en nadrukkelijk géén rate, want een cijfer dat er toch niet binnenkomt is misleidend. Met een order toont het de stats, de per minuut en een notitie dat hij aan projecten niet meehelpt. De tekstregel "De leerling werkt ongeacht welke tab je bekijkt" is weg; die beweerde het tegenovergestelde van de nieuwe regel.
    - `src/App.vue`: `:is-working="isAutoClickerWorking"` wordt aan het paneel doorgegeven. De projectenview blijft ongemoeid; de hint staat alleen in het Leerling-paneel.
    - Teksten: `src/data/upgrades.ts` beschrijft upgrade 104 nu als een leerling die op de actieve order slaat en niet aan projecten meehelpt. `AGENTS.md` en `docs/game-rules.md` beschrijven dezelfde regel, inclusief de reden dat de timer niet op `activeOrder` reageert. `docs/game-rules.md` § Status- en foutstates heeft een rij voor de inactieve leerling.
    - Tests: `useGameState.autoClicker.test.ts` gaat van 15 naar 18 tests. Een helper `withActiveOrder()` zet een actieve order, zodat de meerderheid van de tests een leerling test die daadwerkelijk iets heeft om te doen; "niets doen zonder order" staat in drie eigen tests. Nieuw: `never feeds a project while no order is active`, `adds nothing and counts no click while there is no active order`, `starts working the moment an order is selected`, `stops working once the order is finished` en `keeps one timer across selecting and finishing an order`.
    - `ApprenticePanel.test.ts` gaat van 3 naar 9 tests: de drie bestaande krijgen `isWorking: true`, en er komt een blok dat bewijst dat er zonder order geen `punten per seconde`, geen `punten per minuut` en geen enkele rate in de tekst staat, dat de wachtregel `role="status"` heeft en dat de prop-swap tussen beide statussen doorwerkt.
    - `App.autoClicker.test.ts` gaat van 6 naar 8 tests. `adds auto-clicker points every second without a click` is vervangen door `never adds points to a project while no order is active` en `adds auto-clicker points to an active order every second`, plus `shows the waiting status until an order is active`.
    - **Controle:** `npm run lint`, `npm run typecheck`, `npm run build` en `npm run test` slagen (299 tests, 34 bestanden). Gemeten via het DevTools-protocol op 320px, 768px en 1440px, identiek op alle drie: op de projectenview met een actief project en geen order geeft twintig seconden leerlingtijd `pointsDelta` 0 en blijft de projectbalk op `aria-valuenow` 0. Met een order in de smederij loopt `activeOrder.progress` in twintig seconden van 0.1 naar 2.1 en `points` met 2.0, dus twintig tikken van 0.1. Vervolgens tien seconden terug op de projectenview mét een order in beeld: de projectbalk blijft 0 terwijl `points` met 1.0 oploopt, want de leerling voedt de order ongeacht het tabblad. Het Leerling-paneel wisselt van de wachtstatus (`role="status"`, geen stats) naar de werkstatus met de cijfers. Geen horizontale overflow op geen van de drie breedtes.
  - **Let op:**
    - De interval blijft draaien terwijl de leerling ontgrendeld is, ook zonder order. De gating zit in de tick en niet in het beheer van de timer: als je de timer op `activeOrder` zou starten en stoppen, wisselt elke orderkeuze en elke afronding de timer, en `vi.getTimerCount()` zou van test tot test verschillen.
    - Een test die een order "bijna rond" maakt, kan niet rekenen op `requiredPoints - 0.05`. `normalizeGameState` zet de voortgang op een geheel getal, dus die wordt 9 in plaats van 9.95. En tien keer 0.1 optellen geeft 9.9999… in plaats van netjes 10, waardoor `nextProgress >= requiredPoints` vals blijft. De tests rekenen daarom met ruime marge en leggen het tik aantal niet vast.
    - De eerdere versie van `seedUnlockedSave` in `App.autoClicker.test.ts` schreef een niet-genormaliseerde save. Daardoor kwam die binnen als `recovered` en stond er een opslagmelding naast de panelen die de test wilde meten. De helper normaliseert nu, net als het spel, en de helper voor het kopen van de leerling is uit de drie tests gehaald zodat ze niet allemaal dezelfde negentien regels winkelcode herhalen.
    - De header rondt de score af op "2k", dus een groei van twee punten is daar niet zichtbaar. De meting leest daarom de opgeslagen state uit LocalStorage en de `aria-valuenow` van de voortgangsbalken, niet de headertekst.

- [x] **T37 — Implementeer vonken bij de hamerklap (3 uur)**
  - **Afhankelijk van:** T35, T36.
  - **Levering:** een korte pixelart-vonkenburst op het contactpunt van hamer en aambeeld, met gecontroleerde duur, positie en opruiming van tijdelijke effecten.
  - **Test/acceptatie:** een handmatige klik toont de vonken precies tijdens de strike; de burst verdwijnt daarna, veroorzaakt geen layoutverschuiving en wordt niet getriggerd door `autoClick`.
  - **Uitgevoerd:**
    - `src/composables/useTransientEffect.ts` (nieuw): gedeelde logica voor tijdelijke effecten, met `isRunning`, `runId`, `trigger` en `stop`. `trigger()` verhoogt eerst `runId` en daarna pas de vlag, want anders herstart de animatie niet bij een snelle tweede activatie: `isRunning` blijft dan immers waar. De timer wordt in `onScopeDispose` opgeruimd en buiten een component scope niet vastgezet, net als de interval van de leerling.
    - `src/components/SparkBurst.vue` (nieuw): zeven blokken met elk een eigen `--spark-x`, `--spark-y`, `--spark-delay` en `--spark-size`, uit één `@keyframes spark-fly`. `aria-hidden`, absoluut geplaatst met een breedte en hoogte van nul, en `pointer-events: none`.
    - `src/components/GameButton.vue`: er is een `.game-button__stage` bijgekomen die het vak van de sprite deelt met de burst. De sprite-grootte staat nu op de stage en de sprite zelf is 100% van dat vak, zodat `--forge-render-size` op één plek blijft. `activate()` roept `triggerSparks()` aan, naast het zetten van de slagpose.
    - De vonken en de slag delen de constante `STRIKE_DURATION_MS` van 140ms. Eén getal voorkomt dat de vonken nog vliegen als de hamer alweer in idle staat.
    - `src/App.vue` en `useGameState.ts` hoefden niet aangepast te worden: de leerling loopt langs `applyPoints` en komt `activate()` nooit tegen, dus automatisch klikken veroorzaakt geen vonken. Dat is nu expliciet bewezen in plaats van aangenomen.
    - Tests: `useTransientEffect.test.ts` (nieuw, 9 tests) dekt aan/uit, de duur, het ophogen van `runId` terwijl hij nog waar is, het herstarten van de duur, één timer in plaats van drie, `stop()`, een negatieve duur en de scope-opruiming. `SparkBurst.test.ts` (nieuw, 5 tests) dekt de waaier, unieke banen, zijwaartse spreiding, afwezigheid in de a11y-boom en het ontbreken van een eigen timer. `GameButton.test.ts` gaat van 20 naar 29 tests met een blok `GameButton spark burst`: geen vonken in idle, vonken in de stage, pas bij de click en niet bij pointerdown, ook bij Enter, weg na 140ms, een nieuw element bij een snelle tweede klik, niets bij een ingedrukte spatie, niets als de knop disabled, en de timer opgeruimd bij unmount. `App.autoClicker.test.ts` krijgt `never sparks while the apprentice works`, dat de leerling tien seconden lang een order voedt en toch nul vonken en nul hamerklappen laat zien.
    - `docs/visual-style.md` heeft een sectie *Tijdelijke effecten* met de `runId`-regel, de reden dat de duur in JavaScript staat, en de afwijking dat de vonken geen asset zijn. `AGENTS.md` beschrijft de composable en beide componenten.
    - **Controle:** `npm run lint`, `npm run typecheck`, `npm run build` en `npm run test` slagen (338 tests, 38 bestanden). Gemeten via het DevTools-protocol op 320px, 768px en 1440px: zeven vonken tijdens de slag en nul erna, blokken van 3 bij 3px met `position: absolute`, `border-radius: 0` en `pointer-events: none`. De stage meet 96 bij 96px op 320px en 192 bij 192px vanaf 768px, dus geheel veelvouden van de cel van 48px. De bovenkant van het paneel en van de projectkaart blijft vóór, tijdens en na de slag exact gelijk, dus de burst veroorzaakt geen layoutverschuiving. Onder `prefers-reduced-motion: reduce` meten de vonken 0 bij 0px, dus `display: none` werkt en er flitst niets.
  - **Let op:**
    - **De `animation`-shorthand was ongeldig en het effect bewoog dus nooit.** `animation: spark-fly var(--effect-duration) var(--transition-medium) var(--spark-delay) both` levert `spark-fly 140ms 180ms ease 0ms both`: drie tijdswaarden, terwijl er maximaal twee mogen zijn. De browser gooit de hele declaratie weg, dus `animationName` was `none`, `transform` was `none` en alle zeven vonken stonden op (0, 0) gestapeld. In beeld was dat precies één gekleurd stipje. Hetzelfde gold voor de munten, waar bovendien `--coin-duration` nergens werd gezet. Beide gebruiken nu losse `animation-name`/`-duration`/`-timing-function`/`-delay`/`-fill-mode`.
    - De meting van T37 keek naar `position`, `border-radius` en `pointer-events` van de deeltjes, maar nooit naar of de keyframe daadwerkelijk draaide. Alle aanwezigheids- en layoutcontroles waren daarmee waar en toch onzin: er waren zeven elementen, die lagen alleen allemaal op dezelfde pixel. `AGENTS.md` verbiedt de shorthand-vorm nu expliciet, en de eindmeting telt pixels en hun spreiding in plaats van alleen aanwezigheid.
    - De vonken waren 1 tot 3px en de eerste tabel liet ze niet verder dan 50px vliegen, ook nog eens zonder `--effect-scale`. Dat is een stip op een 96px sprite. Nu: blokken van 2 tot 5px, twaalf stuks, een spreiding tot 179 bij 87px op desktop, en een vierkante flitsring die in 231ms uitklapt van 76 naar 198px.
    - De `--effect-scale` van de stage moet op dezelfde drie breakpoints als `--forge-render-size` staan, anders schaalt de waaier niet mee. De getallen in de tabel zijn voor schaal 1; op schaal 3 is de hoogste vonk 105px boven het contactpunt.
    - De blokgrootte van een vonk wordt met opzet **niet** vermenigvuldigd met `--effect-scale`. Op schaal 4 zou een 5px vonk 20px worden en lezen als een gloeiend blok in plaats van een vonk.
    - De vonken zijn **geen asset**, en dat is een bewuste afwijking van de taaktekst, die "pixelart-vonkenburst" vraagt. Ze zijn CSS-blokken in plaats van een sprite. Wil je een echte sprite, dan is dat een `.svg` in `src/sprites/` met de mask-techniek van `ItemSprite.vue`.
    - Onder `prefers-reduced-motion: reduce` krijgt de hele burst `display: none`. Het globale `animation-duration: 1ms` zou de vonken anders in één frame laten flitsen, wat erger is dan niets tonen. De slag zelf blijft zichtbaar, want die is state en geen animatie.
    - **Controle:** gemeten via het DevTools-protocol op 320px, 768px en 1440px. De keyframe draait nu echt: `animationName: spark-fly`, `animationDuration: 0.42s`, `animationTimingFunction: ease-out`. In beeld zitten op t=90ms 2529 pixels boven een luminantie van 100, verspreid over 165 bij 103px; op t=200ms is de spreiding 179 bij 87px met twaalf van de twaalf vonken op verschillende posities. De flitsring heeft `border-radius: 0` en klapt uit van 76 naar 198px in 231ms. Onder `prefers-reduced-motion: reduce` meten de vonken 0 bij 0px en levert de burst exact nul extra lichte pixels op: er flitst niets.

- [x] **T38 — Maak de gouden muntenexplosie bij projectvoltooiing (3 uur)**
  - **Afhankelijk van:** T24, T34, T37.
  - **Levering:** een confetti-achtige explosie van gouden pixel-munten die vanuit het aambeeld vertrekt bij `project-complete`; de explosie gebruikt bestaande coin-/rewarddata en herhaalt niet bij een dubbele completion-event.
  - **Test/acceptatie:** een projectvoltooiing toont één explosie met herkenbare gouden munten; een tweede event voor dezelfde `projectId` start geen tweede explosie en de tekst blijft leesbaar.
  - **Uitgevoerd:**
    - `src/components/CoinBurst.vue` (nieuw): twaalf gouden blokken met per stuk `--coin-x`, `--coin-y`, `--coin-rotate` en `--coin-delay`, plus één `@keyframes coin-fly` met een boog in twee fasen. Een munt is een blok met een donkere en een lichte inset, zodat hij als schijf leest zonder `border-radius` te gebruiken. `aria-hidden`.
    - De `reward` bepaalt de spreiding over een log schaal met klemmen tussen 1 en 1.8. De projecten leveren 0, 5 miljoen en 500 miljoen munten; zonder klemmen zou de derde explosie het scherm uit vliegen.
    - `src/App.vue`: de explosie staat in een nieuwe `.game-view__effect-layer`, een nulgroot vlak bovenaan de projectenview. Zij staat nadrukkelijk in `GameButton`, want bij het afronden van een project is de knop verdwenen en zou de explosie haar anker kwijt zijn. Omdat de laag geen hoogte hoeft te kennen, klopt ze op elk breakpoint terwijl de aambeeldgrootte per schermbreedte wisselt.
    - Nieuwe functie `celebrateProject(projectId)` met `lastCelebratedProjectId` als idempotentieguard, plus een watcher op `gameState.completedProjects.join(',')`. Die watcher is de betrouwbare route; de `project-complete`-route blijft als tweede ingang bestaan en de guard laat beide samenvallen tot één explosie. Een watcher op een array zou bij elke mutatie van de state afgaan, vandaar de string van ids.
    - Een project met `coinReward` 0 viert niet: `celebrateProject` onthoudt wel het project, maar stopt vóór de explosie.
    - De explosie viert ook **afgeronde smederij-opdrachten**. Een watcher op `gameState.completedOrderCount` roept dezelfde `celebrate(reward)` aan; er is bewust geen `order-complete`-event om op te reageren. De explosielaag staat daarom ook in de smederijview, want daar staat de speler op het moment dat een order af is. Dat een order door de leerling wordt voorgedreven maakt niets uit: de beloning hoort bij het doel, niet bij de klikbron, en `completeOrder` is dezelfde functie.
    - Tests: `App.coinBurst.test.ts` (nieuw, 9 tests) zaait een save die precies één punt voor de grens staat en rondt het project met één echte klik op het aambeeld, dus via de gewone spelroute. Gedekt: geen explosie vóór een voltooiing, één explosie met tien of meer munten, geen explosie bij een project zonder beloning, precies één explosie in de DOM als er een tweede project volgt, geen explosie meer als er geen actief project meer is, de explosie verdwijnt na 900ms, een tweede voltooiing levert een nieuw element, een `completeProject` voor een al voltooid project doet niets, `aria-hidden` op laag én burst, en de timer opgeruimd bij unmount. `CoinBurst.test.ts` (nieuw, 6 tests) dekt de waaier, de richting van de banen, de spreiding per beloning, de klemmen bij een absurd bedrag, de terugval bij een ontbrekende of nul-beloning en de afwezigheid in de a11y-boom.
    - `App.orderCoinBurst.test.ts` (nieuw, 8 tests) doet hetzelfde voor een order: geen explosie tijdens het werken, één explosie bij het afronden, de explosie staat in `#game-panel-smithy` en niet in de projectenview, de betaalde beloning komt overeen met `coinReward` van de order en komt in `--coin-x` terecht, de explosie verdwijnt na 900ms terwijl de nieuwe offers blijven staan, een tweede order levert een nieuw element in plaats van een stapel, na een reset (teller springt terug in plaats van omhoog) viert er niets, en een order die de leerling afrondt viert wél.
    - `docs/visual-style.md` heeft het muntenstuk onder *Tijdelijke effecten*; `AGENTS.md` legt vast dat de explosie de state volgt in plaats van het event, dat een project zonder beloning niet viert, dat de beloning van de order onthouden moet worden omdat `completeOrder` de order wist, en dat de orderteller per order precies één moet opslaan. `docs/game-rules.md` § Visuele feedbackregels zegt dat zowel een project als een order viert.
    - **Controle:** `npm run lint`, `npm run typecheck`, `npm run build` en `npm run test` slagen (346 tests, 39 bestanden). Gemeten via het DevTools-protocol op 320px, 768px en 1440px, telkens zowel met als zonder `prefers-reduced-motion: reduce`: twaalf munten tijdens de explosie en nul erna, de explosielaag heeft gemeten hoogte 0 met `position: absolute` en `pointer-events: none`, en de munten zijn 8px blokken zonder `border-radius`. Geen horizontale overflow op geen enkele breedte. Voor een afgeronde order geldt hetzelfde, gemeten in de smederijview: de explosie staat in `#game-panel-smithy` en niet in de projectenview, de header gaat van "Munten 0" naar "Munten 10" precies tijdens de explosie, en de nieuwe orderoffers staan er al terwijl de explosie nog loopt.
    - **Layoutverschuiving:** de explosie staat in een nulgrote absolute laag, dus hij kan de flow niet raken. Dat is empirisch getoetst door de bovenkant van het paneel te vergelijken terwijl de explosie aanstaat met dezelfde kaart erop en er daarna nogmaals, dus mét en zonder explosie: op alle drie de breedtes en in beide bewegingsinstellingen exact gelijk. Een vergelijking mét en zonder explosie over *verschillende* projecten levert wél een verschil op, omdat de projectkaart van project één korter is dan die van project twee; dat verschil komt dus uit de kaart en niet uit het effect.
  - **Let op:**
    - Het `project-complete`-event komt in de praktijk meestal niet aan, en dat was al zo vóór deze taak. Bij het afronden is het project niet meer het actieve project, dus `ProjectList` vervangt `ProjectTracker` door een gesloten projectkaart en de tracker wordt ontmount vóórdat zijn watcher op `props.progress` kan vuren. Zonder de watcher op `completedProjects` was de explosie dus nooit zichtbaar geweest, hoe goed de rest ook werkte.
    - `lastCelebratedProjectId` kan niet `completedProjectIds.value.includes(projectId)` zijn als guard: het event komt ná het afronden, dus het project staat op dat moment al in `completedProjects` en de explosie zou altijd worden overgeslagen. De eerste versie deed dat wel en sloot elke explosie.
    - Een project zonder beloning viert niet, dus `Herstel het aambeeld` viert nergens met munten. Dat is een keuze en geen vergissing. Het project krijgt wel de omklappende kaart met "Voltooid · 0 munten ontvangen" en daarna het paneel "Alle projecten voltooid", want project twee vraagt 25 miljoen punten en is dus nog niet ontgrendeld.
    - De spreiding gebruikt een log schaal omdat de beloningen drie ordes van grootte verschillen. Een lineaire schaal zou de derde explosie een meter breed maken. De eerste order levert een handvol munten en krijgt daardoor de kleinste spreiding; dat is een vloer in de formule, geen apart geval.
- **De `animation`-shorthand van de munten was ongeldig**, net als die van de vonken: `coin-fly var(--coin-duration, 900ms) var(--transition-medium) var(--coin-delay, 0ms) both` gaf drie tijdswaarden, dus de hele declaratie viel weg en alle twaalf munten stonden stil op één punt. Nu losse `animation-*`-eigenschappen.
- De munten zijn **32px**, vier keer de 8px van de eerste versie, en hun eindpunt ligt omlaag met een zijwaartste spreiding van maximaal 110px. Recht omhoog zou ze achter de vaste topbar terechtkomen, want de explosielaag begint bovenaan de view. Gemeten in beeld: 25511 lichte pixels verspreid over 625 bij 564px, en de gedraaide vierkant heeft een bounding box van 45 tot 47px bij een layoutmaat van 32px. Geen horizontale overflow op 320, 768 of 1440px.
- `activeOrderReward` wordt niet op nul gezet wanneer de order verdwijnt. `completeOrder` maakt `activeOrder` null vóórdat de teller oploopt, dus een watcher die bij een verdwenen order zijn waarde wist, zou de beloning wissen vóór de explosie hem kon gebruiken. Met een niet-resettende ref hangt de uitkomst niet meer van de volgorde van de twee watchers af.
- De orderteller is de idempotentieguard voor orders: `completedOrderCount` loopt per order met precies één op, dus één explosie per afgeronde order zonder bijkomende guard. Springt de teller ooit met meer dan één omhoog, dan viert `App.vue` niets, want dan is het een teruggezette save en is de beloning onbekend.

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

- [x] **T40 — Integreer de visuele effecten en toonprestaties (3 uur)**
  - **Afhankelijk van:** T30, T33–T39.
  - **Levering:** zet pixel-art, blacksmith-achtergrond, strike, vonken, coin-explosie en upgrade-sprites samen in de responsive UI; beperk animaties tot korte, efficiënte effecten en respecteer `prefers-reduced-motion`.
  - **Test/acceptatie:** handmatige controles op 320px, 768px en 1440px tonen geen clipping of flicker; met reduced motion blijven alle visuele aanwijzingen en gameplayfeedback begrijpelijk.
  - **Uitgevoerd:**
    - Deze taak bouwde niets nieuws: T33 tot en met T39 leverden de assets en de effecten al, en T40 is uitgevoerd als verificatie plus één fix. De metingen staan hieronder.
    - `src/components/SparkBurst.vue`: de opacity van een vonk staat nu om **80%** van de keyframe op nul in plaats van pas op 100%. Dat was de enige echte fout die de audit vond.
    - `src/components/SparkBurst.test.ts` (nu 7 tests) bewaakt dat: de test leest de keyframe uit de bron met `?raw` en faalt als de vervaaging wordt teruggezet. Dat is met opzet geverifieerd door de waarde tijdelijk te muteren.
    - `AGENTS.md` legt de 80%-regel vast met de meting erbij, en zegt waarom niet voor een kortere vlucht is gekozen. `docs/visual-style.md` krijgt dezelfde uitleg bij de vonken.
    - **Integratie in één sessie**, gemeten op 320px, 768px en 1440px: project, order, leerling, vonken en munten tegelijk. Twaalf snelle klikken leveren op elk moment maximaal één burst in de DOM op, er is nooit een moment met een opacity van 0 terwijl de burst loopt, en `data-strike-count` komt op 12. Geen horizontale overflow, voor of tijdens de effecten of na scrollen: nul elementen steken buiten het venster. De munten komen op het laagste punt uit op y=230 tot y=316 van een venster van 760 tot 1000px, dus niets komt onder de vouw.
    - **Toonprestaties:** alle keyframes animeren uitsluitend `opacity` en `transform`, dus ze draaien op de compositor en veroorzaken geen layout of paint per frame. Gemeten met een rAF-sampler tijdens de explosies: mediaan 16,7ms, p95 16,7 tot 16,8ms, en **nul** frames boven 20ms of 33ms op alle drie de breedtes. Er staat nergens een `will-change`, wat bij een flits van 231ms ook niet zou moeten.
    - **Reduced motion:** de bursts worden niet gerenderd, maar de feedback blijft begrijpelijk: drie voltooide projectkaarten met hun beloning, de header met score en munten, en de voortgangsbalk. Er verschijnt geen flits.
    - **Clipping, de enige echte bevinding.** Voor de fix raakte de hoogste vonk op 768px 7px en op 1440px 1px achter de vaste bovenbalk, met een opacity van 0,27 en in de laatste 40ms van een bad van 420ms. Op 320px gebeurde dat nooit. Na de fix is de kleinste ruimte 21px, 17px en 15px, met nul overlap op alle drie de breedtes.
  - **Let op:**
    - **Ik had het bijna verkeerd ingeschat, en de meting corrigeerde me.** Mijn eerste berekening voorspelde 30 tot 57px overlap, en de eerste browsersmeting bevestigde dat. Maar die meting telde `elementFromPoint`, en dat slaat elementen met `pointer-events: none` over — dus de hele meting mat het aambeeld in plaats van de vonken. Pas toen ik de hoogste *zichtbare* vonk met zijn opacity erbij ging tellen, bleek dat er maar één vonk van 2px met opacity 0,27 schuurde. Dat had een veel grotere fix verdiend dan het verdiende.
    - De fix is een vroege vervaaging en géén kortere vlucht. De hoogste vonk bereikt de bovenbalk pas bij 86% van zijn vlucht; door de opacity om 80% al op nul te zetten is er daar niets meer te zien. De zichtbare waaier blijft daarmee even groot, wat telt omdat de opdracht eerder was dat het effect te klein oogde. De alternatieve fix — de tabel verkleinen van max 38 naar 28 eenheden — haalde het ook weg, maar verkortte de bad met 26% en zou de klacht over de grootte alleen maar versterkt hebben.
    - Die keuze faalt bovendien veilig: als de koptekst ooit groter wordt, hoeft de vonk nog verder te vliegen om de bovenbalk te bereiken, en is hij dan nog onzichtbaarder. Een vaste pixelgrens zou op een gegeven moment óók de kop in kunnen halen.
    - **Vonken en munten zijn nooit tegelijk zichtbaar, en dat is geen ongeluk.** Bij het afronden van het laatste project verdwijnt de anvilknop omdat er geen actief project meer is, en die knop is de enige drager van de vonken. De munkenexplosie staat daarom in de view-laak en overleeft dat. Mijn eerste auditscript klikte in deze state op een knop die er niet meer was; dat is hoe dit boven water kwam.
    - De leerling schrijft iedere seconde een save van 226 bytes. Dat klinkt als een prestatieprobleem en is er geen: `localStorage.setItem` is synchroon maar het volume is verwaarloosbaar, en T40 gaat over animaties. Er is bewust niets aan veranderd.
    - De rAF-sampler kwam op circa 30 monsters per meting in een headless browser. Dat is te weinig voor een statistiek, maar de mediaan van precies 16,7ms met nul uitschieters zegt genoeg: er zijn geen lange taken.

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
