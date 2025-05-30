<template>
  <div class="min-h-screen bg-white-100">
    <!-- Authentication Screen -->
    <LoginForm v-if="!store.user.isAuthenticated" @authenticated="handleAuthentication" />

    <!-- Main Application -->
    <div v-else class="app-container">
      <!-- Navigation Header -->
      <NavigationHeader
        @toggle-vehicle-menu="() => store.toggleModal('vehicleRegistration')"
        @toggle-vehicle-list="() => store.toggleModal('vehicleList')"
        @toggle-route-list="() => store.toggleModal('myRoutes')"
        @logout="logout"
      />

      <!-- Vehicle Registration Modal -->
      <VehicleRegistrationModal
        :is-visible="store.modals.vehicleRegistration"
        @close="() => store.toggleModal('vehicleRegistration')"
        @vehicle-registered="handleVehicleRegistered"
      />

      <!-- Vehicle List Modal -->
      <VehicleListModal
        :is-visible="store.modals.vehicleList"
        :vehicles="store.vehicles"
        @close="() => store.toggleModal('vehicleList')"
        @add-vehicle="handleAddVehicle"
        @select-vehicle="handleSelectVehicle"
        @remove-vehicle="handleRemoveVehicle"
      />

      <!-- Save Route Modal -->
      <SaveRouteModal 
        v-if="store.modals.saveRoute"
        :is-visible="store.modals.saveRoute"
        @close="() => store.toggleModal('saveRoute')"
        @route-saved="handleRouteSaved"
      />

      <!-- My Routes Modal -->
      <MyRoutesModal 
        v-if="store.modals.myRoutes"
        :is-visible="store.modals.myRoutes"
        @close="() => store.toggleModal('myRoutes')"
        @route-loaded="handleRouteLoaded"
      />

      <!-- Main Content Area with Map -->
      <div class="main-content">
        <MapContainer
          :center="store.currentPosition"
          :markers="store.markers"
          :route-path="store.routeData.path"
          :route-details="store.routeData.details"
          :speed-limit="store.speedLimit"
          @update:center="handlePositionUpdate"
          @marker-added="handleMarkerAdded"
          @route-calculated="handleRouteCalculated"
          @position-changed="handlePositionChanged"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import NavigationHeader from '@/components/ui/NavigationHeader.vue'
import VehicleRegistrationModal from '@/components/modals/VehicleRegistrationModal.vue'
import VehicleListModal from '@/components/modals/VehicleListModal.vue'
import SaveRouteModal from '@/components/modals/SaveRouteModal.vue'
import MyRoutesModal from '@/components/modals/MyRoutesModal.vue'
import MapContainer from '@/components/map/MapContainer.vue'
import { store } from '@/store'
import { getSessionToken, clearSessionToken } from '@/utils/tokenOperations'

/**
 * ===== Authentication Functions =====
 */

// Handle successful authentication
const handleAuthentication = () => {
  store.setAuthentication(true)
  store.loadVehiclesFromStorage()
}

// Log out and clear session
const logout = () => {
  clearSessionToken()
  store.reset()
}

/**
 * ===== Vehicle Management Functions =====
 */

// Handle vehicle registration
const handleVehicleRegistered = (newVehicle) => {
  store.addVehicle(newVehicle)
}

// Handle add vehicle from list modal
const handleAddVehicle = () => {
  store.toggleModal('vehicleList')
  store.toggleModal('vehicleRegistration')
}

// Handle vehicle selection
const handleSelectVehicle = (vehicle) => {
  store.selectVehicle(vehicle)
  store.toggleModal('vehicleList')
}

// Handle vehicle removal
const handleRemoveVehicle = (index) => {
  store.removeVehicle(index)
}

// Handle route saved
const handleRouteSaved = (savedRoute) => {
  console.log('Route saved:', savedRoute)
}

// Handle route loaded
const handleRouteLoaded = (routeId) => {
  console.log('Route loaded:', routeId)
}

/**
 * ===== Map & Navigation Functions =====
 */

// Handle position updates
const handlePositionUpdate = (position) => {
  store.updatePosition(position)
}

// Add marker to map
const handleMarkerAdded = (marker) => {
  store.addMarker(marker)
}

// Handle route calculation results
const handleRouteCalculated = (routeData) => {
  store.setRoute(routeData)
}

// Handle position changes for speed limit updates
const handlePositionChanged = (position) => {
  store.updatePosition(position)
}

/**
 * ===== Lifecycle =====
 */

onMounted(() => {
  // Load saved routes from storage
  store.loadRoutesFromStorage()
  
  // Check if user is already authenticated
  const token = getSessionToken()
  if (token) {
    store.setAuthentication(true)
    store.loadVehiclesFromStorage()
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-container {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .app-container {
    font-size: 0.8rem;
  }
}
</style>
