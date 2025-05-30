<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Authentication Screen - Show when user is not logged in -->
    <LoginForm v-if="!store.user.isAuthenticated" />

    <!-- Main Application - Show when user is authenticated -->
    <div v-else class="app-container">
      <!-- Loading Indicator for Geolocation -->
      <LocationLoadingIndicator :is-visible="store.isLoadingLocation" />
      
      <!-- Navigation Header -->
      <NavigationHeader 
        @toggle-vehicle-menu="() => { console.log('Add Vehicle button clicked'); store.toggleModal('vehicleRegistration') }"
        @toggle-vehicle-list="() => { console.log('My Vehicles button clicked'); store.toggleModal('vehicleList') }"
        @toggle-route-list="store.toggleModal('myRoutes')"
        @toggle-username-settings="store.toggleModal('usernameSettings')"
        @logout="handleLogout"
      />

      <!-- Map Container -->
      <MapContainer />
      <!-- Vehicle Registration Modal -->
      <VehicleRegistrationModal 
        :is-visible="store.modals.vehicleRegistration"
        @close="store.toggleModal('vehicleRegistration')"
      />

      <!-- Vehicle List Modal -->
      <VehicleListModal 
        :is-visible="store.modals.vehicleList"
        @close="store.toggleModal('vehicleList')"
      />

      <!-- Save Route Modal -->
      <SaveRouteModal 
        v-if="store.modals.saveRoute"
        :is-visible="store.modals.saveRoute"
        @close="store.toggleModal('saveRoute')"
        @route-saved="handleRouteSaved"
      />

      <!-- My Routes Modal -->
      <MyRoutesModal 
        v-if="store.modals.myRoutes"
        :is-visible="store.modals.myRoutes"
        @close="store.toggleModal('myRoutes')"
        @route-loaded="handleRouteLoaded"
      />

      <!-- Username Settings Modal -->
      <UsernameSettingsModal 
        v-if="store.modals.usernameSettings"
        @close="store.toggleModal('usernameSettings')"
      />
      
      <!-- Toast Notifications -->
      <ToastNotification
        v-for="toast in store.toasts"
        :key="toast.id"
        :title="toast.title"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        :auto-close="toast.autoClose"
        @close="store.removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script>
import { store } from '@/store'
import { watch } from 'vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import NavigationHeader from '@/components/ui/NavigationHeader.vue'
import MapContainer from '@/components/map/MapContainer.vue'
import VehicleRegistrationModal from '@/components/modals/VehicleRegistrationModal.vue'
import VehicleListModal from '@/components/modals/VehicleListModal.vue'
import SaveRouteModal from '@/components/modals/SaveRouteModal.vue'
import MyRoutesModal from '@/components/modals/MyRoutesModal.vue'
import UsernameSettingsModal from '@/components/modals/UsernameSettingsModal.vue'
import LocationLoadingIndicator from '@/components/ui/LocationLoadingIndicator.vue'
import ToastNotification from '@/components/ui/ToastNotification.vue'
import geolocationService from '@/services/GeolocationService.js'
import speedLimitService from '@/services/SpeedLimitService.js'

export default {
  name: 'HomePage',
  components: {
    LoginForm,
    NavigationHeader,
    MapContainer,
    VehicleRegistrationModal,
    VehicleListModal,
    SaveRouteModal,
    MyRoutesModal,
    UsernameSettingsModal,
    LocationLoadingIndicator,
    ToastNotification
  },
  setup() {
    const handleLogout = async () => {
      await store.logout()
      console.log('User logged out')
    }

    const handleRouteSaved = (savedRoute) => {
      console.log('Route saved:', savedRoute)
      // Route saved handler can be extended if needed
    }

    const handleRouteLoaded = (routeId) => {
      console.log('Route loaded:', routeId)
      // Route loaded handler can be extended if needed
    }



    /**
     * Initialize dependent services after geolocation completes
     */
    const initializeDependentServices = async () => {
      console.log('📍 Geolocation process completed, initializing dependent services...')
      
      // Set flag to indicate geolocation process is complete
      store.setGeolocationComplete(true)
      
      // Trigger initialization of dependent services via custom event
      window.dispatchEvent(new CustomEvent('geolocation-complete', {
        detail: {
          position: store.currentPosition,
          timestamp: Date.now()
        }
      }))
      
      console.log('✅ Dependent services initialization triggered')
    }

    /**
     * Initialize user location when authenticated
     */
    const initializeUserLocation = async () => {
      if (!geolocationService.isGeolocationAvailable()) {
        console.warn('Geolocation is not available in this browser')
        // Still initialize dependent services even without geolocation
        await initializeDependentServices()
        return
      }

      try {
        console.log('Starting geolocation initialization...')
        store.setLoadingLocation(true)

        // Get current position
        const position = await geolocationService.getCurrentPosition({
          timeout: 15000, // 15 seconds timeout
          enableHighAccuracy: true
        })

        console.log('User location obtained:', position)

        // Update store with user's position
        store.updatePosition({
          lat: position.lat,
          lng: position.lng
        })

        console.log('Geolocation initialization completed successfully')
        
        // Show a success toast notification
        store.addToast({
          title: '📍 Location Found',
          message: `Centered map on your location (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`,
          type: 'success',
          duration: 4000
        })

      } catch (error) {
        console.error('Geolocation error:', error)
        
        // Handle different error types with toast notifications
        if (error.type === 'permission_denied') {
          store.addToast({
            title: '🔒 Location Access Denied',
            message: 'Enable location permissions and refresh to center map on your location. You can also use the "Center Map" button.',
            type: 'warning',
            duration: 7000
          })
        } else if (error.type === 'timeout') {
          store.addToast({
            title: '⏱️ Location Timeout',
            message: 'Taking longer than expected to get your location. Try the "Center Map" button.',
            type: 'info',
            duration: 5000
          })
        } else if (error.type === 'position_unavailable') {
          store.addToast({
            title: '📍 Location Unavailable',
            message: 'Your location is currently unavailable. Using default location.',
            type: 'warning',
            duration: 5000
          })
        } else {
          store.addToast({
            title: '❌ Location Error',
            message: 'Unable to get your location. Using default location (Lisbon).',
            type: 'error',
            duration: 5000
          })
        }
        
      } finally {
        store.setLoadingLocation(false)
        // Always initialize dependent services after geolocation attempt
        await initializeDependentServices()
      }
    }

    /**
     * Watch for authentication changes to trigger location initialization
     */
    watch(
      () => store.user.isAuthenticated,
      (isAuthenticated) => {
        if (isAuthenticated) {
          console.log('User authenticated, initializing location...')
          // Small delay to ensure the UI is ready
          setTimeout(() => {
            initializeUserLocation()
          }, 500)
        }
      },
      { immediate: true }
    )

    return {
      store,
      handleLogout,
      handleRouteSaved,
      handleRouteLoaded
    }
  },
  mounted() {
    // Initialize the application when component mounts
    console.log('MyWaze application started')
    console.log('Initial store state:', store)
    console.log('Initial modal states:', store.modals)
    console.log('User authenticated:', store.user.isAuthenticated)
    
    // Load saved routes from storage
    store.loadRoutesFromStorage()
    
    // Check if user has existing session
    if (store.user.sessionToken) {
      store.setAuthentication(true, store.user.email, store.user.sessionToken)
    }
  }
}
</script>

<style scoped>
.app-container {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Responsive design for mobile devices */
@media (max-width: 768px) {
  .app-container {
    height: 100vh;
    overflow: hidden;
  }
}

/* Global app styling */
.min-h-screen {
  min-height: 100vh;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}
</style>