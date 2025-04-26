<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div v-if="!isAuthenticated" class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-4">Login or Register</h1>
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full p-2 mb-2 border rounded"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full p-2 mb-2 border rounded"
      />

      <button @click="login" id="loginButton" class="w-full bg-blue-500 text-white p-2 rounded">
        Login
      </button>
      <button
        @click="register"
        id="registerButton"
        class="w-full bg-green-500 text-white p-2 rounded"
      >
        Register
      </button>
    </div>

    <div v-else>
      <!-- Top Bar -->
      <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div class="text-lg font-semibold">MyWaze</div>
        <div class="flex space-x-4">
          <button @click="toggleVehicleMenu" class="bg-purple-500 px-4 py-2 rounded">
            Register Vehicle
          </button>
          <button @click="toggleVehicleList" class="bg-gray-500 px-4 py-2 rounded">
            Show Registered Vehicles
          </button>
          <button @click="logout" class="bg-red-500 px-4 py-2 rounded">Logout</button>
        </div>
      </div>

      <div class="mb-4">
        <div v-if="showVehicleMenu" class="mt-2 p-4 bg-white rounded shadow">
          <label for="brand" class="block mb-2">Car Brand:</label>
          <select
            v-model="selectedBrand"
            @change="updateModels"
            id="brand"
            class="w-full p-2 mb-2 border rounded"
          >
            <option value="">Select a brand</option>
            <option v-for="brand in carDatabase" :key="brand.brand" :value="brand.brand">
              {{ brand.brand }}
            </option>
          </select>

          <label for="model" class="block mb-2">Car Model:</label>
          <select v-model="selectedModel" id="model" class="w-full p-2 mb-2 border rounded">
            <option value="">Select a model</option>
            <option v-for="model in availableModels" :key="model.name" :value="model.name">
              {{ model.name }}
            </option>
          </select>

          <label for="name" class="block mb-2">Vehicle Name:</label>
          <input
            v-model="vehicleName"
            type="text"
            id="name"
            placeholder="Vehicle Name"
            class="w-full p-2 mb-2 border rounded"
          />

          <button @click="registerVehicle" class="w-full bg-blue-500 text-white p-2 rounded">
            Submit
          </button>
        </div>
      </div>
      <div class="mb-4">
        <ul v-if="showVehicleList" class="bg-white rounded shadow p-4">
          <li v-for="(v, index) in vehicles" :key="index" class="border-b py-2 flex items-center">
            <img
              :src="v.image || 'src/assets/car_images/placeholder_car.jpg'"
              alt="Car Image"
              class="w-16 h-16 mr-4 object-cover rounded"
            />
            <div>{{ v.name }} ({{ v.brand }} - {{ v.model }})</div>
          </li>
        </ul>
      </div>
      <GoogleMap
        api-key="AIzaSyCnEGAMvieNpzlk641s6HsbIsfVkydLOvI"
        style="width: 100%; height: 500px"
        :center="center"
        :zoom="15"
        @click="addMarker"
      >
        <Marker v-for="(marker, index) in markers" :key="index" :options="{ position: marker }" />
        <Marker :options="{ position: center, icon: carMarkerIcon }" />
        <Polyline :path="routePath" :options="routeOptions" />
      </GoogleMap>
      <button @click="centerMap" class="bg-blue-500 text-white p-2 rounded mt-4">Center Map</button>
      <div class="bg-white p-4 mt-4 rounded shadow" v-if="routeInfo.duration">
        <p><strong>Estimated Time:</strong> {{ routeInfo.duration }}</p>
        <p><strong>Distance:</strong> {{ routeInfo.distance }}</p>
      </div>


      <div class="flex justify-center space-x-4 mt-4">
        <button
          @mousedown="startMoving('up')"
          @mouseup="stopMoving"
          class="bg-blue-500 text-white p-2 rounded"
        >
          Up
        </button>
        <button
          @mousedown="startMoving('left')"
          @mouseup="stopMoving"
          class="bg-blue-500 text-white p-2 rounded"
        >
          Left
        </button>
        <button
          @mousedown="startMoving('right')"
          @mouseup="stopMoving"
          class="bg-blue-500 text-white p-2 rounded"
        >
          Right
        </button>
        <button
          @mousedown="startMoving('down')"
          @mouseup="stopMoving"
          class="bg-blue-500 text-white p-2 rounded"
        >
          Down
        </button>
      </div>

      <div class="speed-limit-display bg-gray-800 text-white p-2 rounded fixed bottom-4 right-4">
        <p>Speed Limit: {{ speedLimit ? speedLimit + ' km/h' : 'Loading...' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { carDatabase } from './carDatabase.js'
import { GoogleMap, Marker, Polyline } from 'vue3-google-map'
import { UserManager } from './UserManager'
import { setSessionToken, getSessionToken } from './tokenOperations.js'
import polyline from '@mapbox/polyline'

const email = ref('')
const password = ref('')
const isAuthenticated = ref(false)
const vehicleName = ref('')
const selectedBrand = ref('')
const selectedModel = ref('')
const availableModels = ref([])
const vehicles = ref([])
const showVehicleMenu = ref(false)
const showVehicleList = ref(false)
const center = ref({ lat: 38.72936883885257, lng: -9.15282508593812 })
const mapRef = ref(null) // Declare mapRef as a reactive reference
const speedLimit = ref(null) // Reactive reference for speed limit
const markers = ref([]) // Reactive reference for destination markers
const routePath = ref([])
const routeOptions = {
  strokeColor: '#4285F4',
  strokeOpacity: 0.8,
  strokeWeight: 6,
}
const routeInfo = ref({ duration: '', distance: '' })


const carMarkerIcon = {
  url: 'src/assets/car_images/car_icon.png', // Custom car marker image
  scaledSize: { width: 40, height: 40 }, // Adjust size as needed
}

const userManager = new UserManager()

const login = () => {
  try {
    userManager.login(email.value, password.value)
    isAuthenticated.value = true
    setSessionToken(email.value)
  } catch (e) {
    alert(e.message)
  }
}

const register = () => {
  try {
    userManager.register(email.value, password.value)
    isAuthenticated.value = true
    setSessionToken(email.value)
  } catch (e) {
    alert(e.message)
  }
}

const toggleVehicleMenu = () => {
  showVehicleMenu.value = !showVehicleMenu.value
}

const toggleVehicleList = () => {
  showVehicleList.value = !showVehicleList.value
}

const updateModels = () => {
  if (!selectedBrand.value) {
    availableModels.value = carDatabase.flatMap((b) => b.models)
  } else {
    const brand = carDatabase.find((b) => b.brand === selectedBrand.value)
    availableModels.value = brand ? brand.models : []
  }
  selectedModel.value = ''
}

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
    vehicleName.value = ''
    selectedBrand.value = ''
    selectedModel.value = ''
    availableModels.value = []
    showVehicleMenu.value = false
  }
}

const logout = () => {
  document.cookie = 'sessionToken=; path=/; max-age=0'
  isAuthenticated.value = false
}

const snapToNearestRoad = async (lat, lng, updateCenter = true) => {
  try {
    const response = await fetch(
      `https://roads.googleapis.com/v1/nearestRoads?points=${lat},${lng}&key=AIzaSyCnEGAMvieNpzlk641s6HsbIsfVkydLOvI`,
    )
    const data = await response.json()

    if (data.snappedPoints && data.snappedPoints.length > 0) {
      const snappedLocation = data.snappedPoints[0].location
      if (updateCenter) {
        center.value = {
          lat: snappedLocation.latitude,
          lng: snappedLocation.longitude,
        }

        // Explicitly update the map's center if the mapRef is available
        if (mapRef.value) {
          mapRef.value.panTo(center.value)
        }

        // Fetch the speed limit from the Google Roads API
        fetchSpeedLimit(snappedLocation.latitude, snappedLocation.longitude)
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

const fetchSpeedLimit = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://roads.googleapis.com/v1/speedLimits?path=${lat},${lng}&key=AIzaSyCnEGAMvieNpzlk641s6HsbIsfVkydLOvI`,
    )
    const data = await response.json()
    if (data.speedLimits && data.speedLimits.length > 0) {
      speedLimit.value = data.speedLimits[0].speedLimit
    } else {
      speedLimit.value = null
    }
  } catch (error) {
    console.error('Error fetching speed limit:', error)
    speedLimit.value = null
  }
}

const centerMap = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        await snapToNearestRoad(userLat, userLng)
      },
      (error) => {
        console.error('Error obtaining location:', error)
      },
    )
  } else {
    console.error('Geolocation is not supported by this browser.')
  }
}

const movePosition = async (direction) => {
  const step = 0.0001 // Adjust this value to change the step size
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
}

let moveInterval = null // Variable to store the interval ID

const startMoving = (direction) => {
  if (moveInterval) return // Prevent multiple intervals

  moveInterval = setInterval(() => {
    movePosition(direction)
  }, 50) // Adjust the interval speed as needed (100ms)
}

const stopMoving = () => {
  if (moveInterval) {
    clearInterval(moveInterval)
    moveInterval = null
  }
}

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

    // Automatically calculate the route to the destination
    await calculateRoute()
  } else {
    console.warn('Could not snap marker to the nearest road.')
  }
}

const calculateRoute = async () => {
  if (markers.value.length === 0) {
    console.warn('No destination marker set.')
    return
  }

  const destination = markers.value[0]
  const origin = center.value
  
  try {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': 'AIzaSyCnEGAMvieNpzlk641s6HsbIsfVkydLOvI',
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
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
        }),
      }
    )

    const data = await response.json()
    const route = data.routes?.[0]

    if (route) {
      // Decode polyline
      routePath.value = decodePolyline(route.polyline.encodedPolyline)

      // Format time and distance
      routeInfo.value = {
        duration: formatDuration(route.duration),
        distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
      }
    }
  } catch (error) {
    console.error('Error fetching route:', error)
  }
}

function decodePolyline(encoded) {
  const coords = polyline.decode(encoded)
  return coords.map(([lat, lng]) => ({ lat, lng }))
}

function formatDuration(durationStr) {
  const match = durationStr.match(/(\d+)s/)
  const seconds = match ? parseInt(match[1], 10) : 0
  const minutes = Math.floor(seconds / 60)
  return `${minutes} min`
}

onMounted(() => {
  const token = getSessionToken()
  if (token) {
    email.value = token
    isAuthenticated.value = true
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        try {
          await snapToNearestRoad(userLat, userLng)
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
})
</script>

<style>
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 16px; /* Add padding to everything */
  margin: 0;
  box-sizing: border-box;
}

/* Ensure content stretches to the sides with slight side margins */
.min-h-screen {
  padding-top: 4rem; /* Adjust based on the height of the top bar */
  margin: 0 auto;
  max-width: 1200px; /* Optional: Limit the maximum width */
}

/* Add padding and margins to other elements */
.bg-gray-100 {
  padding: 16px;
}

.bg-white {
  padding: 16px;
  margin: 8px 0;
}

button {
  margin: 8px;
}
</style>
