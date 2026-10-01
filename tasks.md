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

- [ ] **T28 — Voeg lege, laden- en foutstates toe (2 uur)**
  - **Afhankelijk van:** T18, T24, T26.
  - **Levering:** duidelijke states voor initialisatie, geen projecten, geen beschikbare upgrades en niet-betaalbare aankopen zonder layoutverschuivingen.
  - **Test/acceptatie:** iedere state is zichtbaar en voorkomt dat de gebruiker een onmogelijke actie kan uitvoeren.

- [ ] **T29 — Verbeter toetsenbord- en schermlezertoegang (2 uur)**
  - **Afhankelijk van:** T23, T24, T25, T28.
  - **Levering:** labels, focusvolgorde, `aria-live` voor punten/munten, duidelijke disabled-statussen en voldoende contrast.
  - **Test/acceptatie:** alle interacties zijn uitsluitend met keyboard te bedienen; een screenreader-/accessibility-check meldt geen kritieke fouten.

- [ ] **T30 — Voeg responsive en visuele feedback af (3 uur)**
  - **Afhankelijk van:** T22–T28.
  - **Levering:** consistente kaartlayout, responsive winkel en projectweergave, click-feedback en focus/hover/active states op desktop en mobiel.
  - **Test/acceptatie:** handmatige controles op 320px, 768px en 1440px; de primaire click- en buy-acties blijven zichtbaar en goed bruikbaar.

- [ ] **T31 — Test een volledige projectsessie end-to-end (3 uur)**
  - **Afhankelijk van:** T27, T28, T29.
  - **Levering:** een geautomatiseerde of reproduceerbare testscriptflow: clicks op Projecten, `Herstel het aambeeld` zonder munten voltooien, een order kiezen en een tweede order voltooien.
  - **Test/acceptatie:** de flow eindigt met correcte `points`, `coins`, `projectProgress` en `completedProjects`; de reward wordt niet dubbel toegekend.

- [ ] **T32 — Test een volledige upgradesessie end-to-end (3 uur)**
  - **Afhankelijk van:** T27, T28, T29.
  - **Levering:** een flow van een voltooide order met munten naar eerste upgradeaankoop, herberekende kost, tweede aankoop en verhoogde `clickPower` volgens de productformule.
  - **Test/acceptatie:** de flow toont nooit een negatieve coinbalans; de derde catalogusprijs volgt exact de AGENTS-formule.

## Fase 7 — Pixel-art en visuele feedback

- [ ] **T33 — Definieer de pixel-artstijl en assetpipeline (2 uur)**
  - **Afhankelijk van:** T05, T08, T09.
  - **Levering:** een korte `docs/visual-style.md` met charmante pixel-artrichtlijnen, palet, spritegrid, schaalregels, assetformaten en een besluit over bronbestanden versus CSS/SVG.
  - **Test/acceptatie:** maak een voorbeeldsprite en controleer die op 1x, 2x en 4x; pixelranden blijven scherp, kleuren blijven consistent en smoothing is uitgeschakeld.

- [ ] **T34 — Maak de pixel-artachtergrond van een middeleeuwse smidse (3 uur)**
  - **Afhankelijk van:** T33.
  - **Levering:** een achtergrond met een herkenbare medieval blacksmith-setting: smidse, aambeeld, vuur/forge, houten structuren en warm licht, zonder de leesbaarheid van de UI te ondermijnen.
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

- [ ] **T39 — Maak passende sprites voor upgrades (4 uur)**
  - **Afhankelijk van:** T09, T25, T33.
  - **Levering:** minimaal één herkenbare pixel-art sprite per upgrade, gekoppeld aan het `id` van de upgrade en passend bij de beschrijving en de percentagebonus `clickBonus`; voeg hover/focus/disabled varianten toe waar zinvol.
  - **Test/acceptatie:** een catalogustest controleert dat elke upgrade een sprite heeft, alle bestanden laden zonder fouten en de upgrade op desktop en mobiel herkenbaar blijft.

- [ ] **T40 — Integreer de visuele effecten en toonprestaties (3 uur)**
  - **Afhankelijk van:** T30, T33–T39.
  - **Levering:** zet pixel-art, blacksmith-achtergrond, strike, vonken, coin-explosie en upgrade-sprites samen in de responsive UI; beperk animaties tot korte, efficiënte effecten en respecteer `prefers-reduced-motion`.
  - **Test/acceptatie:** handmatige controles op 320px, 768px en 1440px tonen geen clipping of flicker; met reduced motion blijven alle visuele aanwijzingen en gameplayfeedback begrijpelijk.

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
- Het projecttabblad toont alleen voltooide projecten en het volgende project; de smidse toont orders zonder vereiste puntkosten.
- Alle stijlen en sprites vormen een charmante pixel-artstijl en de achtergrond heeft een middeleeuwse-smithsfeer.
- Alleen handmatige clicks laten de hamer het aambeeld raken en vonken veroorzaken; automatische clicks veroorzaken geen hamerklap.
- Projectvoltooiing veroorzaakt een confetti-achtige explosie van gouden munten vanuit het aambeeld en upgrades hebben passende sprites.
- De UI op mobiel en desktop bruikbaar en toegankelijk is.
