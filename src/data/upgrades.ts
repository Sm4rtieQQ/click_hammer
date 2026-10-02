import type { Upgrade } from '../types/game'

export const upgrades: Upgrade[] = [
  {
    id: 101,
    name: 'Sterkere hamer',
    description: 'Een zwaardere hamer geeft meer kracht bij elke klap.',
    baseCost: 10,
    costMultiplier: 1.5,
    clickBonus: 10,
  },
  {
    id: 102,
    name: 'Geborgen hout',
    description: 'Een stevig handvat van geborgen hout verbetert de controle en kracht van elke klap.',
    baseCost: 20,
    costMultiplier: 1.6,
    clickBonus: 15,
  },
  {
    id: 103,
    name: 'Vuur van de meester',
    description: 'Het meestervuur laat de hamer nog harder aankomen.',
    baseCost: 40,
    costMultiplier: 1.75,
    clickBonus: 25,
  },
  {
    id: 104,
    name: 'Leerling',
    description:
      'Een leerling die voor je op de actieve order slaat: 10% van je clickkracht per seconde. Aan projecten helpt hij niet mee.',
    baseCost: 50,
    costMultiplier: 1.5,
    clickBonus: 0,
    autoClickerUnlocker: true,
    maxPurchases: 1,
  },
  {
    id: 105,
    name: 'Ontwikkelaarskracht',
    description: 'Alleen beschikbaar tijdens development en tests.',
    baseCost: 1,
    costMultiplier: 1.5,
    clickBonus: 2000,
    devOnly: true,
  },
]
