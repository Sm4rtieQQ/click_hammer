<script setup lang="ts">
import { computed } from 'vue'
import {
  fallbackMaterialPalette,
  getUpgradeById,
  getUpgradePalette,
  getUpgradeSilhouetteUrl,
} from '../sprites/sprites'
import type { MaterialPalette } from '../sprites/sprites'

const props = defineProps<{
  upgradeId: number
  size?: 'small' | 'medium' | 'large'
}>()

const silhouetteUrl = computed(() => getUpgradeSilhouetteUrl(props.upgradeId))
const palette = computed<MaterialPalette>(() =>
  getUpgradePalette(props.upgradeId),
)

const spriteStyle = computed(() => ({
  '--sprite-shape': silhouetteUrl.value === undefined
    ? 'none'
    : `url("${silhouetteUrl.value}")`,
  '--sprite-base': palette.value.base,
  '--sprite-highlight': palette.value.highlight,
  '--sprite-shadow': palette.value.shadow,
}))

const label = computed(() => {
  const upgrade = getUpgradeById(props.upgradeId)

  if (upgrade === undefined) {
    return 'Onbekende upgrade'
  }

  return upgrade.name
})
</script>

<template>
  <span
    v-if="silhouetteUrl !== undefined"
    class="upgrade-sprite"
    :class="`upgrade-sprite--${size ?? 'medium'}`"
    :style="spriteStyle"
    role="img"
    :aria-label="label"
  />
  <span
    v-else
    class="upgrade-sprite upgrade-sprite--unknown"
    :class="`upgrade-sprite--${size ?? 'medium'}`"
    :style="{ '--sprite-base': fallbackMaterialPalette.base }"
    role="img"
    aria-label="Onbekende upgrade"
  />
</template>

<style scoped>
.upgrade-sprite {
  display: inline-block;
  flex: 0 0 auto;
  aspect-ratio: 1;
  background-color: var(--sprite-base);
  background-image: linear-gradient(
    160deg,
    var(--sprite-highlight) 0%,
    var(--sprite-base) 45%,
    var(--sprite-shadow) 100%
  );
  -webkit-mask-image: var(--sprite-shape);
  mask-image: var(--sprite-shape);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  image-rendering: pixelated;
}

.upgrade-sprite--small {
  width: 1.25rem;
}

.upgrade-sprite--medium {
  width: 2rem;
}

.upgrade-sprite--large {
  width: 3rem;
}

.upgrade-sprite--unknown {
  border: 1px dashed rgb(255 255 255 / 30%);
  background-color: transparent;
  background-image: none;
  -webkit-mask-image: none;
  mask-image: none;
}
</style>
