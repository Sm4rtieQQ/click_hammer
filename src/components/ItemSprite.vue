<script setup lang="ts">
import { computed } from 'vue'
import {
  fallbackMaterialPalette,
  getItemById,
  getItemSilhouetteUrl,
  getMaterialById,
  getMaterialPalette,
} from '../sprites/sprites'
import type { MaterialPalette } from '../sprites/sprites'

const props = defineProps<{
  itemId: number
  materialId: number
  size?: 'small' | 'medium' | 'large'
}>()

const silhouetteUrl = computed(() => getItemSilhouetteUrl(props.itemId))
const palette = computed<MaterialPalette>(() =>
  getMaterialPalette(props.materialId),
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
  const item = getItemById(props.itemId)
  const material = getMaterialById(props.materialId)

  if (item === undefined || material === undefined) {
    return 'Onbekend voorwerp'
  }

  return `${material.name} ${item.name}`
})
</script>

<template>
  <span
    v-if="silhouetteUrl !== undefined"
    class="item-sprite"
    :class="`item-sprite--${size ?? 'medium'}`"
    :style="spriteStyle"
    role="img"
    :aria-label="label"
  />
  <span
    v-else
    class="item-sprite item-sprite--unknown"
    :class="`item-sprite--${size ?? 'medium'}`"
    :style="{ '--sprite-base': fallbackMaterialPalette.base }"
    role="img"
    aria-label="Onbekend voorwerp"
  />
</template>

<style scoped>
.item-sprite {
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

.item-sprite--small {
  width: 1.25rem;
}

.item-sprite--medium {
  width: 2rem;
}

.item-sprite--large {
  width: 3rem;
}

.item-sprite--unknown {
  border: 1px dashed rgb(255 255 255 / 30%);
  background-color: transparent;
  background-image: none;
  -webkit-mask-image: none;
  mask-image: none;
}
</style>