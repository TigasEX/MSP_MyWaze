/**
 * User Location Initializer for MyWaze
 * 
 * This module provides unified location initialization functionality for the application.
 * It ensures that all location-dependent features (speed limits, EV chargers, location sharing)
 * are only activated after the user's location has been successfully obtained.
 * 
 * Key Features:
 * - Centralized location initialization logic
 * - Road snapping for improved accuracy
 * - Error handling with user feedback
 * - Loading state management
 * - Toast notifications for user feedback
 * 
 * Dependencies:
 * - Browser Geolocation API
 * - OpenRouteService for road snapping
 * - Global store for state management
 * 
 * Usage:
 * Called from MapContainer.vue onMounted to ensure proper initialization sequence
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

/**
 * Initialize user location and prepare location-dependent features
 * @returns {Promise<Object>} Resolved location object {lat, lng}
 * @throws {Error} Location access errors
 */
const initializeUserLocation = async () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      // Show loading state
      store.setLoadingLocation(true)
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
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
            
            // Update position in store
            store.updatePosition(newCenter)
            
            // Show success toast
            store.addToast({
              title: '📍 Location Found',
              message: `Your location: ${newCenter.lat.toFixed(4)}, ${newCenter.lng.toFixed(4)}`,
              type: 'success',
              duration: 3000
            })
            
            store.setLoadingLocation(false)
            resolve(newCenter)
          } catch (error) {
            console.error('Error processing user location:', error)
            store.setLoadingLocation(false)
            reject(error)
          }
        },
        (error) => {
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
          
          store.setLoadingLocation(false)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      const error = new Error('Geolocation not supported')
      store.addToast({
        title: '❌ Not Supported',
        message: 'Geolocation is not supported by this browser',
        type: 'error',
        duration: 5000
      })
      reject(error)
    }
  })
}
