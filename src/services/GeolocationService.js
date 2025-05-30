/**
 * Geolocation Service for MyWaze
 * 
 * Handles user location detection, tracking, and road snapping functionality.
 * Provides accurate positioning for navigation and location sharing features.
 * 
 * Key Features:
 * - High-accuracy GPS positioning
 * - Continuous location watching
 * - Road snapping using OpenRouteService
 * - Location caching for performance
 * - Error handling with user-friendly messages
 * 
 * Location Processing:
 * - Browser Geolocation API integration
 * - Configurable accuracy and timeout settings
 * - Position caching to reduce API calls
 * - Road snapping for navigation accuracy
 * 
 * Error Handling:
 * - Permission denied scenarios
 * - GPS unavailable situations
 * - Timeout and accuracy issues
 * - Graceful fallbacks
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

import routingService from './RoutingService.js'

/**
 * Geolocation Service
 * Handles user location detection and positioning
 */
export class GeolocationService {
  constructor() {
    this.watchId = null // GPS watch identifier for stopping location tracking
    // GPS configuration options for optimal accuracy
    this.options = {
      enableHighAccuracy: true, // Use GPS instead of network location
      timeout: 10000, // 10 second timeout for location requests
      maximumAge: 60000 // Cache position for 1 minute to reduce battery usage
    }
  }

  /**
   * Get the user's current position
   * @param {Object} options - Geolocation options
   * @param {boolean} snapToRoad - Whether to snap position to nearest road (default: true)
   * @returns {Promise<Object>} Position object with lat, lng
   */
  async getCurrentPosition(options = {}, snapToRoad = true) {
    const geoOptions = { ...this.options, ...options }
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }

          try {
            // Only snap to road if requested
            if (snapToRoad) {
              console.log('Raw GPS position:', userPosition)
              const snappedPosition = await routingService.snapToRoad({
                lat: userPosition.lat,
                lng: userPosition.lng
              })
              
              console.log('Snapped position:', snappedPosition)
              
              resolve({
                lat: snappedPosition.lat,
                lng: snappedPosition.lng,
                accuracy: userPosition.accuracy,
                timestamp: userPosition.timestamp,
                wasSnapped: true
              })
            } else {
              // Return raw GPS position without snapping
              resolve({
                ...userPosition,
                wasSnapped: false
              })
            }
          } catch (error) {
            console.warn('Road snapping failed, using raw GPS position:', error)
            resolve({
              ...userPosition,
              wasSnapped: false
            })
          }
        },
        (error) => {
          let errorMessage = 'Unable to get your location'
          let errorType = 'unknown'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.'
              errorType = 'permission_denied'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.'
              errorType = 'position_unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.'
              errorType = 'timeout'
              break
            default:
              errorMessage = 'An unknown error occurred while getting location.'
              errorType = 'unknown'
              break
          }
          
          reject({
            message: errorMessage,
            type: errorType,
            originalError: error
          })
        },
        geoOptions
      )
    })
  }

  /**
   * Watch user position changes
   * @param {Function} onSuccess - Callback for successful position updates
   * @param {Function} onError - Callback for errors
   * @param {Object} options - Geolocation options
   * @param {boolean} snapToRoad - Whether to snap position to nearest road (default: true)
   * @returns {Number} Watch ID for stopping the watch
   */
  watchPosition(onSuccess, onError, options = {}, snapToRoad = true) {
    const geoOptions = { ...this.options, ...options }
    
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported by this browser'))
      return null
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }

        try {
          // Only snap to road if requested
          if (snapToRoad) {
            const snappedPosition = await routingService.snapToRoad({
              lat: userPosition.lat,
              lng: userPosition.lng
            })
            
            onSuccess({
              lat: snappedPosition.lat,
              lng: snappedPosition.lng,
              accuracy: userPosition.accuracy,
              timestamp: userPosition.timestamp,
              wasSnapped: true
            })
          } else {
            // Return raw GPS position without snapping
            onSuccess({
              ...userPosition,
              wasSnapped: false
            })
          }
        } catch (error) {
          console.warn('Road snapping failed during position watch:', error)
          onSuccess({
            ...userPosition,
            wasSnapped: false
          })
        }
      },
      (error) => {
        let errorMessage = 'Unable to track your location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        
        onError(new Error(errorMessage))
      },
      geoOptions
    )

    return this.watchId
  }

  /**
   * Stop watching position changes
   */
  stopWatchingPosition() {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  /**
   * Stop watching position changes by watch ID
   * @param {Number} watchId - The watch ID to stop
   */
  stopWatching(watchId) {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  /**
   * Check if geolocation is available
   * @returns {Boolean} True if geolocation is supported
   */
  isGeolocationAvailable() {
    return 'geolocation' in navigator
  }

  /**
   * Request location permission (for browsers that support it)
   * @returns {Promise<String>} Permission state
   */
  async requestLocationPermission() {
    if (!navigator.permissions) {
      throw new Error('Permissions API not supported')
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      return permission.state // 'granted', 'denied', or 'prompt'
    } catch (error) {
      throw new Error('Could not query location permission')
    }
  }
}

// Create and export singleton instance
const geolocationService = new GeolocationService()
export default geolocationService
