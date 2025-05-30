/**
 * SpeedLimitIndicator.vue
 * 
 * Compact speed limit indicator for MyWaze application.
 * Shows current speed limit in a small box with traffic lights icon.
 * 
 * Features:
 * - Traffic light icon (🚦) with speed limit display
 * - Units displayed (km/h)
 * - Compact design for slick UI
 * - Loading state when fetching speed data
 * 
 * @component SpeedLimitIndicator
 * @author MyWaze Team - MSP 2024/2025 FCT Nova
 */

<template>
  <div class="speed-limit-indicator">
    <div class="indicator-box" :title="tooltipText">
      <div class="traffic-light-icon">🚦</div>
      <div class="speed-info">
        <div class="speed-value">
          {{ speedLimit ? speedLimit : '...' }}
        </div>
        <div class="speed-unit">km/h</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  speedLimit: {
    type: [Number, String],
    default: null
  }
})

// Computed properties
const tooltipText = computed(() => {
  if (props.speedLimit) {
    return `Speed Limit: ${props.speedLimit} km/h`
  } else {
    return 'Speed Limit: Loading...'
  }
})
</script>

<style scoped>
.speed-limit-indicator {
  position: relative;
  z-index: 1000;
}

.indicator-box {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  cursor: default;
  user-select: none;
  min-width: 80px;
}

.indicator-box:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.traffic-light-icon {
  font-size: 16px;
  line-height: 1;
}

.speed-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.speed-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 2px;
}

.speed-unit {
  font-size: 10px;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
}
</style>
