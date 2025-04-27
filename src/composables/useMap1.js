import { ref, onMounted } from 'vue'
import polyline from '@mapbox/polyline'
import { getSessionToken } from '@/tokenOperations'

const apiKey = 'AIzaSyCnEGAMvieNpzlk641s6HsbIsfVkydLOvI'
const center = ref({ lat: 38.72936883885257, lng: -9.15282508593812 })
const markers = ref([])
const carMarkerIcon = {
  url: 'src/assets/car_images/car_icon.png',
  scaledSize: { width: 40, height: 40 },
}
const routePath = ref([])
const routeOptions = { strokeColor: '#4285F4', strokeOpacity: 0.8, strokeWeight: 6 }
const routeInfo = ref({ duration: '', distance: '' })
const speedLimit = ref(null)
const directions = ['up', 'left', 'right', 'down']
let moveInterval = null
const mapRef = ref(null)

export function useMap1() {
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
        const coords = polyline.decode(route.polyline.encodedPolyline)
        routePath.value = coords.map(([lat, lng]) => ({ lat, lng }))
  
        // Format time and distance
        const match = route.duration.match(/(\d+)s/)
        const seconds = match ? parseInt(match[1], 10) : 0
        const minutes = Math.floor(seconds / 60)
        routeInfo.value = {
          duration: `${minutes} min`,
          distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }

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

  onMounted(() => {
    // const token = getSessionToken()
    // if (token) {
    //   email.value = token
    //   isAuthenticated.value = true
    // }

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

  return { apiKey, center, markers, carMarkerIcon, routePath, routeOptions, addMarker, centerMap, routeInfo, directions, startMoving, stopMoving, speedLimit }
}
