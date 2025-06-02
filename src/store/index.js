/**
 * MyWaze Global State Store
 * 
 * Centralized state management for the MyWaze navigation application.
 * Uses Vue 3's reactive system to provide real-time state updates across components.
 * 
 * State Categories:
 * - Authentication: User login state and session management
 * - Vehicle Management: User vehicles and selection
 * - Map State: Current position, markers, routes, and navigation data
 * - Location Sharing: Real-time user location sharing via WebSocket
 * - EV Charging: Charging station data and display preferences
 * - UI State: Modals, toasts, and loading states
 * 
 * Features:
 * - Persistent storage for vehicles and routes
 * - Real-time location sharing with other users
 * - Always-on location sharing (cannot be disabled)
 * - Fixed 10-meter precision threshold for location updates
 * - Toast notification system
 * - Modal management
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

import { reactive } from 'vue'

// Global application state store
export const store = reactive({
  // Authentication state
  user: {
    isAuthenticated: false,
    email: null,
    sessionToken: null
  },

  // Vehicle state
  vehicles: [],
  selectedVehicle: null,

  // Map state
  currentPosition: { lat: 38.72936883885257, lng: -9.15282508593812 }, // Lisbon default
  markers: [],
  routeData: {
    path: null,
    details: null
  },
  speedLimit: null,
  
  // EV Charging stations state
  chargingStations: [], // Array of charging station objects
  showChargingStations: true, // Toggle to show/hide charging stations
  chargingStationApiStatus: 'unknown', // Track API status: 'success', 'fallback', 'error', 'unknown'
  
  // User Location Sharing state
  locationSharing: {
    isEnabled: true,
    isConnected: false,
    currentUser: {
      id: null,
      name: null
    },
    connectedUsers: [], // Array of other users sharing location
    showOtherUsers: true, // Toggle to show/hide other users (always true)
    connectionAttempts: 0
  },
  
  // Route Planning state
  routePlanning: {
    isAddingWaypoints: false,
    waypoints: [] // Array of waypoint objects: { id, lat, lng, name, order }
  },

  // Saved Routes state
  savedRoutes: [], // Array of saved route objects

  // Speed Traps state
  speedTraps: [], // Array of speed trap objects: { id, lat, lng, addedBy, addedAt, verified, reports }
  showSpeedTraps: true, // Toggle to show/hide speed traps

  // UI state
  modals: {
    vehicleRegistration: false,
    vehicleList: false,
    saveRoute: false,
    myRoutes: false,
    usernameSettings: false
  },
  
  // Loading state
  isLoadingLocation: false,
  isGeolocationComplete: false, // Flag to track if geolocation process finished
  
  // Toast notifications
  toasts: [],

  /**
   * ===== AUTHENTICATION METHODS =====
   */

  /**
   * Set user authentication state
   * @param {boolean} isAuth - Authentication status
   * @param {string|null} email - User email
   * @param {string|null} token - Session token
   */
  setAuthentication(isAuth, email = null, token = null) {
    this.user.isAuthenticated = isAuth
    this.user.email = email
    this.user.sessionToken = token
  },

  /**
   * Logout user and clear all sensitive data
   * Calls server logout endpoint and resets local state
   */
  async logout() {
    try {
      // Import UserManager here to avoid circular dependencies
      const { UserManager } = await import('../services/UserManager.js')
      const userManager = new UserManager()
      
      if (this.user.email) {
        await userManager.logout(this.user.email)
      }
      
      // Clear local authentication state
      this.setAuthentication(false, null, null)
      
      // Clear any sensitive data
      this.vehicles = []
      this.savedRoutes = []
      this.selectedVehicle = null
      
      console.log('User logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if server logout fails, clear local state
      this.setAuthentication(false, null, null)
    }
  },

  /**
   * ===== VEHICLE MANAGEMENT METHODS =====
   */

  /**
   * Add a new vehicle to the user's vehicle list
   * @param {Object} vehicle - Vehicle object to add
   */
  addVehicle(vehicle) {
    this.vehicles.push(vehicle)
    this.saveVehiclesToStorage()
  },

  /**
   * Remove a vehicle from the user's vehicle list
   * @param {number} index - Index of the vehicle to remove
   */
  removeVehicle(index) {
    if (this.selectedVehicle === this.vehicles[index]) {
      this.selectedVehicle = null
    }
    this.vehicles.splice(index, 1)
    this.saveVehiclesToStorage()
  },

  /**
   * Select a vehicle as the active vehicle
   * @param {Object} vehicle - Vehicle to select
   */
  selectVehicle(vehicle) {
    this.selectedVehicle = vehicle
  },

  /**
   * ===== LOCATION AND MAP METHODS =====
   */

  /**
   * Update the current user position on the map
   * @param {Object} position - Position object with latitude and longitude
   * @param {number} position.lat - Latitude coordinate
   * @param {number} position.lng - Longitude coordinate
   */
  updatePosition(position) {
    this.currentPosition = position
  },

  /**
   * Add a marker to the map
   * @param {Object} marker - Marker object with position and metadata
   * @param {number} marker.lat - Marker latitude
   * @param {number} marker.lng - Marker longitude
   * @param {string} [marker.title] - Marker title or description
   */
  addMarker(marker) {
    this.markers.push(marker)
  },

  /**
   * Clear all markers from the map
   */
  clearMarkers() {
    this.markers = []
  },

  /**
   * Set the current route data for navigation
   * @param {Object} routeData - Route data object
   * @param {Array} routeData.path - Array of coordinate points forming the route
   * @param {Object} routeData.details - Route details including distance, duration, etc.
   */
  setRoute(routeData) {
    this.routeData = routeData
  },

  /**
   * Clear the current route and reset navigation
   */
  clearRoute() {
    this.routeData = { path: null, details: null }
  },

  /**
   * ===== WAYPOINT MANAGEMENT METHODS =====
   */

  /**
   * Enable waypoint addition mode for route planning
   */
  startWaypointMode() {
    this.routePlanning.isAddingWaypoints = true
  },

  /**
   * Disable waypoint addition mode
   */
  stopWaypointMode() {
    this.routePlanning.isAddingWaypoints = false
  },

  /**
   * Add a new waypoint to the route planning
   * @param {Object} waypoint - Waypoint object with coordinates
   * @param {number} waypoint.lat - Waypoint latitude
   * @param {number} waypoint.lng - Waypoint longitude
   * @param {string} [waypoint.name] - Custom waypoint name
   * @returns {Object} The created waypoint with unique ID and order
   */
  addWaypoint(waypoint) {
    const newWaypoint = {
      id: Date.now() + Math.random(),
      order: this.routePlanning.waypoints.length,
      name: waypoint.name || `Waypoint ${this.routePlanning.waypoints.length + 1}`,
      ...waypoint
    }
    this.routePlanning.waypoints.push(newWaypoint)
    return newWaypoint
  },

  /**
   * Add destination as a waypoint (unified approach for single destination routing)
   * @param {Object} destination - Destination object with coordinates
   * @param {number} destination.lat - Destination latitude
   * @param {number} destination.lng - Destination longitude
   * @param {string} [destination.name] - Destination name or address
   * @returns {Object} The created destination waypoint
   */
  addDestinationAsWaypoint(destination) {
    // Clear existing waypoints to start fresh
    this.clearWaypoints()
    
    // Add destination as the only waypoint
    const newWaypoint = {
      id: Date.now() + Math.random(),
      order: 0,
      name: `Destination`,
      ...destination
    }
    this.routePlanning.waypoints.push(newWaypoint)
    return newWaypoint
  },

  /**
   * Remove a waypoint from the route planning by ID
   * @param {string|number} waypointId - Unique ID of the waypoint to remove
   */
  removeWaypoint(waypointId) {
    const index = this.routePlanning.waypoints.findIndex(wp => wp.id === waypointId)
    if (index > -1) {
      this.routePlanning.waypoints.splice(index, 1)
      // Reorder remaining waypoints
      this.routePlanning.waypoints.forEach((wp, idx) => {
        wp.order = idx
        wp.name = `Waypoint ${idx + 1}`
      })
    }
  },

  /**
   * Reorder a waypoint to a new position in the route
   * @param {string|number} waypointId - Unique ID of the waypoint to reorder
   * @param {number} newOrder - New order/position for the waypoint (0-based index)
   */
  reorderWaypoint(waypointId, newOrder) {
    const waypoint = this.routePlanning.waypoints.find(wp => wp.id === waypointId)
    if (!waypoint) return

    // Remove waypoint from current position
    this.routePlanning.waypoints = this.routePlanning.waypoints.filter(wp => wp.id !== waypointId)
    
    // Insert at new position
    this.routePlanning.waypoints.splice(newOrder, 0, waypoint)
    
    // Update all orders and names
    this.routePlanning.waypoints.forEach((wp, idx) => {
      wp.order = idx
      wp.name = `Waypoint ${idx + 1}`
    })
  },

  /**
   * Clear all waypoints and exit waypoint mode
   */
  clearWaypoints() {
    this.routePlanning.waypoints = []
    this.routePlanning.isAddingWaypoints = false
  },

  /**
   * Calculate route using current position and all waypoints
   * @param {Object} routingService - RoutingService instance for route calculation
   * @returns {Promise<Object|null>} Route object or null if calculation fails
   */
  async calculateWaypointRoute(routingService) {
    if (this.routePlanning.waypoints.length === 0) {
      this.clearRoute()
      return null
    }

    try {
      // Create waypoints array including current position as start
      const waypointsArray = [
        this.currentPosition,
        ...this.routePlanning.waypoints.sort((a, b) => a.order - b.order)
      ]

      const route = await routingService.getMultiWaypointRoute(waypointsArray)
      
      if (route && route.geometry) {
        const routeData = {
          path: route.geometry,
          details: {
            distance: route.distance || 0,
            duration: route.duration || 0,
            waypoints: this.routePlanning.waypoints.length
          }
        }
        this.setRoute(routeData)
        return routeData
      } else {
        console.warn('No route found for waypoints')
        return null
      }
    } catch (error) {
      console.error('Error calculating waypoint route:', error)
      return null
    }
  },

  /**
   * ===== SPEED LIMIT METHODS =====
   */

  /**
   * Set the current speed limit for the user's location
   * @param {number|null} limit - Speed limit in km/h or null if unknown
   */
  setSpeedLimit(limit) {
    this.speedLimit = limit
  },

  /**
   * ===== CHARGING STATION METHODS =====
   */

  /**
   * Set the complete list of charging stations
   * @param {Array} stations - Array of charging station objects
   */
  setChargingStations(stations) {
    this.chargingStations = stations
  },

  /**
   * Add a single charging station to the list
   * @param {Object} station - Charging station object with location and details
   */
  addChargingStation(station) {
    this.chargingStations.push(station)
  },

  /**
   * Clear all charging stations from the map
   */
  clearChargingStations() {
    this.chargingStations = []
  },

  /**
   * Toggle the visibility of charging stations on the map
   */
  toggleChargingStations() {
    this.showChargingStations = !this.showChargingStations
  },

  /**
   * Set the visibility state of charging stations
   * @param {boolean} show - Whether to show charging stations
   */
  setShowChargingStations(show) {
    this.showChargingStations = show
  },

  /**
   * ===== UI STATE METHODS =====
   */

  /**
   * Set the loading state for location operations
   * @param {boolean} isLoading - Whether location is being loaded
   */
  setLoadingLocation(isLoading) {
    this.isLoadingLocation = isLoading
  },

  /**
   * Set the geolocation completion state
   * @param {boolean} isComplete - Whether geolocation process has finished
   */
  setGeolocationComplete(isComplete) {
    this.isGeolocationComplete = isComplete
  },

  /**
   * ===== TOAST NOTIFICATION METHODS =====
   */

  /**
   * Add a new toast notification
   * @param {Object} toast - Toast notification object
   * @param {string} toast.title - Toast title
   * @param {string} [toast.message] - Toast message content
   * @param {string} [toast.type] - Toast type (success, error, warning, info)
   * @param {number} [toast.duration] - Display duration in milliseconds
   * @returns {string|number} Unique toast ID for removal
   */
  addToast(toast) {
    const toastWithId = {
      id: Date.now() + Math.random(),
      ...toast
    }
    this.toasts.push(toastWithId)
    return toastWithId.id
  },

  /**
   * Remove a specific toast notification by ID
   * @param {string|number} toastId - Unique ID of the toast to remove
   */
  removeToast(toastId) {
    const index = this.toasts.findIndex(toast => toast.id === toastId)
    if (index > -1) {
      this.toasts.splice(index, 1)
    }
  },

  /**
   * Clear all toast notifications
   */
  clearAllToasts() {
    this.toasts = []
  },

  /**
   * ===== MODAL MANAGEMENT METHODS =====
   */

  /**
   * Toggle the visibility of a modal by name
   * @param {string} modalName - Name of the modal to toggle
   */
  toggleModal(modalName) {
    if (this.modals.hasOwnProperty(modalName)) {
      this.modals[modalName] = !this.modals[modalName]
    } else {
      console.error(`Modal ${modalName} does not exist in modals object`)
    }
  },

  /**
   * Close all open modals
   */
  closeAllModals() {
    Object.keys(this.modals).forEach(key => {
      this.modals[key] = false
    })
  },

  /**
   * ===== PERSISTENCE METHODS =====
   */

  /**
   * Save user vehicles to local storage for persistence
   */
  saveVehiclesToStorage() {
    localStorage.setItem('userVehicles', JSON.stringify(this.vehicles))
  },

  /**
   * Load user vehicles from local storage on app initialization
   */
  loadVehiclesFromStorage() {
    const saved = localStorage.getItem('userVehicles')
    if (saved) {
      this.vehicles = JSON.parse(saved)
    }
  },

  /**
   * ===== ROUTE MANAGEMENT METHODS =====
   */

  /**
   * Save the current route with user-provided information
   * @param {Object} routeInfo - Route information object
   * @param {string} routeInfo.title - Route title
   * @param {string} [routeInfo.description] - Route description
   * @param {string} [routeInfo.image] - Route image URL
   * @returns {Object} The saved route object with unique ID and metadata
   */
  saveRoute(routeInfo) {
    const savedRoute = {
      id: Date.now() + Math.random(),
      title: routeInfo.title,
      description: routeInfo.description,
      image: routeInfo.image || null,
      waypoints: [...this.routePlanning.waypoints],
      routeData: { ...this.routeData },
      createdAt: new Date().toISOString(),
      distance: this.routeData.details?.distance || 0,
      duration: this.routeData.details?.duration || 0
    }
    
    this.savedRoutes.push(savedRoute)
    this.saveRoutesToStorage()
    return savedRoute
  },

  /**
   * Load a previously saved route and restore it to the current state
   * @param {string|number} routeId - Unique ID of the route to load
   * @returns {boolean} True if route was loaded successfully
   */
  loadRoute(routeId) {
    const route = this.savedRoutes.find(r => r.id === routeId)
    if (!route) return false

    // Clear current state
    this.clearWaypoints()
    this.clearMarkers()
    
    // Load the saved route
    this.routePlanning.waypoints = [...route.waypoints]
    this.setRoute(route.routeData)
    
    return true
  },

  /**
   * Delete a saved route by ID
   * @param {string|number} routeId - Unique ID of the route to delete
   * @returns {boolean} True if route was deleted successfully
   */
  deleteRoute(routeId) {
    const index = this.savedRoutes.findIndex(r => r.id === routeId)
    if (index > -1) {
      this.savedRoutes.splice(index, 1)
      this.saveRoutesToStorage()
      return true
    }
    return false
  },

  /**
   * Save all routes to local storage for persistence
   */
  saveRoutesToStorage() {
    localStorage.setItem('userSavedRoutes', JSON.stringify(this.savedRoutes))
  },

  /**
   * Load saved routes from local storage on app initialization
   */
  loadRoutesFromStorage() {
    const saved = localStorage.getItem('userSavedRoutes')
    if (saved) {
      this.savedRoutes = JSON.parse(saved)
    }
  },

  reset() {
    // Reset authentication
    this.user.isAuthenticated = false
    this.user.email = null
    this.user.sessionToken = null
    
    // Reset vehicles
    this.vehicles = []
    this.selectedVehicle = null
    
    // Reset map state
    this.markers = []
    this.routeData = { path: null, details: null }
    this.speedLimit = null
    this.chargingStations = []
    this.showChargingStations = true
    
    // Reset route planning
    this.routePlanning = {
      isAddingWaypoints: false,
      waypoints: []
    }
    
    // Reset saved routes
    this.savedRoutes = []
    
    // Reset UI state
    this.modals = {
      vehicleRegistration: false,
      vehicleList: false,
      saveRoute: false,
      myRoutes: false
    }
    
    // Reset loading state
    this.isLoadingLocation = false
    
    // Clear toasts
    this.toasts = []
  },

  async fetchChargingStations(chargingStationService) {
    try {
      console.log('🔋 Fetching charging stations near current position...')
      const stations = await chargingStationService.searchChargingStations(this.currentPosition)
      this.setChargingStations(stations)
      
      // Update API status based on service status
      const apiStatus = chargingStationService.getApiStatus()
      this.chargingStationApiStatus = apiStatus.status
      
      console.log(`✅ Loaded ${stations.length} charging stations`)
      return stations
    } catch (error) {
      console.error('❌ Error fetching charging stations:', error)
      this.chargingStationApiStatus = 'error'
      return []
    }
  },

  async fetchChargingStationsAlongRoute(chargingStationService, routePoints) {
    try {
      if (!routePoints || routePoints.length === 0) {
        return []
      }
      
      console.log('🛣️ Fetching charging stations along route...')
      const stations = await chargingStationService.searchChargingStationsAlongRoute(routePoints)
      
      // Merge with existing stations, avoiding duplicates
      const existingIds = new Set(this.chargingStations.map(s => s.id))
      const newStations = stations.filter(s => !existingIds.has(s.id))
      
      this.chargingStations.push(...newStations)
      
      // Update API status based on service status
      const apiStatus = chargingStationService.getApiStatus()
      this.chargingStationApiStatus = apiStatus.status
      
      console.log(`✅ Added ${newStations.length} new charging stations along route`)
      return stations
    } catch (error) {
      console.error('❌ Error fetching charging stations along route:', error)
      return []
    }
  },

  async refreshChargingStationAvailability(chargingStationService) {
    try {
      console.log('🔄 Refreshing charging station availability...')
      
      const updates = await Promise.allSettled(
        this.chargingStations.map(async (station) => {
          try {
            const availability = await chargingStationService.getChargingStationAvailability(station.id)
            return { stationId: station.id, availability }
          } catch (error) {
            console.warn(`Failed to get availability for station ${station.id}:`, error)
            return null
          }
        })
      )
      
      // Update station availability in store
      updates.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const station = this.chargingStations[index]
          if (station && station.id === result.value.stationId) {
            Object.assign(station, result.value.availability)
          }
        }
      })
      
      console.log('✅ Charging station availability refreshed')
    } catch (error) {
      console.error('❌ Error refreshing charging station availability:', error)
    }
  },

  // User Location Sharing Methods
  initializeLocationSharing() {
    console.log('🔗 Initializing location sharing service...')
    this.locationSharing.isEnabled = true
    this.locationSharing.showOtherUsers = true // Always show other users
  },

  updateLocationSharingConnection(isConnected, userId = null, userName = null) {
    this.locationSharing.isConnected = isConnected
    if (isConnected) {
      this.locationSharing.currentUser.id = userId
      this.locationSharing.currentUser.name = userName
      this.locationSharing.connectionAttempts = 0
      console.log(`✅ Connected to location sharing as ${userName} (${userId})`)
    } else {
      this.locationSharing.currentUser.id = null
      this.locationSharing.currentUser.name = null
      console.log('❌ Disconnected from location sharing service')
    }
  },

  addConnectedUser(user) {
    const existingUserIndex = this.locationSharing.connectedUsers.findIndex(u => u.id === user.id)
    if (existingUserIndex === -1) {
      this.locationSharing.connectedUsers.push({
        ...user,
        position: user.position || null,
        lastSeen: Date.now()
      })
      console.log(`👤 User ${user.name} joined location sharing`)
    }
  },

  removeConnectedUser(userId) {
    const userIndex = this.locationSharing.connectedUsers.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      const user = this.locationSharing.connectedUsers[userIndex]
      this.locationSharing.connectedUsers.splice(userIndex, 1)
      console.log(`👋 User ${user.name} left location sharing`)
    }
  },

  updateUserLocation(userId, position) {
    const user = this.locationSharing.connectedUsers.find(u => u.id === userId)
    if (user) {
      user.position = position
      user.lastSeen = Date.now()
      console.log(`📍 Updated location for ${user.name}`)
    }
  },

  updateUserName(userId, newName) {
    const user = this.locationSharing.connectedUsers.find(u => u.id === userId)
    if (user) {
      const oldName = user.name
      user.name = newName
      user.lastSeen = Date.now()
      console.log(`👤 Updated user name: ${oldName} → ${newName}`)
    }
  },

  updateConnectedUsersList(users) {
    // Keep existing users and update their data, add new users
    const existingUserIds = this.locationSharing.connectedUsers.map(u => u.id)
    const newUserIds = users.map(u => u.id)
    
    // Remove users that are no longer connected
    this.locationSharing.connectedUsers = this.locationSharing.connectedUsers.filter(u => 
      newUserIds.includes(u.id)
    )
    
    // Add or update users
    users.forEach(user => {
      const existingUser = this.locationSharing.connectedUsers.find(u => u.id === user.id)
      if (existingUser) {
        // Update existing user
        Object.assign(existingUser, user, { lastSeen: Date.now() })
      } else {
        // Add new user
        this.locationSharing.connectedUsers.push({
          ...user,
          lastSeen: Date.now()
        })
      }
    })
    
    console.log(`📊 Updated users list: ${this.locationSharing.connectedUsers.length} users connected`)
  },

  disableLocationSharing() {
    // Keep location sharing always enabled
    this.locationSharing.isEnabled = true;
    // Only reset connection state, not enabling state
    this.locationSharing.isConnected = false;
    this.locationSharing.currentUser.id = null;
    this.locationSharing.currentUser.name = null;
    this.locationSharing.connectedUsers = [];
    console.log('🔄 Location sharing connection reset but remains enabled')
  },

  /**
   * ===== SPEED TRAP MANAGEMENT METHODS =====
   */

  /**
   * Add a new speed trap to the store
   * @param {Object} speedTrap - Speed trap object
   */
  addSpeedTrap(speedTrap) {
    const existingTrapIndex = this.speedTraps.findIndex(trap => trap.id === speedTrap.id);
    if (existingTrapIndex === -1) {
      this.speedTraps.push(speedTrap);
      console.log('🚨 Speed trap added to store:', speedTrap);
    } else {
      // Update existing trap
      this.speedTraps[existingTrapIndex] = speedTrap;
      console.log('🚨 Speed trap updated in store:', speedTrap);
    }
  },

  /**
   * Remove a speed trap from the store
   * @param {string} trapId - Speed trap ID to remove
   */
  removeSpeedTrap(trapId) {
    const trapIndex = this.speedTraps.findIndex(trap => trap.id === trapId);
    if (trapIndex !== -1) {
      const removedTrap = this.speedTraps.splice(trapIndex, 1)[0];
      console.log('🗑️ Speed trap removed from store:', removedTrap);
    }
  },

  /**
   * Update speed trap verification/reports
   * @param {string} trapId - Speed trap ID
   * @param {Object} updates - Updates to apply
   */
  updateSpeedTrap(trapId, updates) {
    const trap = this.speedTraps.find(trap => trap.id === trapId);
    if (trap) {
      Object.assign(trap, updates);
      console.log('🔄 Speed trap updated:', trap);
    }
  },

  /**
   * Update the entire speed traps list
   * @param {Array} speedTraps - Array of speed trap objects
   */
  updateSpeedTrapsList(speedTraps) {
    this.speedTraps = speedTraps;
    console.log(`📊 Updated speed traps list: ${this.speedTraps.length} traps loaded`);
  },

  /**
   * Toggle speed trap display visibility
   */
  toggleSpeedTraps() {
    this.showSpeedTraps = !this.showSpeedTraps;
    console.log(`👁️ Speed traps display: ${this.showSpeedTraps ? 'enabled' : 'disabled'}`);
  },

  /**
   * Get speed traps near a specific location
   * @param {Object} location - Location object with lat, lng
   * @param {number} radius - Search radius in kilometers (default: 5)
   * @returns {Array} Array of nearby speed traps
   */
  getSpeedTrapsNearLocation(location, radius = 5) {
    return this.speedTraps.filter(trap => {
      const distance = this.calculateDistance(
        location.lat, location.lng,
        trap.lat, trap.lng
      );
      return distance <= radius;
    });
  },

  /**
   * Calculate distance between two points (helper method)
   * @param {number} lat1 
   * @param {number} lng1 
   * @param {number} lat2 
   * @param {number} lng2 
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
})
