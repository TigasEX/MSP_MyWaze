<template>
  <div class="min-h-screen bg-white-100">
    <!-- Login/Registration Screen -->
    <div v-if="!isAuthenticated" class="login-container">
      <!-- Welcome Header with Animation -->
      <div class="welcome-container">
        <h1 class="welcome-text">Welcome to <span class="app-name">MyWaze</span></h1>
        <div class="car-animation">
          <div class="car">🚗</div>
          <div class="road"></div>
        </div>
      </div>

      <!-- Login/Register Card with Tabs -->
      <div class="login-card">
        <div class="login-tabs">
          <button
            @click="activeTab = 'login'"
            :class="['tab-btn', activeTab === 'login' ? 'active' : '']"
          >
            <span class="tab-icon">🔑</span> Login
          </button>
          <button
            @click="activeTab = 'register'"
            :class="['tab-btn', activeTab === 'register' ? 'active' : '']"
          >
            <span class="tab-icon">📝</span> Register
          </button>
        </div>

        <!-- Form Content -->
        <div class="form-container">
          <h2 class="form-title">
            {{ activeTab === 'login' ? 'Welcome Back!' : 'Create Account' }}
          </h2>

          <div class="input-group">
            <label for="email" class="input-label">Email</label>
            <input
              v-model="email"
              type="email"
              id="email"
              placeholder="Enter your email"
              class="input-field"
            />
          </div>

          <div class="input-group">
            <label for="password" class="input-label">Password</label>
            <input
              v-model="password"
              type="password"
              id="password"
              placeholder="Enter your password"
              class="input-field"
            />
          </div>

          <!-- Dynamic Button based on active tab -->
          <button
            v-if="activeTab === 'login'"
            @click="login"
            id="loginButton"
            class="submit-btn login-btn"
          >
            <span class="btn-icon">🔐</span> Sign In
          </button>
          <button v-else @click="register" id="registerButton" class="submit-btn register-btn">
            <span class="btn-icon">✨</span> Create Account
          </button>

          <!-- Form Footer with Toggle Link -->
          <p class="form-footer">
            {{ activeTab === 'login' ? 'No account yet? ' : 'Already have an account? ' }}
            <a
              @click.prevent="activeTab = activeTab === 'login' ? 'register' : 'login'"
              href="#"
              class="form-link"
            >
              {{ activeTab === 'login' ? 'Create one' : 'Sign in' }}
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- Main Application (authenticated view) -->
    <div v-else class="app-container">
      <!-- App Header/Navigation Bar -->
      <div class="top-bar">
        <div class="logo">
          <span class="logo-icon">🚗</span>
          <span class="logo-text">MyWaze</span>
        </div>
        <div class="nav-buttons">
          <button @click="toggleVehicleMenu" class="nav-button register-btn">
            <span class="button-icon">🚘</span>
            <span class="button-text">Register Vehicle</span>
          </button>
          <button @click="toggleVehicleList" class="nav-button show-btn">
            <span class="button-icon">📋</span>
            <span class="button-text">My Vehicles</span>
          </button>
          <button @click="logout" class="nav-button logout-btn">
            <span class="button-icon">🚪</span>
            <span class="button-text">Logout</span>
          </button>
        </div>
      </div>

      <!-- Vehicle Registration Modal -->
      <div v-if="showVehicleMenu" class="modal-overlay" @click.self="toggleVehicleMenu">
        <div class="modal-container">
          <div class="modal-header">
            <h2>🚘 Register New Vehicle</h2>
            <button @click="toggleVehicleMenu" class="close-button">×</button>
          </div>
          <div class="modal-content">
            <!-- Vehicle Registration Form -->
            <div class="form-group">
              <label for="brand" class="form-label">Car Brand:</label>
              <select v-model="selectedBrand" @change="updateModels" id="brand" class="form-input">
                <option value="">Select a brand</option>
                <option v-for="brand in carDatabase" :key="brand.brand" :value="brand.brand">
                  {{ brand.brand }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="model" class="form-label">Car Model:</label>
              <select v-model="selectedModel" id="model" class="form-input">
                <option value="">Select a model</option>
                <option v-for="model in availableModels" :key="model.name" :value="model.name">
                  {{ model.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="name" class="form-label">Vehicle Name:</label>
              <input
                v-model="vehicleName"
                type="text"
                id="name"
                placeholder="My Car"
                class="form-input"
              />
            </div>

            <button @click="registerVehicle" class="submit-button">
              <span class="mr-2">✅</span> Register Vehicle
            </button>
          </div>
        </div>
      </div>

      <!-- Vehicle List Modal -->
      <div v-if="showVehicleList" class="modal-overlay" @click.self="toggleVehicleList">
        <div class="modal-container vehicle-list-modal">
          <div class="modal-header">
            <h2>📋 My Vehicles</h2>
            <button @click="toggleVehicleList" class="close-button">×</button>
          </div>
          <div class="modal-content">
            <!-- Empty State -->
            <div v-if="vehicles.length === 0" class="empty-vehicles">
              <p>You haven't registered any vehicles yet.</p>
            </div>

            <!-- Vehicle List -->
            <ul v-else class="vehicle-list">
              <li v-for="(v, index) in vehicles" :key="index" class="vehicle-item">
                <img
                  :src="v.image || 'src/assets/car_images/placeholder_car.jpg'"
                  alt="Car Image"
                  class="vehicle-image"
                />
                <div class="vehicle-info">
                  <div class="vehicle-name">{{ v.name }}</div>
                  <div class="vehicle-details">{{ v.brand }} {{ v.model }}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Main Content Area with Map -->
      <div class="main-content">
        <div class="map-container">
          <!-- Google Map Component -->
          <GoogleMap
            ref="mapRef"
            :api-key="googleMapsApiKey"
            :libraries="['geometry']"
            style="width: 100%; height: 500px"
            :center="center"
            :zoom="15"
            @click="addMarker"
            :options="mapOptions"
          >
            <!-- Destination Markers -->
            <Marker
              v-for="(marker, index) in markers"
              :key="index"
              :options="{ position: marker }"
            />

            <!-- User Position Marker -->
            <Marker :options="{ position: center, icon: carMarkerIcon }" />

            <!-- Route Visualization -->
            <Polyline
              v-if="routePath"
              :options="{
                path: routePath,
                strokeColor: '#4285F4',
                strokeWeight: 5,
                strokeOpacity: 0.8,
              }"
            />
          </GoogleMap>

          <!-- Map Controls Section -->
          <div class="map-controls">
            <!-- Center Map Button -->
            <button @click="centerMap" class="control-button center-btn">
              <span class="mr-2">📍</span> Center Map
            </button>

            <!-- User Instructions -->
            <div class="instructions-block">
              <p>
                <span class="instruction-icon">🖱️</span> Click on the map to set your destination
              </p>
              <p>
                <span class="instruction-icon">⌨️</span> Use <strong>W A S D</strong> keys to move
                around
              </p>
            </div>

            <!-- WASD Keyboard Controls -->
            <div class="direction-controls">
              <!-- Top row (W key) -->
              <div class="key-row">
                <button
                  @mousedown="startMoving('up')"
                  @mouseup="stopMoving"
                  @mouseleave="stopMoving"
                  class="direction-button up-btn"
                >
                  W
                </button>
              </div>
              <!-- Bottom row (A, S, D keys) -->
              <div class="key-row">
                <button
                  @mousedown="startMoving('left')"
                  @mouseup="stopMoving"
                  @mouseleave="stopMoving"
                  class="direction-button left-btn"
                >
                  A
                </button>
                <button
                  @mousedown="startMoving('down')"
                  @mouseup="stopMoving"
                  @mouseleave="stopMoving"
                  class="direction-button down-btn"
                >
                  S
                </button>
                <button
                  @mousedown="startMoving('right')"
                  @mouseup="stopMoving"
                  @mouseleave="stopMoving"
                  class="direction-button right-btn"
                >
                  D
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Information Panels -->
        <div class="info-panels">
          <!-- Speed Limit Panel -->
          <div class="info-panel speed-panel">
            <div class="info-icon">🚦</div>
            <div class="info-content">
              <div class="info-label">Speed Limit</div>
              <div class="info-value">{{ speedLimit ? speedLimit + ' km/h' : 'Loading...' }}</div>
            </div>
          </div>

          <!-- Route Details Panel (conditional) -->
          <div v-if="routeDetails" class="info-panel route-panel">
            <div class="info-icon">🗺️</div>
            <div class="info-content">
              <div class="info-label">Route Details</div>
              <div class="info-value">{{ (routeDetails.distance / 1000).toFixed(1) }} km</div>
              <div class="info-value">{{ Math.round(routeDetails.duration / 60) }} min</div>
              <button @click="removeRoute" class="remove-route-btn">
                <span class="mr-1">❌</span> Cancel Route
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/*
 * MyWaze Navigation Application
 *
 * A web-based navigation application similar to Waze, with features for:
 * - User authentication (login/register)
 * - Vehicle registration and management
 * - Real-time map navigation with Google Maps integration
 * - Route calculation and display
 * - Speed limit information
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { carDatabase } from './carDatabase.js'
import { GoogleMap, Marker, Polyline } from 'vue3-google-map'
import { UserManager } from './UserManager'
import { setSessionToken, getSessionToken } from './tokenOperations.js'
import polyline from '@mapbox/polyline'

// ===== API Keys =====
const googleMapsApiKey =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCnEGAMvieNpzlk641s6HsbIsfVkydLOvI'
const hereApiKey =
  import.meta.env.VITE_HERE_API_KEY || 'E8BluGNf-3wGQ2h_JF5OL2IPga_QKsaj4nmdrzLyhgg'

// ===== Authentication State =====
const activeTab = ref('login')
const email = ref('')
const password = ref('')
const isAuthenticated = ref(false)

// ===== Vehicle Management State =====
const vehicleName = ref('')
const selectedBrand = ref('')
const selectedModel = ref('')
const availableModels = ref([])
const vehicles = ref([])
const showVehicleMenu = ref(false)
const showVehicleList = ref(false)

// ===== Map & Navigation State =====
const center = ref({ lat: 38.72936883885257, lng: -9.15282508593812 }) // Starting position (Lisbon)
const mapRef = ref(null)
const speedLimit = ref(null)
const markers = ref([]) // Destination markers
const routeDetails = ref(null)
const routePath = ref(null)
const routeTime = ref('')
const timeOfArrival = ref('')
const currentDistance = ref(0)
const routeDefined = ref(false)

// Map configuration options
const mapOptions = {
  keyboardShortcuts: false, // Disable keyboard shortcuts for map to use WASD for movement
  gestureHandling: 'cooperative',
  disableDefaultUI: false,
}

// Car marker icon configuration
const carMarkerIcon = {
  url: 'src/assets/car_images/car_icon.png',
  scaledSize: { width: 40, height: 40 },
}

// Initialize user management
const userManager = new UserManager()

/**
 * ===== Authentication Functions =====
 */

// Log in with existing account
const login = () => {
  try {
    userManager.login(email.value, password.value)
    isAuthenticated.value = true
    setSessionToken(email.value)
  } catch (e) {
    alert(e.message)
  }
}

// Register a new account
const register = () => {
  try {
    userManager.register(email.value, password.value)
    isAuthenticated.value = true
    setSessionToken(email.value)
  } catch (e) {
    alert(e.message)
  }
}

// Log out and clear session
const logout = () => {
  document.cookie = 'sessionToken=; path=/; max-age=0'
  isAuthenticated.value = false
}

/**
 * ===== Vehicle Management Functions =====
 */

// Toggle vehicle registration modal
const toggleVehicleMenu = () => {
  showVehicleMenu.value = !showVehicleMenu.value
}

// Toggle vehicle list modal
const toggleVehicleList = () => {
  showVehicleList.value = !showVehicleList.value
}

// Update available models when brand is selected
const updateModels = () => {
  if (!selectedBrand.value) {
    availableModels.value = carDatabase.flatMap((b) => b.models)
  } else {
    const brand = carDatabase.find((b) => b.brand === selectedBrand.value)
    availableModels.value = brand ? brand.models : []
  }
  selectedModel.value = ''
}

// Register a new vehicle
const registerVehicle = () => {
  if (vehicleName.value && selectedBrand.value && selectedModel.value) {
    const brand = carDatabase.find((b) => b.brand === selectedBrand.value)
    const model = brand?.models.find((m) => m.name === selectedModel.value)
    vehicles.value.push({
      name: vehicleName.value,
      brand: selectedBrand.value,
      model: selectedModel.value,
      image: model?.image || 'src/assets/car_images/placeholder_car.jpg',
    })
    // Reset form fields
    vehicleName.value = ''
    selectedBrand.value = ''
    selectedModel.value = ''
    availableModels.value = []
    showVehicleMenu.value = false
  }
}

/**
 * ===== Map & Navigation Functions =====
 */

// Decode Google Maps polyline encoding to coordinates array
const decodePolyline = (encoded) => {
  if (!encoded) return []

  const poly = []
  let index = 0,
    len = encoded.length
  let lat = 0,
    lng = 0

  while (index < len) {
    let b,
      shift = 0,
      result = 0

    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0

    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    poly.push({ lat: lat * 1e-5, lng: lng * 1e-5 })
  }

  return poly
}

// Snap position to nearest road using Google Roads API
const snapToNearestRoad = async (lat, lng, updateCenter = true) => {
  try {
    const response = await fetch(
      `https://roads.googleapis.com/v1/nearestRoads?points=${lat},${lng}&key=${googleMapsApiKey}`,
    )
    const data = await response.json()

    if (data.snappedPoints && data.snappedPoints.length > 0) {
      const snappedLocation = data.snappedPoints[0].location
      if (updateCenter) {
        center.value = {
          lat: snappedLocation.latitude,
          lng: snappedLocation.longitude,
        }
      }
      return snappedLocation
    } else {
      console.warn('No snapped points found, using original location.')
      return null
    }
  } catch (error) {
    console.error('Error snapping to nearest road:', error)
    return null
  }
}

// Fetch speed limit data from HERE API
const fetchSpeedLimit = async (lat, lng) => {
  try {
    // Convert lat/lng to tile coordinates
    const z = 12
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, z))
    const y = Math.floor(
      ((1 -
        Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
        2) *
        Math.pow(2, z),
    )
    const tileId = y * Math.pow(2, z) + x

    // Get adjacent tiles for better data coverage
    const centerTile = tileId
    const adjacentTiles = [
      centerTile,
      centerTile + 1,
      centerTile - 1,
      centerTile + Math.pow(2, z),
      centerTile - Math.pow(2, z),
      centerTile + Math.pow(2, z) + 1,
    ].join(',')

    // Fetch data from HERE API with environment variable
    const response = await fetch(
      `https://smap.hereapi.com/v8/maps/attributes?layers=SPEED_LIMITS_FC4,SPEED_LIMITS_FC2,SPEED_LIMITS_FC1&in=tile:${adjacentTiles}&apiKey=${hereApiKey}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HERE API responded with status: ${response.status}`)
    }

    const data = await response.json()

    // Process response to extract speed limit
    if (data && data.Tiles && data.Tiles.length > 0) {
      let speedLimits = []

      data.Tiles.forEach((tile) => {
        if (tile.Rows && tile.Rows.length > 0) {
          tile.Rows.forEach((row) => {
            // Extract speed limit values
            const fromLimit = row.FROM_REF_SPEED_LIMIT ? parseInt(row.FROM_REF_SPEED_LIMIT) : null
            const toLimit = row.TO_REF_SPEED_LIMIT ? parseInt(row.TO_REF_SPEED_LIMIT) : null

            if (fromLimit !== null) {
              speedLimits.push({
                value: fromLimit,
                unit: row.SPEED_LIMIT_UNIT || 'M', // M for mph, KMH for km/h
              })
            } else if (toLimit !== null) {
              speedLimits.push({
                value: toLimit,
                unit: row.SPEED_LIMIT_UNIT || 'M',
              })
            }
          })
        }
      })

      // Use the first speed limit found
      if (speedLimits.length > 0) {
        let limit = speedLimits[0].value

        // Convert to km/h if the unit is mph
        if (speedLimits[0].unit === 'M') {
          limit = Math.round(limit * 1.60934) // mph to km/h
        }

        speedLimit.value = limit
      } else {
        speedLimit.value = 50 // Default fallback
      }
    } else {
      // Fallback speed limits if no data is available
      const hashValue = (Math.sin(lat * 10) + Math.cos(lng * 10)) * 10000
      const randomValue = Math.abs(hashValue) % 4
      const speedLimits = [30, 50, 70, 90]
      speedLimit.value = speedLimits[randomValue]
    }
  } catch (error) {
    console.error('Error fetching speed limit from HERE API:', error)
    speedLimit.value = 50 // Default fallback
  }
}

// Center map on user's current location
const centerMap = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        const snappedLocation = await snapToNearestRoad(userLat, userLng)

        if (snappedLocation) {
          if (mapRef.value) {
            // Fetch speed limit when map is centered
            fetchSpeedLimit(center.value.lat, center.value.lng)
          }

          // If there's an active route, recalculate it with the new position
          if (markers.value.length > 0 && routeDefined.value) {
            await calculateRoute()
          }
        } else {
          console.warn('Failed to snap to nearest road or update map center.')
        }
      },
      (error) => {
        console.error('Error obtaining location:', error)
        alert('Unable to fetch your location. Please ensure location services are enabled.')
      },
    )
  } else {
    console.error('Geolocation is not supported by this browser.')
    alert('Geolocation is not supported by your browser.')
  }
}

// Move position in a specified direction
const movePosition = async (direction) => {
  const step = 0.0001 // Movement step size
  let newCenter = { ...center.value }

  switch (direction) {
    case 'up':
      newCenter.lat += step
      break
    case 'down':
      newCenter.lat -= step
      break
    case 'left':
      newCenter.lng -= step
      break
    case 'right':
      newCenter.lng += step
      break
  }

  await snapToNearestRoad(newCenter.lat, newCenter.lng)
  fetchSpeedLimit(center.value.lat, center.value.lng)

  // Recalculate route if active
  if (markers.value.length > 0 && routeDefined.value) {
    await calculateRoute()
  }
}

// Variable to store movement interval
let moveInterval = null

// Start continuous movement in a direction
const startMoving = (direction) => {
  if (moveInterval) return // Prevent multiple intervals

  moveInterval = setInterval(() => {
    movePosition(direction)
  }, 50) // Movement speed (lower = faster)
}

// Stop movement
const stopMoving = () => {
  if (moveInterval) {
    clearInterval(moveInterval)
    moveInterval = null
  }
}

// Add destination marker when clicking on map
const addMarker = async (event) => {
  const lat = event.latLng.lat()
  const lng = event.latLng.lng()

  // Snap the marker to the nearest road
  const snappedLocation = await snapToNearestRoad(lat, lng, false)
  if (snappedLocation) {
    markers.value = [
      {
        lat: snappedLocation.latitude,
        lng: snappedLocation.longitude,
      },
    ]

    // Calculate route to destination
    await calculateRoute()
  } else {
    console.warn('Could not snap marker to the nearest road.')
  }
}

// Calculate route between current position and destination
const calculateRoute = async () => {
  if (markers.value.length === 0) {
    console.warn('No destination marker set.')
    return
  }

  const destination = markers.value[0]
  const origin = center.value

  // Check if destination reached
  const destinationDistance = calculateDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
  )
  if (destinationDistance < 0.005) {
    // 5 meters in kilometers
    console.log('Destination reached! Removing route.')
    removeRoute()
    return
  }

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      }),
    })

    const data = await response.json()
    const route = data.routes?.[0]

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]

      // Extract duration in seconds from response and ensure it's a number
      let durationSeconds = 0
      if (route.duration) {
        if (typeof route.duration === 'string') {
          // If duration is a string like "123s", parse it
          durationSeconds = parseInt(route.duration.replace('s', ''), 10)
        } else if (typeof route.duration === 'number') {
          // If duration is already a number
          durationSeconds = route.duration
        } else if (route.duration.seconds) {
          // If duration is an object with seconds property
          durationSeconds = parseInt(route.duration.seconds, 10)
        }
      }

      // Ensure valid numbers
      const distanceMeters = route.distanceMeters ? Number(route.distanceMeters) : 0

      routeDetails.value = {
        distance: distanceMeters,
        duration: durationSeconds,
      }

      // Decode polyline path for route visualization
      const encodedPolyline = route.polyline.encodedPolyline
      routePath.value = decodePolyline(encodedPolyline)

      routeTime.value = (durationSeconds / 60).toFixed(2) // Minutes
      const arrivalTime = new Date(Date.now() + durationSeconds * 1000)
      timeOfArrival.value = arrivalTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      currentDistance.value = (distanceMeters / 1000).toFixed(2) // Kilometers
      routeDefined.value = true
    } else {
      console.warn('No routes found in the API response.')
      routeDetails.value = null
      routePath.value = null
    }
  } catch (error) {
    console.error('Error fetching route:', error)
    routeDetails.value = null
    routePath.value = null
  }
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI / 180)
}

// Remove active route and markers
const removeRoute = () => {
  routeDetails.value = null
  markers.value = []
  routePath.value = null
  routeDefined.value = false
  routeTime.value = ''
  timeOfArrival.value = ''
  currentDistance.value = 0
}

// ===== Lifecycle Hooks =====
onMounted(() => {
  // Check for existing session
  const token = getSessionToken()
  if (token) {
    email.value = token
    isAuthenticated.value = true
  }

  // Get initial user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        try {
          await snapToNearestRoad(userLat, userLng)
          // Initial fetch of speed limit
          fetchSpeedLimit(center.value.lat, center.value.lng)
        } catch (error) {
          console.error('Error fetching nearest road:', error)
          center.value.lat = userLat
          center.value.lng = userLng
        }
      },
      (error) => {
        console.error('Error obtaining location:', error)
      },
    )
  } else {
    console.error('Geolocation is not supported by this browser.')
  }

  // Add keyboard event listeners for WASD controls
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// Keyboard event handlers
const handleKeyDown = (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
      startMoving('up')
      break
    case 's':
      startMoving('down')
      break
    case 'a':
      startMoving('left')
      break
    case 'd':
      startMoving('right')
      break
  }
}

const handleKeyUp = (event) => {
  if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
    stopMoving()
  }
}
</script>

<style>
/*
 * MyWaze Application Styles
 *
 * This stylesheet contains all styles for the MyWaze navigation application,
 * organized by component/section for better readability and maintenance.
 */

/* ===== Global Styles ===== */
.min-h-screen {
  width: 100%;
  max-width: 100%;
  padding: 0;
  margin: 0;
  background-color: #f8f9fa; /* Light gray background */
}

/* App Container */
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  background-color: #f8f9fa;
}

/* ===== Login/Register Screen ===== */
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

/* Welcome Section */
.welcome-container {
  margin-bottom: 2rem;
  text-align: center;
}

.welcome-text {
  font-size: 2.5rem;
  font-weight: 800;
  color: #2d3748;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.app-name {
  color: #3b82f6;
  position: relative;
  display: inline-block;
}

.app-name::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 2px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scaleX(0.95);
  }
  50% {
    opacity: 1;
    transform: scaleX(1.05);
  }
  100% {
    opacity: 0.6;
    transform: scaleX(0.95);
  }
}

/* Car Animation */
.car-animation {
  position: relative;
  width: 200px;
  height: 40px;
  margin: 0 auto;
}

.car {
  font-size: 2rem;
  position: absolute;
  top: 0;
  animation: drive 3s linear infinite;
}

.road {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #cbd5e0 0%, #4a5568 50%, #cbd5e0 100%);
  border-radius: 2px;
}

@keyframes drive {
  0% {
    left: -30px;
    transform: scaleX(1); /* Car facing right when moving right */
  }
  49% {
    transform: scaleX(-1);
  }
  50% {
    left: 200px;
    transform: scaleX(-1); /* Car facing left when moving left */
  }
  99% {
    transform: scaleX(1);
  }
  100% {
    left: -30px;
    transform: scaleX(1);
  }
}

/* Login Card */
.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Login/Register Tabs */
.login-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: #718096;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  color: #3b82f6;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #3b82f6;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}

.tab-icon {
  margin-right: 0.5rem;
}

/* Form Styles */
.form-container {
  padding: 2rem;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-align: center;
}

.input-group {
  margin-bottom: 1.25rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: #2d3748;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  background-color: white;
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  margin-top: 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn {
  background-color: #3b82f6;
  color: white;
}

.login-btn:hover {
  background-color: #2563eb;
}

.register-btn {
  background-color: #10b981;
  color: white;
}

.register-btn:hover {
  background-color: #059669;
}

.btn-icon {
  margin-right: 0.5rem;
  font-size: 1.125rem;
}

.form-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}

.form-link {
  color: #3b82f6;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s ease;
}

.form-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* ===== Top Navigation Bar ===== */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  padding: 0.8rem 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 1.8rem;
  margin-right: 0.5rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-buttons {
  display: flex;
  gap: 0.8rem;
}

.nav-button {
  display: flex;
  align-items: center;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  color: white;
}

.button-icon {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.register-btn {
  background-color: #10b981;
}

.register-btn:hover {
  background-color: #059669;
}

.show-btn {
  background-color: #6366f1;
}

.show-btn:hover {
  background-color: #4f46e5;
}

.logout-btn {
  background-color: #ef4444;
}

.logout-btn:hover {
  background-color: #dc2626;
}

/* ===== Main Content Area ===== */
.main-content {
  flex: 1;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  background-color: #f8f9fa;
}

/* Map Container */
.map-container {
  width: 100%;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

/* Map Controls */
.map-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.2rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.control-button:hover {
  background-color: #2563eb;
}

/* WASD Keyboard-style Controls */
.direction-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 10px;
  background-color: #e2e8f0;
}

.key-row {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.direction-button {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f3f4f6, #d1d5db);
  border: 1px solid #a0aec0;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.direction-button:hover {
  background: linear-gradient(145deg, #e2e8f0, #cbd5e0);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.direction-button:active {
  background: linear-gradient(145deg, #cbd5e0, #a0aec0);
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Instructions Block */
.instructions-block {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-left: 4px solid #0ea5e9;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin: 0 1rem;
}

.instructions-block p {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #0369a1;
}

.instruction-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.instructions-block strong {
  font-weight: 600;
  background-color: #e0f2fe;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
}

/* ===== Information Panels ===== */
.info-panels {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.info-panel {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-icon {
  font-size: 1.8rem;
  margin-right: 1rem;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.remove-route-btn {
  display: flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  background-color: #f87171;
  color: white;
  border: none;
  border-radius: 4px;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-route-btn:hover {
  background-color: #ef4444;
}

/* ===== Modal Components ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal-container {
  background-color: white;
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
}

.modal-content {
  padding: 1.5rem;
}

/* Form Elements in Modals */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-button:hover {
  background-color: #2563eb;
}

/* Vehicle List Modal */
.vehicle-list-modal {
  max-width: 600px;
}

.vehicle-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

.vehicle-item {
  display: flex;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.vehicle-item:last-child {
  border-bottom: none;
}

.vehicle-item:hover {
  background-color: #f9fafb;
}

.vehicle-image {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 1rem;
}

.vehicle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.vehicle-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.vehicle-details {
  color: #6b7280;
  font-size: 0.9rem;
}

.empty-vehicles {
  text-align: center;
  color: #6b7280;
  padding: 2rem 0;
}

/* ===== Responsive Styles ===== */
@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    padding: 0.8rem;
  }

  .logo {
    margin-bottom: 0.5rem;
  }

  .nav-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .nav-button {
    padding: 0.5rem;
  }

  .button-text {
    display: none;
  }

  .button-icon {
    margin-right: 0;
    font-size: 1.4rem;
  }

  .map-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .info-panels {
    flex-direction: column;
  }
}
</style>
