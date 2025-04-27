<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'

export default {
  name: 'MapWrapper',
  props: {
    center: {
      type: Object,
      default: () => ({ lat: 38.7223, lng: -9.1393 }), // Default to Lisbon
    },
    zoom: {
      type: Number,
      default: 15,
    },
    markers: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['click', 'center-changed'],
  setup(props, { emit }) {
    const mapContainer = ref(null)
    let map = null
    let mapMarkers = []
    let userMarker = null
    let routePolyline = null

    // Load Leaflet CSS dynamically
    const loadLeafletCSS = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    // Load Leaflet JS dynamically
    const loadLeafletJS = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve(window.L)
          return
        }

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        script.onload = () => resolve(window.L)
        document.head.appendChild(script)
      })
    }

    const initMap = async () => {
      // Load Leaflet CSS
      loadLeafletCSS()

      // Load Leaflet JS
      const L = await loadLeafletJS()

      // Add car icon for user location
      const carIcon = L.icon({
        iconUrl: '../assets/car_images/car_icon.png',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        // Add fallback to default marker if icon fails to load
        className: 'car-marker-icon',
      })

      try {
        // Make sure the map container is visible and has dimensions
        mapContainer.value.style.display = 'block'

        // Log for debugging
        console.log(
          'Map container dimensions:',
          mapContainer.value.offsetWidth,
          mapContainer.value.offsetHeight,
        )

        // Create the map with explicit size
        map = L.map(mapContainer.value, {
          center: [props.center.lat, props.center.lng],
          zoom: props.zoom,
          zoomControl: true,
        })

        // Explicitly call invalidateSize to handle any sizing issues
        setTimeout(() => {
          if (map) map.invalidateSize()
        }, 100)

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map)

        // Add user marker (car)
        userMarker = L.marker([props.center.lat, props.center.lng], {
          icon: carIcon,
        }).addTo(map)

        // Add click listener
        map.on('click', (e) => {
          const clickEvent = {
            latLng: {
              lat: () => e.latlng.lat,
              lng: () => e.latlng.lng,
            },
          }
          emit('click', clickEvent)
        })

        // Add any initial markers
        updateMarkers()

        console.log('Map initialized successfully')
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    const updateMarkers = () => {
      if (!map || !window.L) return

      // Clear existing markers
      mapMarkers.forEach((marker) => marker.remove())
      mapMarkers = []

      // Add new markers
      props.markers.forEach((markerPos) => {
        const marker = L.marker([markerPos.lat, markerPos.lng]).addTo(map)
        mapMarkers.push(marker)
      })

      // Create route polyline if there are markers
      if (props.markers.length > 0 && window.L) {
        if (routePolyline) {
          routePolyline.remove()
        }

        const path = [[props.center.lat, props.center.lng]]
        props.markers.forEach((marker) => {
          path.push([marker.lat, marker.lng])
        })

        routePolyline = L.polyline(path, {
          color: '#4285F4',
          weight: 5,
          opacity: 0.8,
        }).addTo(map)

        // Fit bounds to show the entire route
        if (path.length > 1) {
          map.fitBounds(path)
        }
      }
    }

    // Watch for changes in props
    watch(
      () => props.center,
      (newCenter) => {
        if (map && userMarker && window.L) {
          userMarker.setLatLng([newCenter.lat, newCenter.lng])
          map.panTo([newCenter.lat, newCenter.lng])
        }
      },
      { deep: true },
    )

    watch(
      () => props.zoom,
      (newZoom) => {
        if (map) {
          map.setZoom(newZoom)
        }
      },
    )

    watch(
      () => props.markers,
      () => {
        updateMarkers()
      },
      { deep: true },
    )

    onMounted(() => {
      initMap()
    })

    onUnmounted(() => {
      // Clean up
      if (map) {
        map.remove()
      }
      map = null
    })

    return {
      mapContainer,
    }
  },
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 500px; /* Ensure the container has a minimum height */
  background-color: #f0f0f0; /* Add background color to see container boundaries */
}
</style>
