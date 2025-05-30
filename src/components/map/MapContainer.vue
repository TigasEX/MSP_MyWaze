<template>
  <div class="map-container">
    <!-- Leaflet Map Component -->
    <LeafletMap
      ref="mapRef"
      :initial-center="store.currentPosition"
      :markers="store.markers"
      :route-path="store.routeData.path"
      :waypoints="store.routePlanning.waypoints"
      :is-adding-waypoints="store.routePlanning.isAddingWaypoints"
      :charging-stations="store.chargingStations"
      :show-charging-stations="store.showChargingStations"
      :connected-users="store.locationSharing.connectedUsers"
      :show-other-users="store.locationSharing.showOtherUsers"
      @update:center="handleCenterUpdate"
      @click="addMarker"
    />

    <!-- Map Controls Section -->
    <div class="map-controls">
      <!-- Center Map Button -->
      <button @click="centerMap" class="control-button center-btn">
        <span class="mr-2">📍</span> Center Map
      </button>

      <!-- User Instructions -->
      <div class="instructions-block" :class="{ 'waypoint-mode': store.routePlanning.isAddingWaypoints }">
        <p v-if="store.routePlanning.isAddingWaypoints">
          <span class="instruction-icon">📍</span> Click on the map to add waypoints
        </p>
        <p v-else>
          <span class="instruction-icon">🖱️</span> Click on the map to set your destination
        </p>
      </div>
    </div>

    <!-- Compact UI Indicators -->
    <div class="compact-indicators">
      <!-- Location Sharing Indicator -->
      <LocationSharingIndicator
        :is-connected="store.locationSharing.isConnected"
        :current-user="store.locationSharing.currentUser"
        :connected-users="store.locationSharing.connectedUsers"
        :error-message="locationSharingError"
        @reconnect="reconnectLocationSharing"
      />

      <!-- Speed Limit Indicator -->
      <SpeedLimitIndicator
        :speed-limit="store.speedLimit"
      />

      <!-- Charging Stations Indicator -->
      <ChargingStationsIndicator
        :station-count="store.chargingStations.length"
        :available-count="availableStationsCount"
        :api-status="store.chargingStationApiStatus"
        :is-loading="isLoadingChargingStations"
        :show-stations="store.showChargingStations"
        @reload-stations="loadNearbyChargingStations"
      />
    </div>

    <!-- Information Panels -->
    <div class="info-panels">

      <!-- Enhanced Route Planning Panel (conditional) -->
      <div v-if="store.routeData.details || store.routePlanning.waypoints.length > 0 || store.markers.length > 0 || store.routePlanning.isAddingWaypoints" class="info-panel route-panel enhanced-route-panel">
        <div class="route-panel-content">
          <!-- Panel Header -->
          <div class="route-panel-header">
            <div class="info-icon">🗺️</div>
            <div class="route-title">
              <div class="info-label">
                {{ store.routePlanning.waypoints.length > 0 ? 'Route Planning' : 'Route Details' }}
              </div>
              <!-- Route Statistics -->
              <div v-if="store.routeData.details" class="route-stats">
                <div class="info-value">{{ (store.routeData.details.distance / 1000).toFixed(1) }} km</div>
                <div class="info-value">{{ Math.round(store.routeData.details.duration / 60) }} min</div>
              </div>
            </div>
          </div>

          <!-- Waypoint Mode Instructions -->
          <div v-if="store.routePlanning.isAddingWaypoints" class="waypoint-instructions">
            <p>🖱️ Click on the map to add waypoints</p>
          </div>

          <!-- Waypoints List -->
          <div v-if="store.routePlanning.waypoints.length > 0" class="waypoints-section">
            <div class="waypoints-header">
              <span class="waypoints-label">Waypoints ({{ store.routePlanning.waypoints.length }})</span>
            </div>
            
            <div class="waypoints-list">
              <div 
                v-for="(waypoint, index) in store.routePlanning.waypoints" 
                :key="waypoint.id"
                class="waypoint-item"
              >
                <div class="waypoint-number">{{ index + 1 }}</div>
                <div class="waypoint-info">
                  <div class="waypoint-name">{{ waypoint.name }}</div>
                  <div class="waypoint-coords">
                    {{ waypoint.lat.toFixed(4) }}, {{ waypoint.lng.toFixed(4) }}
                  </div>
                </div>
                <div class="waypoint-controls">
                  <!-- Reorder buttons -->
                  <button 
                    v-if="index > 0" 
                    @click="moveWaypointUp(waypoint.id)"
                    class="waypoint-btn move-btn"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button 
                    v-if="index < store.routePlanning.waypoints.length - 1" 
                    @click="moveWaypointDown(waypoint.id)"
                    class="waypoint-btn move-btn"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <!-- Remove button -->
                  <button 
                    @click="removeWaypoint(waypoint.id)"
                    class="waypoint-btn remove-btn"
                    title="Remove waypoint"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="route-actions">
            <!-- Waypoint Mode Toggle -->
            <button 
              v-if="!store.routePlanning.isAddingWaypoints"
              @click="startWaypointMode"
              class="action-btn waypoint-btn-primary"
            >
              <span class="mr-1">📍</span> Add More Waypoints
            </button>
            
            <button 
              v-if="store.routePlanning.isAddingWaypoints"
              @click="stopWaypointMode"
              class="action-btn waypoint-btn-secondary"
            >
              <span class="mr-1">✅</span> Done Adding Waypoints
            </button>

            <!-- Calculate Multi-Waypoint Route -->
            <button 
              v-if="store.routePlanning.waypoints.length >= 2 && !store.routePlanning.isAddingWaypoints"
              @click="calculateMultiWaypointRoute"
              class="action-btn calculate-btn"
            >
              <span class="mr-1">🧭</span> Calculate Route
            </button>

            <!-- Save Route Button -->
            <button 
              v-if="store.routePlanning.waypoints.length >= 1 && store.routeData.details && !store.routePlanning.isAddingWaypoints"
              @click="openSaveRouteModal"
              class="action-btn save-route-btn"
            >
              <span class="mr-1">💾</span> Save Route
            </button>

            <!-- Clear All / Cancel Route -->
            <button 
              @click="clearRouteAndWaypoints"
              class="action-btn cancel-btn"
            >
              <span class="mr-1">❌</span> 
              {{ store.routePlanning.waypoints.length > 0 ? 'Clear All' : 'Cancel Route' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!--
  MapContainer.vue - Main Map Interface Component
  
  This is the core component of the MyWaze application that orchestrates all map-related
  functionality including navigation, location sharing, charging stations, and user interaction.
  
  Key Features:
  - Interactive Leaflet map with custom controls
  - Real-time location sharing between users
  - EV charging station discovery and display
  - Speed limit monitoring and warnings
  - Route planning with waypoint support
  - Responsive UI with collapsible panels
  
  Dependencies:
  - LeafletMap: Core mapping component
  - LocationSharingPanel: Real-time user location sharing UI
  - Various services for routing, location, charging stations
  
  State Management:
  - Uses global Vuex store for shared state
  - Manages local component state for UI interactions
  - Handles service integrations and error states
  
  @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
-->

<script setup>
import { ref, onMounted, computed } from 'vue'
import LeafletMap from '@/LeafletMap.vue'
import LocationSharingPanel from './LocationSharingPanel.vue'
import LocationSharingIndicator from './LocationSharingIndicator.vue'
import SpeedLimitIndicator from './SpeedLimitIndicator.vue'
import ChargingStationsIndicator from './ChargingStationsIndicator.vue'
import routingService from '@/services/RoutingService.js'
import speedLimitService from '@/services/SpeedLimitService.js'
import { ChargingStationService } from '@/services/ChargingStationService.js'
import { userLocationSharingService } from '@/services/UserLocationSharingService.js'
import { GeolocationService } from '@/services/GeolocationService.js'
import { store } from '@/store'

/**
 * ===== COMPONENT STATE AND REFS =====
 */

// Map component reference
const mapRef = ref(null)

// Charging station service instance
const chargingStationService = new ChargingStationService()

// Geolocation service instance
const geolocationService = new GeolocationService()

// Charging station loading state
const isLoadingChargingStations = ref(false)

// Speed limit optimization variables
const lastSpeedLimitPosition = ref({ lat: 0, lng: 0 })
const speedLimitThreshold = 0.0005 // About 50 meters in decimal degrees
const speedLimitRequestTimestamp = ref(0)
const speedLimitRequestMinInterval = 1000 // Minimum time between requests in milliseconds

// Location sharing state
const locationSharingError = ref(null)
const locationWatchId = ref(null)

/**
 * ===== Computed Properties =====
 */

// Count of available charging stations
const availableStationsCount = computed(() => {
  return store.chargingStations.filter(station => station.isAvailable).length
})

/**
 * ===== Charging Station Functions =====
 */

// Toggle charging stations display
const toggleChargingStationsDisplay = () => {
  store.toggleChargingStations()
}

// Refresh charging station availability
const refreshChargingStations = async () => {
  if (isLoadingChargingStations.value) return
  
  isLoadingChargingStations.value = true
  try {
    await store.refreshChargingStationAvailability(chargingStationService)
  } catch (error) {
    console.error('Error refreshing charging stations:', error)
    // You could add a toast notification here
  } finally {
    isLoadingChargingStations.value = false
  }
}

// Load nearby charging stations
const loadNearbyChargingStations = async () => {
  if (isLoadingChargingStations.value) return
  
  isLoadingChargingStations.value = true
  try {
    await store.fetchChargingStations(chargingStationService)
  } catch (error) {
    console.error('Error loading nearby charging stations:', error)
    // You could add a toast notification here
  } finally {
    isLoadingChargingStations.value = false
  }
}

// Load charging stations along route (called automatically when route is calculated)
const loadChargingStationsAlongRoute = async () => {
  if (!store.routeData.path || store.routeData.path.length === 0) {
    return
  }
  
  try {
    console.log('🛣️ Loading charging stations along route...')
    await store.fetchChargingStationsAlongRoute(chargingStationService, store.routeData.path)
  } catch (error) {
    console.error('Error loading charging stations along route:', error)
  }
}

// Charging station position tracking
const lastChargingStationPosition = ref({ lat: 0, lng: 0 })
const chargingStationThreshold = 0.01 // About 1km in decimal degrees

/**
 * ===== Map Functions =====
 */

// Handle center update from map
const handleCenterUpdate = (newCenter) => {
  store.updatePosition(newCenter)
  
  // Auto-refresh charging stations when position changes significantly
  if (store.showChargingStations) {
    const distance = Math.sqrt(
      Math.pow(newCenter.lat - lastChargingStationPosition.value.lat, 2) + 
      Math.pow(newCenter.lng - lastChargingStationPosition.value.lng, 2)
    )
    
    if (distance > chargingStationThreshold) {
      loadNearbyChargingStations()
      lastChargingStationPosition.value = { ...newCenter }
    }
  }
}

// Add marker to map (unified waypoint approach)
const addMarker = async (event) => {
  try {
    console.log(`Adding marker at (${event.lat}, ${event.lng})...`)
    
    // Check if we're in waypoint mode
    if (store.routePlanning.isAddingWaypoints) {
      await addWaypoint(event)
      return
    }
    
    // For destinations, treat them as waypoints for unified routing
    console.log('🎯 Adding destination as waypoint with road snapping...')
    const snappedLocation = await routingService.snapToRoad({ 
      lat: event.lat, 
      lng: event.lng 
    })
    
    // Calculate distance moved by snapping
    const snapDistance = routingService.calculateDistance(
      { lat: event.lat, lng: event.lng },
      snappedLocation
    )
    
    console.log(`📍 Destination waypoint placed:`)
    console.log(`  Original: (${event.lat.toFixed(6)}, ${event.lng.toFixed(6)})`)
    console.log(`  Snapped:  (${snappedLocation.lat.toFixed(6)}, ${snappedLocation.lng.toFixed(6)})`)
    console.log(`  Moved:    ${(snapDistance * 1000).toFixed(1)}m`)
    
    // Add destination as waypoint and clear any existing markers/waypoints
    store.clearMarkers()
    const waypoint = store.addDestinationAsWaypoint({
      lat: snappedLocation.lat,
      lng: snappedLocation.lng
    })
    
    console.log('🎯 Created destination waypoint:', waypoint)
    console.log('📊 Current waypoints in store:', store.routePlanning.waypoints)
    
    // Add marker for visualization
    store.addMarker({
      lat: snappedLocation.lat,
      lng: snappedLocation.lng,
      id: waypoint.id
    })
    
    console.log('📍 Current markers in store:', store.markers)
    
    // Calculate route using the unified waypoint approach
    await calculateWaypointRoute()
  } catch (error) {
    console.error('Error adding destination waypoint:', error)
     
    // If road snapping fails, use the original clicked position
    console.log(`⚠️ Using original position (${event.lat}, ${event.lng}) due to snapping error`)
    
    // Add destination as waypoint using original coordinates
    store.clearMarkers()
    const waypoint = store.addDestinationAsWaypoint({
      lat: event.lat,
      lng: event.lng
    })
    
    // Add marker for visualization
    store.addMarker({
      lat: event.lat,
      lng: event.lng,
      id: waypoint.id
    })
    
    // Still try to calculate the route
    await calculateWaypointRoute()
  }
}

// Legacy route calculation function - now redirects to unified waypoint approach
const calculateRoute = async (start, destination) => {
  console.log('⚠️ Using legacy calculateRoute - redirecting to unified waypoint approach')
  console.log('   Start:', start)
  console.log('   Destination:', destination)
  
  // Since destinations are now treated as waypoints, redirect to unified approach
  await calculateWaypointRoute()
}

// Remove current route
const removeRoute = () => {
  store.clearRoute()
}

/**
 * ===== Waypoint Management Functions =====
 */

// Add a waypoint during waypoint mode
const addWaypoint = async (event) => {
  try {
    console.log(`🛤️ Adding waypoint at (${event.lat}, ${event.lng})...`)
    
    // Snap waypoint to nearest road
    const snappedLocation = await routingService.snapToRoad({ 
      lat: event.lat, 
      lng: event.lng 
    })
    
    const waypoint = {
      lat: snappedLocation.lat,
      lng: snappedLocation.lng,
      name: `Waypoint ${store.routePlanning.waypoints.length + 1}`
    }
    
    // Calculate distance moved by snapping
    const snapDistance = routingService.calculateDistance(
      { lat: event.lat, lng: event.lng },
      snappedLocation
    )
    
    console.log(`📍 Waypoint created:`)
    console.log(`  Name:     ${waypoint.name}`)
    console.log(`  Original: (${event.lat.toFixed(6)}, ${event.lng.toFixed(6)})`)
    console.log(`  Snapped:  (${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)})`)
    console.log(`  Moved:    ${(snapDistance * 1000).toFixed(1)}m`)
    
    store.addWaypoint(waypoint)
    
    console.log('✅ Waypoint added to store')
    console.log('📊 Current waypoints in store:', store.routePlanning.waypoints)
    console.log('📊 Current waypoint mode:', store.routePlanning.isAddingWaypoints)
    
    // Show appropriate success toast
    if (snapDistance > 0.001) { // Moved more than ~1m
      store.addToast({
        title: '📍 Waypoint Added',
        message: `${waypoint.name} snapped to road (${(snapDistance * 1000).toFixed(0)}m away)`,
        type: 'success',
        duration: 2500
      })
    } else {
      store.addToast({
        title: '📍 Waypoint Added',
        message: `${waypoint.name} placed on road`,
        type: 'success',
        duration: 2000
      })
    }
    
  } catch (error) {
    console.error('Error adding waypoint:', error)
    
    // If road snapping fails, use the original clicked position
    const waypoint = {
      lat: event.lat,
      lng: event.lng,
      name: `Waypoint ${store.routePlanning.waypoints.length + 1}`
    }
    
    console.log(`⚠️ Adding waypoint without snapping: ${waypoint.name}`)
    store.addWaypoint(waypoint)
    
    store.addToast({
      title: '📍 Waypoint Added',
      message: `${waypoint.name} placed at clicked location (no road snapping)`,
      type: 'warning',
      duration: 3000
    })
  }
}

// Start waypoint addition mode
const startWaypointMode = () => {
  console.log('Starting waypoint mode...')
  store.startWaypointMode()
  
  store.addToast({
    title: '📍 Waypoint Mode',
    message: 'Click on the map to add waypoints',
    type: 'info',
    duration: 3000
  })
}

// Stop waypoint addition mode
const stopWaypointMode = () => {
  console.log('Stopping waypoint mode...')
  store.stopWaypointMode()
  
  store.addToast({
    title: '✅ Waypoint Mode Complete',
    message: `${store.routePlanning.waypoints.length} waypoints ready`,
    type: 'success',
    duration: 2000
  })
}

// Remove a specific waypoint
const removeWaypoint = (waypointId) => {
  console.log(`Removing waypoint ${waypointId}...`)
  store.removeWaypoint(waypointId)
  
  store.addToast({
    title: '🗑️ Waypoint Removed',
    message: 'Waypoint removed from route',
    type: 'info',
    duration: 2000
  })
  
  // Recalculate route if we have enough waypoints
  if (store.routePlanning.waypoints.length >= 2) {
    calculateMultiWaypointRoute()
  } else {
    // Clear route if less than 2 waypoints
    store.clearRoute()
  }
}

// Move waypoint up in the order
const moveWaypointUp = (waypointId) => {
  const waypoint = store.routePlanning.waypoints.find(wp => wp.id === waypointId)
  if (waypoint && waypoint.order > 0) {
    console.log(`Moving waypoint ${waypointId} up...`)
    store.reorderWaypoint(waypointId, waypoint.order - 1)
    
    // Recalculate route
    if (store.routePlanning.waypoints.length >= 2) {
      calculateMultiWaypointRoute()
    }
  }
}

// Move waypoint down in the order
const moveWaypointDown = (waypointId) => {
  const waypoint = store.routePlanning.waypoints.find(wp => wp.id === waypointId)
  if (waypoint && waypoint.order < store.routePlanning.waypoints.length - 1) {
    console.log(`Moving waypoint ${waypointId} down...`)
    store.reorderWaypoint(waypointId, waypoint.order + 1)
    
    // Recalculate route
    if (store.routePlanning.waypoints.length >= 2) {
      calculateMultiWaypointRoute()
    }
  }
}

// Calculate route through multiple waypoints (now uses unified approach)
const calculateMultiWaypointRoute = async () => {
  if (store.routePlanning.waypoints.length < 1) {
    console.warn('Need at least 1 waypoint to calculate route')
    return
  }
  
  // Use the unified waypoint route calculation
  await calculateWaypointRoute()
}

// Calculate route using unified waypoint approach
const calculateWaypointRoute = async () => {
  try {
    console.log('🛤️ Calculating unified waypoint route...')
    
    // Use the store's calculateWaypointRoute method
    const route = await store.calculateWaypointRoute(routingService)
    
    if (route) {
      console.log('✅ Unified waypoint route calculated successfully')
      
      store.addToast({
        title: '🗺️ Route Calculated',
        message: `${(route.distance / 1000).toFixed(1)} km, ${Math.round(route.duration / 60)} min`,
        type: 'success',
        duration: 3000
      })
      
      // Automatically load charging stations along the route
      if (store.showChargingStations) {
        await loadChargingStationsAlongRoute()
      }
    } else {
      console.warn('⚠️ No route returned from waypoint calculation')
      
      store.addToast({
        title: '⚠️ Route Warning', 
        message: 'Could not calculate route to destination',
        type: 'warning',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('❌ Error in waypoint route calculation:', error)
    
    store.addToast({
      title: '❌ Route Error',
      message: 'Failed to calculate route to destination',
      type: 'error',
      duration: 3000
    })
  }
}

// Clear all waypoints and route
const clearRouteAndWaypoints = () => {
  console.log('🧹 Starting clearRouteAndWaypoints...')
  console.log('📊 Before clear - waypoints:', store.routePlanning.waypoints.length)
  console.log('📊 Before clear - markers:', store.markers.length)
  console.log('📊 Before clear - route:', store.routeData)
  
  store.clearRoute()
  store.clearWaypoints()
  store.clearMarkers()
  store.stopWaypointMode()
  
  console.log('📊 After clear - waypoints:', store.routePlanning.waypoints.length)
  console.log('📊 After clear - markers:', store.markers.length)
  console.log('📊 After clear - route:', store.routeData)
  console.log('✅ clearRouteAndWaypoints completed')
  
  store.addToast({
    title: '🧹 Cleared',
    message: 'Route and waypoints cleared',
    type: 'info',
    duration: 2000
  })
}

// Open save route modal
const openSaveRouteModal = () => {
  console.log('Opening save route modal...')
  store.toggleModal('saveRoute')
}

// Center the map on user's current position
const centerMap = async () => {
  if (navigator.geolocation) {
    try {
      // Show loading state
      store.setLoadingLocation(true)
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      })

      const userLat = position.coords.latitude
      const userLng = position.coords.longitude
      
      // Snap to nearest road
      const snappedPosition = await snapToNearestRoad(userLat, userLng)
      
      const newCenter = snappedPosition ? {
        lat: snappedPosition.lat,
        lng: snappedPosition.lng
      } : {
        lat: userLat,
        lng: userLng
      }
      
      store.updatePosition(newCenter)
      await fetchSpeedLimit(newCenter.lat, newCenter.lng)
      
      // Show success toast
      store.addToast({
        title: '📍 Map Centered',
        message: `Centered on your location (${newCenter.lat.toFixed(4)}, ${newCenter.lng.toFixed(4)})`,
        type: 'success',
        duration: 3000
      })
      
    } catch (error) {
      console.error('Error getting user location:', error)
      
      // Show error toast based on error type
      let title = '❌ Location Error'
      let message = 'Unable to get your location'
      
      if (error.code === error.PERMISSION_DENIED) {
        title = '🔒 Permission Denied'
        message = 'Please enable location permissions in your browser settings'
      } else if (error.code === error.TIMEOUT) {
        title = '⏱️ Location Timeout'
        message = 'Location request timed out. Please try again.'
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        title = '📍 Location Unavailable'
        message = 'Location information is not available'
      }
      
      store.addToast({
        title,
        message,
        type: 'error',
        duration: 5000
      })
    } finally {
      store.setLoadingLocation(false)
    }
  } else {
    store.addToast({
      title: '❌ Not Supported',
      message: 'Geolocation is not supported by this browser',
      type: 'error',
      duration: 5000
    })
  }
}

// Snap position to nearest road
const snapToNearestRoad = async (lat, lng) => {
  try {
    const snappedPoint = await routingService.snapToRoad({ lat, lng })
    return snappedPoint
  } catch (error) {
    console.warn('Could not snap to road, using original coordinates:', error)
    return null
  }
}

// Fetch speed limit data
const fetchSpeedLimit = async (lat, lng) => {
  try {
    // Check if we need to update the speed limit based on distance threshold
    const distanceFromLastCheck = calculateDistance(
      lat, 
      lng, 
      lastSpeedLimitPosition.value.lat, 
      lastSpeedLimitPosition.value.lng
    )
    
    // Only update if we've moved far enough or it's our first check
    if (distanceFromLastCheck > speedLimitThreshold || 
        (lastSpeedLimitPosition.value.lat === 0 && lastSpeedLimitPosition.value.lng === 0)) {
      
      // Check time threshold too
      const now = Date.now()
      if (now - speedLimitRequestTimestamp.value > speedLimitRequestMinInterval) {
        // Update timestamp and position
        speedLimitRequestTimestamp.value = now
        lastSpeedLimitPosition.value = { lat, lng }
        
        // Get speed limit from our service
        const limit = await speedLimitService.getSpeedLimit(lat, lng)
        store.setSpeedLimit(limit)
      }
    }
  } catch (error) {
    console.error('Error fetching speed limit:', error)
    // If there's an error, fall back to the pattern-based approach
    generateFallbackSpeedLimit(lat, lng)
  }
}

// Generate a fallback speed limit based on location patterns
const generateFallbackSpeedLimit = (lat, lng) => {
  // Using a combination of region-based and pattern-based speed limits
  
  // 1. Check region-based speed limits (Lisbon areas)
  if (lat > 38.7 && lat < 38.8 && lng > -9.3 && lng < -9.1) {
    // Lisbon area highways
    store.setSpeedLimit(120)
    return
  } 
  
  if (lat > 38.7 && lat < 38.74 && lng > -9.18 && lng < -9.13) {
    // Lisbon city center
    store.setSpeedLimit(50)
    return
  }
  
  if (lat > 38.74 && lat < 38.78 && lng > -9.20 && lng < -9.16) {
    // Lisbon residential areas
    store.setSpeedLimit(30)
    return
  }
  
  // 2. Check for highway corridors
  if (isLikelyHighway(lat, lng)) {
    store.setSpeedLimit(120)
    return
  }
  
  // 3. Pattern-based fallback (ensures consistent speeds for specific locations)
  const hashValue = Math.abs(Math.sin(lat * 10) + Math.cos(lng * 10)) * 10000
  
  if (hashValue % 17 < 2) {
    // Highway
    store.setSpeedLimit(120)
  } else if (hashValue % 13 < 3) {
    // Main road
    store.setSpeedLimit(90)
  } else if (hashValue % 7 < 2) {
    // Urban main street
    store.setSpeedLimit(50)
  } else {
    // Urban residential area
    store.setSpeedLimit(30)
  }
}

// Simple highway detection based on map data patterns
const isLikelyHighway = (lat, lng) => {
  // Example: Check if we're on a known highway corridor
  const highways = [
    // A1 corridor (simplified)
    {path: [{lat: 38.78, lng: -9.10}, {lat: 38.85, lng: -9.05}], width: 0.01},
    // A5 corridor (simplified)
    {path: [{lat: 38.72, lng: -9.16}, {lat: 38.71, lng: -9.32}], width: 0.01},
  ]
  
  // Check if point is near any highway path
  for (const highway of highways) {
    for (let i = 0; i < highway.path.length - 1; i++) {
      const start = highway.path[i]
      const end = highway.path[i + 1]
      
      // Calculate if point is close to this highway segment
      if (distanceToSegment(lat, lng, start.lat, start.lng, end.lat, end.lng) < highway.width) {
        return true
      }
    }
  }
  
  return false
}

// Calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate distance from point to line segment
const distanceToSegment = (lat, lng, lat1, lng1, lat2, lng2) => {
  // Convert to Cartesian coordinates (simplified)
  const x = lng
  const y = lat
  const x1 = lng1
  const y1 = lat1
  const x2 = lng2
  const y2 = lat2
  
  // Calculate squared length of segment
  const l2 = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)
  if (l2 === 0) return Math.sqrt((x-x1)*(x-x1) + (y-y1)*(y-y1))
  
  // Calculate projection onto segment
  const t = ((x-x1)*(x2-x1) + (y-y1)*(y2-y1)) / l2
  if (t < 0) return Math.sqrt((x-x1)*(x-x1) + (y-y1)*(y-y1))
  if (t > 1) return Math.sqrt((x-x2)*(x-x2) + (y-y2)*(y-y2))
  
  const px = x1 + t*(x2-x1)
  const py = y1 + t*(y2-y1)
  return Math.sqrt((x-px)*(x-px) + (y-py)*(y-py))
}

/**
 * Initialize dependent services after geolocation completes
 */
const initializeDependentServices = async () => {
  try {
    console.log('📍 Geolocation completed, initializing dependent services in MapContainer...')
    
    // Get current position from store (set by HomePage geolocation)
    const currentPosition = store.currentPosition
    
    if (currentPosition && currentPosition.lat && currentPosition.lng) {
      // Initialize speed limit information
      await fetchSpeedLimit(currentPosition.lat, currentPosition.lng)
      
      // Load nearby charging stations
      if (store.showChargingStations) {
        await loadNearbyChargingStations()
      }
      
      // Automatically enable location sharing (always opted-in)
      await enableLocationSharing()
      
      console.log('✅ All location-dependent features initialized successfully')
    } else {
      console.warn('⚠️ No valid position available, using default location for dependent services')
      
      // Use default Lisbon location for services
      const defaultLat = 38.7223
      const defaultLng = -9.1393
      
      await fetchSpeedLimit(defaultLat, defaultLng)
      
      if (store.showChargingStations) {
        await loadNearbyChargingStations()
      }
      
      await enableLocationSharing()
    }
  } catch (error) {
    console.error('❌ Failed to initialize location-dependent features:', error)
    store.addToast({
      title: '❌ Initialization Error',
      message: 'Some features may not work correctly',
      type: 'error',
      duration: 5000
    })
  }
}

// Initialize MapContainer on mount and listen for geolocation completion
onMounted(() => {
  console.log('🗺️ MapContainer mounted, waiting for geolocation completion...')
  
  // Check if geolocation is already complete
  if (store.isGeolocationComplete) {
    console.log('📍 Geolocation already completed, initializing services immediately')
    initializeDependentServices()
  } else {
    // Listen for geolocation completion event
    const handleGeolocationComplete = (event) => {
      console.log('📍 Received geolocation-complete event:', event.detail)
      initializeDependentServices()
      
      // Remove event listener after first use
      window.removeEventListener('geolocation-complete', handleGeolocationComplete)
    }
    
    window.addEventListener('geolocation-complete', handleGeolocationComplete)
    console.log('👂 Listening for geolocation-complete event...')
  }
})

// ===== Location Sharing Methods =====

/**
 * Enable location sharing
 */
const enableLocationSharing = async () => {
  try {
    locationSharingError.value = null
    
    // Initialize location sharing in store
    store.initializeLocationSharing()
    
    // Set up event handlers
    setupLocationSharingEventHandlers()
    
    // Connect to WebSocket server
    userLocationSharingService.connect('ws://localhost:8080')
    
    // Start watching user location for sharing
    await startLocationWatching()
    
    console.log('✅ Location sharing enabled')
  } catch (error) {
    console.error('❌ Failed to enable location sharing:', error)
    locationSharingError.value = 'Failed to enable location sharing: ' + error.message
  }
}

/**
 * Reconnect to location sharing service
 */
const reconnectLocationSharing = async () => {
  try {
    locationSharingError.value = null
    userLocationSharingService.connect('ws://localhost:8080')
  } catch (error) {
    console.error('❌ Failed to reconnect to location sharing:', error)
    locationSharingError.value = 'Failed to reconnect: ' + error.message
  }
}

/**
 * Set up WebSocket event handlers
 */
const setupLocationSharingEventHandlers = () => {
  // Connection state changes
  userLocationSharingService.onConnectionStateChange = (isConnected) => {
    if (isConnected) {
      const status = userLocationSharingService.getStatus()
      store.updateLocationSharingConnection(true, status.userId, status.userName)
      
      // Authenticate user with WebSocket after connection is established
      if (store.user.isAuthenticated && store.user.email) {
        userLocationSharingService.authenticate(store.user.email, store.user.sessionToken)
      }
      
      // Request current users list
      userLocationSharingService.requestUsersList()
    } else {
      store.updateLocationSharingConnection(false)
    }
  }
  
  // User connected
  userLocationSharingService.onUserConnected = (user) => {
    store.addConnectedUser(user)
    
    store.addToast({
      title: '👤 User Connected',
      message: `${user.name} joined location sharing`,
      type: 'info',
      duration: 3000
    })
  }
  
  // User disconnected
  userLocationSharingService.onUserDisconnected = (user) => {
    store.removeConnectedUser(user.id)
    
    store.addToast({
      title: '👋 User Disconnected',
      message: `${user.name} left location sharing`,
      type: 'info',
      duration: 3000
    })
  }
  
  // User updated (name change)
  userLocationSharingService.onUserUpdated = (user) => {
    store.updateUserName(user.id, user.name)
    
    store.addToast({
      title: '👤 User Updated',
      message: `User is now known as ${user.name}`,
      type: 'info',
      duration: 3000
    })
  }
  
  // User location update
  userLocationSharingService.onUserLocationUpdate = (user) => {
    store.updateUserLocation(user.id, user.position)
  }
  
  // Users list update
  userLocationSharingService.onUsersListUpdate = (users) => {
    store.updateConnectedUsersList(users)
  }
  
  // Error handling
  userLocationSharingService.onError = (error) => {
    locationSharingError.value = error
    console.error('Location sharing error:', error)
    
    store.addToast({
      title: '⚠️ Location Sharing Error',
      message: error,
      type: 'error',
      duration: 5000
    })
  }
}

/**
 * Start watching user location for sharing
 */
const startLocationWatching = async () => {
  try {
    // Share initial location using raw GPS (no road snapping for sharing)
    const position = await geolocationService.getCurrentPosition({}, false)
    userLocationSharingService.shareLocation(position, true) // Force first share
    
    // Start watching for location changes with raw GPS coordinates
    locationWatchId.value = geolocationService.watchPosition(
      (position) => {
        // Share location if it changed significantly
        userLocationSharingService.shareLocation(position)
        
        // Update current position in store (this will trigger map updates)
        store.updatePosition({
          lat: position.lat,
          lng: position.lng
        })
      },
      (error) => {
        console.error('Location watching error:', error)
        locationSharingError.value = 'Location tracking error: ' + error.message
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000 // More frequent updates for sharing
      },
      false // Disable road snapping for location sharing
    )
    
    console.log('📍 Started location watching for sharing (raw GPS)')
  } catch (error) {
    console.error('Failed to start location watching:', error)
    throw error
  }
}

/**
 * Stop watching user location (modified to restart immediately since location sharing is always on)
 */
const stopLocationWatching = () => {
  if (locationWatchId.value) {
    geolocationService.stopWatching(locationWatchId.value)
    locationWatchId.value = null
    console.log('📍 Temporarily stopped location watching, will restart automatically')
    
    // Immediately restart location watching since location sharing is always on
    setTimeout(startLocationWatching, 1000)
  }
}
</script>

<style scoped>
.map-container {
  position: relative;
  height: calc(100vh - 80px); /* Subtract header height */
  width: 100%;
}

.map-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-button {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #667eea;
  border-radius: 25px;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-button:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
}

.instructions-block {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.instructions-block.waypoint-mode {
  background: rgba(102, 126, 234, 0.15);
  border: 2px solid rgba(102, 126, 234, 0.3);
}

.instructions-block p {
  margin: 0;
  color: #333;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.instruction-icon {
  font-size: 1.2rem;
}

/* Compact Indicators Styles */
.compact-indicators {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.compact-indicators > * {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.compact-indicators > *:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.info-panels {
  position: absolute;
  top: 140px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 200px;
}

.info-icon {
  font-size: 2rem;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.remove-route-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.remove-route-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.speed-panel {
  border-left: 4px solid #28a745;
}

.route-panel {
  border-left: 4px solid #667eea;
}

/* Enhanced Route Planning Panel Styles */
.enhanced-route-panel {
  max-width: 350px;
  min-width: 280px;
}

.route-panel-content {
  width: 100%;
}

.route-panel-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.route-title {
  flex: 1;
}

.route-stats {
  display: flex;
  gap: 1rem;
}

.waypoint-instructions {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #4c51bf;
}

.waypoint-instructions p {
  margin: 0;
}

.waypoints-section {
  margin-bottom: 1rem;
}

.waypoints-header {
  margin-bottom: 0.5rem;
}

.waypoints-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.waypoints-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.waypoint-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.waypoint-item:hover {
  background: rgba(102, 126, 234, 0.05);
  border-color: rgba(102, 126, 234, 0.2);
}

.waypoint-number {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.waypoint-info {
  flex: 1;
  min-width: 0;
}

.waypoint-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.waypoint-coords {
  font-size: 0.75rem;
  color: #666;
  font-family: monospace;
}

.waypoint-controls {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.waypoint-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.waypoint-btn.move-btn {
  color: #667eea;
  border-color: #667eea;
}

.waypoint-btn.move-btn:hover {
  background: #667eea;
  color: white;
}

.waypoint-btn.remove-btn {
  color: #dc3545;
  border-color: #dc3545;
}

.waypoint-btn.remove-btn:hover {
  background: #dc3545;
  color: white;
}

.route-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.waypoint-btn-primary {
  background: #667eea;
  color: white;
}

.waypoint-btn-primary:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.waypoint-btn-secondary {
  background: #28a745;
  color: white;
}

.waypoint-btn-secondary:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.calculate-btn {
  background: #fd7e14;
  color: white;
}

.calculate-btn:hover {
  background: #e8681c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(253, 126, 20, 0.3);
}

.cancel-btn {
  background: #dc3545;
  color: white;
}

.cancel-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.save-route-btn {
  background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);
  color: white;
}

.save-route-btn:hover {
  background: linear-gradient(135deg, #138496 0%, #5a32a3 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
}

.mr-1 {
  margin-right: 0.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .map-controls {
    top: 10px;
    left: 10px;
  }
  
  .compact-indicators {
    top: 10px;
    right: 10px;
    gap: 0.5rem;
  }
  
  .info-panels {
    top: 120px;
    right: 10px;
    left: 10px;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .info-panel {
    flex: 1;
    min-width: 150px;
    padding: 1rem;
  }
  
  .enhanced-route-panel {
    flex: 1 1 100%;
    max-width: none;
    min-width: 280px;
  }
  
  .route-stats {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .waypoints-list {
    max-height: 200px;
  }
  
  .control-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .instructions-block {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .compact-indicators {
    top: 5px;
    right: 5px;
    gap: 0.4rem;
  }
  
  .info-panels {
    top: 100px;
    flex-direction: column;
  }
  
  .info-panel {
    padding: 0.75rem;
  }
  
  .enhanced-route-panel {
    min-width: 260px;
  }
  
  .info-icon {
    font-size: 1.5rem;
  }
  
  .info-value {
    font-size: 1rem;
  }
  
  .waypoint-item {
    padding: 0.5rem;
  }
  
  .waypoint-number {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
  
  .waypoint-name {
    font-size: 0.8rem;
  }
  
  .waypoint-coords {
    font-size: 0.7rem;
  }
  
  .action-btn {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>
