<template>
  <div class="leaflet-container">
    <l-map
      ref="mapRef"
      v-model:zoom="zoom"
      :center="center"
      :options="mapOptions"
      @click="handleMapClick"
      style="width: 100%; height: 100%"
    >
      <l-tile-layer
        :url="mapTileUrl"
        :attribution="attribution"
      />
      
      <!-- User Position Marker -->
      <l-marker :lat-lng="center" :icon="carIcon">
        <l-tooltip>Your position</l-tooltip>
      </l-marker>
      
      <!-- Destination Markers -->
      <l-marker 
        v-for="(marker, index) in markers" 
        :key="index" 
        :lat-lng="marker"
        :icon="destinationIcon"
      >
        <l-tooltip>Destination</l-tooltip>
      </l-marker>
      
      <!-- Waypoint Markers -->
      <l-marker 
        v-for="(waypoint, index) in sortedWaypoints" 
        :key="`waypoint-${waypoint.id}`" 
        :lat-lng="{ lat: waypoint.lat, lng: waypoint.lng }"
        :icon="getWaypointIcon(index + 1)"
      >
        <l-tooltip>{{ waypoint.name }}</l-tooltip>
      </l-marker>
      
      <!-- Charging Station Markers -->
      <l-marker
        v-if="showChargingStations"
        v-for="station in chargingStations"
        :key="`charging-station-${station.id}`"
        :lat-lng="{ lat: station.lat, lng: station.lng }"
        :icon="getChargingStationIcon(station)"
      >
        <l-tooltip>
          <div class="charging-station-tooltip">
            <div class="station-name">{{ station.name }}</div>
            <div class="station-info">
              <div class="station-brand">{{ station.brand || 'Unknown' }}</div>
              <div class="station-status" :class="{ 'available': station.isAvailable, 'unavailable': !station.isAvailable }">
                {{ station.isAvailable ? 'Available' : 'Unavailable' }}
              </div>
              <div class="station-connectors">
                {{ station.availableConnectors }}/{{ station.totalConnectors }} connectors
              </div>
              <div class="station-speed">{{ station.chargingSpeed }}</div>
            </div>
          </div>
        </l-tooltip>
      </l-marker>

      <!-- Other Users Markers -->
      <l-marker
        v-if="showOtherUsers"
        v-for="user in connectedUsers"
        :key="`user-${user.id}`"
        :lat-lng="{ lat: user.position.lat, lng: user.position.lng }"
        :icon="getUserIcon(user)"
      >
        <l-tooltip>
          <div class="user-tooltip">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-info">
              <div class="user-last-seen">
                Last seen: {{ formatLastSeen(user.lastSeen) }}
              </div>
              <div class="user-accuracy" v-if="user.position.accuracy">
                Accuracy: ±{{ Math.round(user.position.accuracy) }}m
              </div>
            </div>
          </div>
        </l-tooltip>
      </l-marker>

      <!-- Speed Trap Markers -->
      <l-marker
        v-if="showSpeedTraps"
        v-for="speedTrap in speedTraps"
        :key="`speed-trap-${speedTrap.id}`"
        :lat-lng="{ lat: speedTrap.lat, lng: speedTrap.lng }"
        :icon="getSpeedTrapIcon(speedTrap)"
        @click="() => $emit('speed-trap-click', speedTrap)"
      >
        <l-tooltip>
          <div class="speed-trap-tooltip">
            <div class="trap-header">🚨 Speed Trap</div>
            <div class="trap-info">
              <div class="trap-added-by">Added by: {{ speedTrap.addedBy || 'Anonymous' }}</div>
              <div class="trap-added-at">
                {{ formatSpeedTrapDate(speedTrap.addedAt) }}
              </div>
              <div class="trap-reports">
                Reports: {{ speedTrap.reports || 0 }}
              </div>
              <div v-if="speedTrap.verified" class="trap-verified">
                ✅ Verified
              </div>
            </div>
          </div>
        </l-tooltip>
      </l-marker>
      
      <!-- Route Path -->
      <l-polyline
        v-if="routePath && routePath.length > 0"
        :lat-lngs="routePath"
        :color="routeColor"
        :weight="routeWeight"
        :opacity="0.8"
      />
    </l-map>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { LMap, LTileLayer, LMarker, LPolyline, LTooltip } from '@vue-leaflet/vue-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Props and emits
const props = defineProps({
  initialCenter: {
    type: Object,
    default: () => ({ lat: 38.72936883885257, lng: -9.15282508593812 }) // Default to Lisbon
  },
  markers: {
    type: Array,
    default: () => []
  },
  routePath: {
    type: Array,
    default: () => []
  },
  waypoints: {
    type: Array,
    default: () => []
  },
  isAddingWaypoints: {
    type: Boolean,
    default: false
  },
  chargingStations: {
    type: Array,
    default: () => []
  },
  showChargingStations: {
    type: Boolean,
    default: true
  },
  connectedUsers: {
    type: Array,
    default: () => []
  },
  showOtherUsers: {
    type: Boolean,
    default: true
  },
  speedTraps: {
    type: Array,
    default: () => []
  },
  showSpeedTraps: {
    type: Boolean,
    default: true
  }
});

// Add watcher to debug route path changes
import { watch } from 'vue';

watch(() => props.routePath, (newPath) => {
  console.log('LeafletMap received route path:', newPath);
  console.log('Route path length:', newPath ? newPath.length : 0);
}, { immediate: true });

const emit = defineEmits(['update:center', 'click', 'speed-trap-click']);

// Map state
const mapRef = ref(null);
const zoom = ref(15);
const center = computed({
  get: () => props.initialCenter,
  set: (value) => emit('update:center', value)
});

// Speed trap icon
const speedTrapIcon = computed(() => {
  return L.divIcon({
    html: '🚨',
    className: 'speed-trap-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
});

// Generate speed trap icon with status
const getSpeedTrapIcon = (speedTrap) => {
  const isVerified = speedTrap.verified || (speedTrap.reports && speedTrap.reports >= 3);
  const color = isVerified ? '#dc3545' : '#ffc107'; // Red for verified, orange for unverified
  const bgColor = isVerified ? '#f8d7da' : '#fff3cd';
  
  return L.divIcon({
    html: `
      <div class="speed-trap-marker-icon" style="background-color: ${bgColor}; border-color: ${color}">
        <span style="color: ${color}">🚨</span>
        ${isVerified ? '<div class="verified-badge">✓</div>' : ''}
      </div>
    `,
    className: 'speed-trap-marker-container',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// Car icon
const carIcon = computed(() => {
  return L.divIcon({
    html: '🚗',
    className: 'car-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
});

// Destination icon
const destinationIcon = computed(() => {
  return L.divIcon({
    html: '🎯',
    className: 'destination-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
});

// Charging station icon
const chargingStationIcon = computed(() => {
  return L.divIcon({
    html: '⚡',
    className: 'charging-station-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
});

// Generate waypoint icon with number
const getWaypointIcon = (number) => {
  return L.divIcon({
    html: `<div class="waypoint-marker-icon">${number}</div>`,
    className: 'waypoint-marker-container',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// Generate charging station icon with availability status
const getChargingStationIcon = (station) => {
  const isAvailable = station.isAvailable;
  const color = isAvailable ? '#28a745' : '#dc3545'; // Green for available, red for unavailable
  const bgColor = isAvailable ? '#d4edda' : '#f8d7da';
  
  return L.divIcon({
    html: `
      <div class="charging-station-marker-icon" style="background-color: ${bgColor}; border-color: ${color}">
        <span style="color: ${color}">⚡</span>
      </div>
    `,
    className: 'charging-station-marker-container',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// User icon
const userIcon = computed(() => {
  return L.divIcon({
    html: '👤',
    className: 'user-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
});

// Generate user icon with status
const getUserIcon = (user) => {
  const isRecent = user.lastSeen && (Date.now() - user.lastSeen) < 30000; // Online if last seen within 30 seconds
  const userColors = [
    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', 
    '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8'
  ];
  
  // Generate consistent color based on user ID
  const colorIndex = user.id ? parseInt(user.id.slice(-1), 16) % userColors.length : 0;
  const color = userColors[colorIndex];
  const opacity = isRecent ? '1.0' : '0.6';
  
  return L.divIcon({
    html: `
      <div class="user-marker-icon" style="color: ${color}; opacity: ${opacity}; filter: ${!isRecent ? 'grayscale(50%)' : 'none'}">
        👤
        <div class="user-status-indicator" style="background-color: ${isRecent ? '#28a745' : '#6c757d'}"></div>
      </div>
    `,
    className: 'user-marker-container',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// Format last seen time
const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 10000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

// Format speed trap date
const formatSpeedTrapDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

// Sort waypoints in ascending order based on their order property
const sortedWaypoints = computed(() => {
  const sorted = [...props.waypoints].sort((a, b) => a.order - b.order);
  console.log('🗺️ LeafletMap received waypoints:', props.waypoints);
  console.log('🗺️ LeafletMap sorted waypoints:', sorted);
  return sorted;
});

// Dynamic route color based on whether waypoints are being added
const routeColor = computed(() => {
  return props.isAddingWaypoints ? '#fd7e14' : '#4285F4';
});

// Dynamic route weight based on the number of waypoints
const routeWeight = computed(() => {
  return props.waypoints.length > 0 ? 6 : 5;
});

// Map options
const mapOptions = {
  zoomControl: true,
  attributionControl: true
};

// Map tile provider (OpenStreetMap)
const mapTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Handle map click events
const handleMapClick = (event) => {
  emit('click', { 
    lat: event.latlng.lat, 
    lng: event.latlng.lng 
  });
};

// Lifecycle hooks
onMounted(() => {
  // You can add initialization logic here if needed
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style>
.leaflet-container {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.car-marker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.destination-marker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.charging-station-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #4caf50; /* Green color for charging stations */
}

.user-marker-container {
  position: relative;
}

.user-marker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: 2px solid currentColor;
  font-size: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.user-marker-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.user-status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid white;
}

.waypoint-marker-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.waypoint-marker-icon {
  width: 26px;
  height: 26px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Waypoint hover effect */
.waypoint-marker-container:hover .waypoint-marker-icon {
  background: #5a6fd8;
  transform: scale(1.1);
  transition: all 0.2s ease;
}

/* Charging Station Markers */
.charging-station-marker-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.charging-station-marker-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

/* Charging station hover effect */
.charging-station-marker-container:hover .charging-station-marker-icon {
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Charging Station Tooltip Styles */
.charging-station-tooltip {
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
}

.station-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}

.station-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.station-brand {
  color: #666;
  font-size: 11px;
}

.station-status {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  text-align: center;
}

.station-status.available {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.station-status.unavailable {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.station-connectors {
  color: #666;
  font-size: 11px;
}

.station-speed {
  color: #007bff;
  font-size: 11px;
  font-weight: 600;
}

/* User Tooltip Styles */
.user-tooltip {
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
}

.user-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-last-seen {
  color: #666;
  font-size: 11px;
}

.user-accuracy {
  color: #007bff;
  font-size: 11px;
  font-weight: 600;
}

/* Speed Trap Markers */
.speed-trap-marker-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.speed-trap-marker-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  position: relative;
}

.speed-trap-marker-container:hover .speed-trap-marker-icon {
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.verified-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  background-color: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  border: 1px solid white;
}

/* Speed Trap Tooltip Styles */
.speed-trap-tooltip {
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
}

.trap-header {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #dc3545;
  text-align: center;
}

.trap-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trap-added-by {
  color: #666;
  font-size: 11px;
}

.trap-added-at {
  color: #666;
  font-size: 11px;
}

.trap-reports {
  color: #007bff;
  font-size: 11px;
  font-weight: 600;
}

.trap-verified {
  color: #28a745;
  font-size: 11px;
  font-weight: 600;
}
</style>
