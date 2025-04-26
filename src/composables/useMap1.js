import { ref, onMounted } from 'vue'
import polyline from '@mapbox/polyline'

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

export function useMap1() {
  const snapToNearestRoad = async (lat, lng, updateCenter = true) => { /* same logic */ }
  const fetchSpeedLimit = async (lat, lng) => { /* same logic */ }
  const centerMap = () => { /* same logic */ }
  const addMarker = async (event) => { /* same logic */ }
  const calculateRoute = async () => { /* same logic */ }
  const startMoving = (direction) => { /* same logic */ }
  const stopMoving = () => { /* same logic */ }

  onMounted(() => { /* same logic for geolocation */ })

  return { apiKey, center, markers, carMarkerIcon, routePath, routeOptions, addMarker, centerMap, routeInfo, directions, startMoving, stopMoving, speedLimit }
}
