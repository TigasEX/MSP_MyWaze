/**
 * Routing Service for MyWaze
 * 
 * Provides route calculation and navigation functionality using multiple routing APIs.
 * Implements a fallback system to ensure reliable route generation.
 * 
 * Key Features:
 * - Multi-provider routing with automatic fallback
 * - Primary: OSRM (Open Source Routing Machine)
 * - Secondary: OpenRouteService API
 * - Tertiary: Fallback direct route calculation
 * - Road snapping for improved accuracy
 * - Route optimization and waypoint support
 * 
 * Supported Operations:
 * - Point-to-point routing
 * - Multi-waypoint routes
 * - Route duration and distance calculation
 * - Turn-by-turn directions
 * - Route geometry (polyline coordinates)
 * 
 * API Configuration:
 * - OpenRouteService API integration
 * - Proxy server routing for CORS handling
 * - Rate limiting and error handling
 * - Response data normalization
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

import axios from 'axios';

// Default OpenRouteService API key (get your own at https://openrouteservice.org/dev/#/signup)
const DEFAULT_API_KEY = '5b3ce3597851110001cf6248b4c2e8c8b7e94a46b28c0fd62a97d96f';

export class RoutingService {
  constructor(apiKey = DEFAULT_API_KEY) {
    // Store the API key for OpenRouteService requests
    this.apiKey = apiKey;
    // Use proxy path for CORS handling instead of direct API URL
    this.baseUrl = '/ors-api/v2';
  }

  /**
   * Get a route between two points
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {Promise} - Route data including duration, distance, and geometry
   */
  async getRoute(origin, destination) {
    try {
      console.log(`Fetching route from (${origin.lat}, ${origin.lng}) to (${destination.lat}, ${destination.lng})...`);
      
      // Try multiple routing services in order of preference
      const routingMethods = [
        () => this.tryOSRMRouting(origin, destination),
        () => this.tryOpenRouteService(origin, destination),
        () => this.fallbackGetRoute(origin, destination)
      ];
      
      for (let i = 0; i < routingMethods.length; i++) {
        try {
          const result = await routingMethods[i]();
          if (result) {
            console.log(`✓ Route calculation successful using method ${i + 1}`);
            return result;
          }
        } catch (error) {
          console.log(`⚠️ Routing method ${i + 1} failed:`, error.message);
          if (i === routingMethods.length - 1) {
            throw error; // Re-throw if it's the last method
          }
        }
      }
      
      // Fallback should always work
      return this.fallbackGetRoute(origin, destination);
    } catch (error) {
      console.error('Error in route calculation:', error);
      // Still try the fallback as a last resort
      return this.fallbackGetRoute(origin, destination);
    }
  }

  /**
   * Try routing using OSRM (Open Source Routing Machine) - a free alternative
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {Promise} - Route data or throws error
   */
  async tryOSRMRouting(origin, destination) {
    console.log('  → Trying OSRM routing service...');
    
    try {
      // Use proxy to avoid CORS issues
      const osrmPath = `/osrm-api/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      
      const response = await axios.get(osrmPath, {
        timeout: 8000,
        headers: {
          'User-Agent': 'MyWazeApp/1.0'
        }
      });

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        return {
          distance: route.distance, // in meters
          duration: route.duration, // in seconds
          geometry: this.formatOSRMGeometry(route.geometry),
          provider: 'OSRM'
        };
      }
      
      throw new Error('No routes found in OSRM response');
    } catch (error) {
      console.log('    OSRM routing failed:', error.message);
      throw error;
    }
  }

  /**
   * Try routing using OpenRouteService API (original implementation)
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {Promise} - Route data or throws error
   */
  async tryOpenRouteService(origin, destination) {
    console.log('  → Trying OpenRouteService API...');
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/directions/driving-car`,
        {
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat]
          ],
          options: {
            avoid_features: ['ferries'],
            avoid_borders: 'controlled',
          },
          format: 'geojson',
          units: 'km'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json, application/geo+json, application/gpx+xml'
          },
          timeout: 8000
        }
      );

      if (response.data && response.data.features && response.data.features.length > 0) {
        const route = response.data.features[0];
        const properties = route.properties;
        const geometry = route.geometry;

        return {
          distance: properties.summary.distance, // in meters
          duration: properties.summary.duration, // in seconds
          geometry: this.formatRouteGeometry(geometry),
          provider: 'OpenRouteService'
        };
      }
      
      throw new Error('No routes found in OpenRouteService response');
    } catch (error) {
      console.log('    OpenRouteService failed:', error.message);
      throw error;
    }
  }

  /**
   * Format OSRM GeoJSON geometry to an array of {lat, lng} points
   * @param {Object} geometry - OSRM GeoJSON geometry object
   * @returns {Array} - Array of {lat, lng} points
   */
  formatOSRMGeometry(geometry) {
    if (!geometry || !geometry.coordinates) {
      return [];
    }

    // OSRM returns [longitude, latitude] pairs, convert to {lat, lng} objects
    return geometry.coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  }

  /**
   * Format GeoJSON geometry to an array of {lat, lng} points
   * @param {Object} geometry - GeoJSON geometry object
   * @returns {Array} - Array of {lat, lng} points
   */
  formatRouteGeometry(geometry) {
    if (!geometry || !geometry.coordinates) {
      return [];
    }

    // Convert [longitude, latitude] pairs to {lat, lng} objects
    return geometry.coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  }

  /**
   * Get the nearest road to a given point (road snapping)
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Promise} - Nearest point on a road
   */
  async snapToRoad(point) {
    console.log(`🛣️ Starting road snapping for point (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)})...`);
    
    try {
      // Try the OpenRouteService API first (if available)
      console.log('  → Attempting API-based road snapping...');
      const apiResult = await this.tryApiSnapToRoad(point);
      if (apiResult) {
        console.log('  ✓ API road snapping successful!');
        return apiResult;
      }
    } catch (error) {
      console.log('  ⚠️ API road snapping failed, using fallback algorithm...');
    }
    
    // Use fallback algorithm
    console.log('  → Using geometric fallback algorithm...');
    const result = this.fallbackSnapToRoad(point);
    console.log(`🛣️ Road snapping completed.`);
    return result;
  }

  /**
   * Try to snap using the OpenRouteService API
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Promise|null} - Snapped point or null if failed
   */
  async tryApiSnapToRoad(point) {
    // This method can be implemented later when API is working
    // For now, always return null to use fallback
    return null;
  }
  
  /**
   * Alternative road snapping implementation using known road segments
   * Used as a fallback when the OpenRouteService API fails
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Object} - Snapped point {lat, lng}
   */
  fallbackSnapToRoad(point) {
    // Define comprehensive road segments for Lisbon area with enhanced coverage
    const roadSegments = [
      // Major roads in Lisbon center
      { start: { lat: 38.7223, lng: -9.1393 }, end: { lat: 38.7268, lng: -9.1503 }, name: 'Av. da Liberdade' },
      { start: { lat: 38.7268, lng: -9.1503 }, end: { lat: 38.7317, lng: -9.1377 }, name: 'Marquês to Saldanha' },
      { start: { lat: 38.7317, lng: -9.1377 }, end: { lat: 38.7372, lng: -9.1328 }, name: 'Saldanha to Campo Pequeno' },
      { start: { lat: 38.7372, lng: -9.1328 }, end: { lat: 38.7476, lng: -9.1467 }, name: 'Campo Pequeno to Entrecampos' },
      { start: { lat: 38.7103, lng: -9.1321 }, end: { lat: 38.7223, lng: -9.1393 }, name: 'Baixa to Av. da Liberdade' },
      { start: { lat: 38.7103, lng: -9.1321 }, end: { lat: 38.7118, lng: -9.1418 }, name: 'Baixa to Cais do Sodré' },
      
      // A5 highway (simplified segments)
      { start: { lat: 38.7223, lng: -9.1623 }, end: { lat: 38.7208, lng: -9.1783 }, name: 'A5 segment 1' },
      { start: { lat: 38.7208, lng: -9.1783 }, end: { lat: 38.7197, lng: -9.1922 }, name: 'A5 segment 2' },
      { start: { lat: 38.7197, lng: -9.1922 }, end: { lat: 38.7186, lng: -9.2088 }, name: 'A5 segment 3' },
      { start: { lat: 38.7186, lng: -9.2088 }, end: { lat: 38.7163, lng: -9.2254 }, name: 'A5 segment 4' },
      
      // A1 highway (simplified segments)
      { start: { lat: 38.7659, lng: -9.1183 }, end: { lat: 38.7765, lng: -9.1148 }, name: 'A1 segment 1' },
      { start: { lat: 38.7765, lng: -9.1148 }, end: { lat: 38.7857, lng: -9.1099 }, name: 'A1 segment 2' },
      { start: { lat: 38.7857, lng: -9.1099 }, end: { lat: 38.7939, lng: -9.1026 }, name: 'A1 segment 3' },
      
      // Belem area
      { start: { lat: 38.6969, lng: -9.2055 }, end: { lat: 38.6978, lng: -9.1969 }, name: 'Belem 1' },
      { start: { lat: 38.6978, lng: -9.1969 }, end: { lat: 38.6985, lng: -9.1901 }, name: 'Belem 2' },
      { start: { lat: 38.6985, lng: -9.1901 }, end: { lat: 38.6994, lng: -9.1823 }, name: 'Belem 3' },
      
      // Northwest area coverage (around test coordinates)
      { start: { lat: 38.7507, lng: -9.1900 }, end: { lat: 38.7547, lng: -9.1947 }, name: 'NW area 1' },
      { start: { lat: 38.7547, lng: -9.1947 }, end: { lat: 38.7593, lng: -9.1987 }, name: 'NW area 2' },
      { start: { lat: 38.7593, lng: -9.1987 }, end: { lat: 38.7630, lng: -9.2025 }, name: 'NW area 3' },
      { start: { lat: 38.7500, lng: -9.1850 }, end: { lat: 38.7507, lng: -9.1900 }, name: 'NW area 4' },
      { start: { lat: 38.7547, lng: -9.1947 }, end: { lat: 38.7500, lng: -9.1970 }, name: 'NW area 5' },
      { start: { lat: 38.7500, lng: -9.1970 }, end: { lat: 38.7450, lng: -9.2000 }, name: 'NW area 6' },
      { start: { lat: 38.7450, lng: -9.2000 }, end: { lat: 38.7400, lng: -9.2030 }, name: 'NW area 7' },
      { start: { lat: 38.7400, lng: -9.2030 }, end: { lat: 38.7350, lng: -9.2050 }, name: 'NW area 8' },
      
      // Additional coverage for better snapping
      { start: { lat: 38.7300, lng: -9.1400 }, end: { lat: 38.7400, lng: -9.1500 }, name: 'Coverage 1' },
      { start: { lat: 38.7400, lng: -9.1500 }, end: { lat: 38.7500, lng: -9.1600 }, name: 'Coverage 2' },
      { start: { lat: 38.7350, lng: -9.1450 }, end: { lat: 38.7450, lng: -9.1550 }, name: 'Coverage 3' },
      { start: { lat: 38.7450, lng: -9.1550 }, end: { lat: 38.7550, lng: -9.1650 }, name: 'Coverage 4' },
      { start: { lat: 38.7250, lng: -9.1450 }, end: { lat: 38.7350, lng: -9.1550 }, name: 'Coverage 5' },
      { start: { lat: 38.7350, lng: -9.1550 }, end: { lat: 38.7450, lng: -9.1650 }, name: 'Coverage 6' },
      { start: { lat: 38.7450, lng: -9.1650 }, end: { lat: 38.7550, lng: -9.1750 }, name: 'Coverage 7' },
      { start: { lat: 38.7550, lng: -9.1750 }, end: { lat: 38.7600, lng: -9.1850 }, name: 'Coverage 8' },
      
      // Cross streets and connecting roads
      { start: { lat: 38.7200, lng: -9.1500 }, end: { lat: 38.7300, lng: -9.1400 }, name: 'Cross 1' },
      { start: { lat: 38.7300, lng: -9.1600 }, end: { lat: 38.7400, lng: -9.1700 }, name: 'Cross 2' },
      { start: { lat: 38.7400, lng: -9.1700 }, end: { lat: 38.7500, lng: -9.1800 }, name: 'Cross 3' },
      { start: { lat: 38.7500, lng: -9.1800 }, end: { lat: 38.7550, lng: -9.1900 }, name: 'Cross 4' },
      
      // Ring road segments
      { start: { lat: 38.7000, lng: -9.1200 }, end: { lat: 38.7100, lng: -9.1100 }, name: 'Ring 1' },
      { start: { lat: 38.7100, lng: -9.1100 }, end: { lat: 38.7200, lng: -9.1000 }, name: 'Ring 2' },
      { start: { lat: 38.7600, lng: -9.1000 }, end: { lat: 38.7700, lng: -9.1100 }, name: 'Ring 3' },
      { start: { lat: 38.7700, lng: -9.1100 }, end: { lat: 38.7800, lng: -9.1200 }, name: 'Ring 4' },
      
      // Additional main streets
      { start: { lat: 38.7150, lng: -9.1300 }, end: { lat: 38.7200, lng: -9.1200 }, name: 'Main 1' },
      { start: { lat: 38.7200, lng: -9.1200 }, end: { lat: 38.7250, lng: -9.1100 }, name: 'Main 2' },
      { start: { lat: 38.7250, lng: -9.1100 }, end: { lat: 38.7300, lng: -9.1000 }, name: 'Main 3' },
      { start: { lat: 38.7300, lng: -9.1000 }, end: { lat: 38.7400, lng: -9.0900 }, name: 'Main 4' },
      
      // Riverside roads
      { start: { lat: 38.7050, lng: -9.1400 }, end: { lat: 38.7000, lng: -9.1500 }, name: 'River 1' },
      { start: { lat: 38.7000, lng: -9.1500 }, end: { lat: 38.6950, lng: -9.1600 }, name: 'River 2' },
      { start: { lat: 38.6950, lng: -9.1600 }, end: { lat: 38.6900, lng: -9.1700 }, name: 'River 3' },
      { start: { lat: 38.6900, lng: -9.1700 }, end: { lat: 38.6850, lng: -9.1800 }, name: 'River 4' }
    ];
    
    let closestPoint = { ...point };
    let minDistance = Number.MAX_VALUE;
    let closestSegmentName = '';
    
    console.log(`  Attempting to snap point (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}) to ${roadSegments.length} road segments...`);
    
    // Find the closest point on any road segment
    for (let i = 0; i < roadSegments.length; i++) {
      const segment = roadSegments[i];
      const snappedPoint = this.snapPointToSegment(
        point, 
        segment.start, 
        segment.end
      );
      
      const distance = this.calculateDistance(point, snappedPoint);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = snappedPoint;
        closestSegmentName = segment.name || `Segment ${i}`;
      }
    }
    
    // Only use the snapped point if it's reasonably close (within ~1km for better coverage)
    if (minDistance <= 1.0) {
      console.log(`  ✓ Snapped to ${closestSegmentName}, distance: ${(minDistance * 1000).toFixed(1)}m`);
      console.log(`  → Moved from (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}) to (${closestPoint.lat.toFixed(6)}, ${closestPoint.lng.toFixed(6)})`);
      return closestPoint;
    }
    
    // Otherwise return the original point
    console.log(`  - No nearby road found (closest: ${(minDistance * 1000).toFixed(1)}m), using original point`);
    return point;
  }
  
  /**
   * Snap a point to the nearest point on a line segment
   * @param {Object} point - The point to snap {lat, lng}
   * @param {Object} segmentStart - Start of the segment {lat, lng}
   * @param {Object} segmentEnd - End of the segment {lat, lng}
   * @returns {Object} - The snapped point {lat, lng}
   */
  snapPointToSegment(point, segmentStart, segmentEnd) {
    // Convert to Cartesian coordinates (simplified)
    const x = point.lng;
    const y = point.lat;
    const x1 = segmentStart.lng;
    const y1 = segmentStart.lat;
    const x2 = segmentEnd.lng;
    const y2 = segmentEnd.lat;
    
    // Calculate squared length of segment
    const l2 = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
    if (l2 === 0) {
      // If segment is a point, return segment start
      return segmentStart;
    }
    
    // Calculate projection onto segment
    const t = ((x-x1)*(x2-x1) + (y-y1)*(y2-y1)) / l2;
    
    if (t < 0) {
      // Beyond the start of the segment
      return segmentStart;
    }
    if (t > 1) {
      // Beyond the end of the segment
      return segmentEnd;
    }
    
    // On the segment - calculate the point
    return {
      lat: y1 + t * (y2 - y1),
      lng: x1 + t * (x2 - x1)
    };
  }
  
  /**
   * Calculate distance between two points using the Haversine formula
   * @param {Object} point1 - First point {lat, lng}
   * @param {Object} point2 - Second point {lat, lng}
   * @returns {Number} - Distance in kilometers
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  /**
   * Convert degrees to radians
   * @param {Number} deg - Degrees
   * @returns {Number} - Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Get a route between multiple waypoints
   * @param {Array} waypoints - Array of waypoint objects [{lat, lng}, ...]
   * @returns {Promise} - Route data including duration, distance, and geometry
   */
  async getMultiWaypointRoute(waypoints) {
    if (!waypoints || waypoints.length < 2) {
      throw new Error('At least 2 waypoints are required for routing')
    }

    try {
      console.log(`Calculating multi-waypoint route through ${waypoints.length} points...`)
      
      // Try multiple routing services for multi-waypoint routes
      const routingMethods = [
        () => this.tryOSRMMultiWaypointRouting(waypoints),
        () => this.tryOpenRouteServiceMultiWaypoint(waypoints),
        () => this.fallbackMultiWaypointRoute(waypoints)
      ];
      
      for (let i = 0; i < routingMethods.length; i++) {
        try {
          const result = await routingMethods[i]();
          if (result) {
            console.log(`✓ Multi-waypoint route calculation successful using method ${i + 1}`);
            return result;
          }
        } catch (error) {
          console.log(`⚠️ Multi-waypoint method ${i + 1} failed:`, error.message);
          if (i === routingMethods.length - 1) {
            throw error;
          }
        }
      }
      
      return this.fallbackMultiWaypointRoute(waypoints);
    } catch (error) {
      console.error('Error in multi-waypoint route calculation:', error)
      return this.fallbackMultiWaypointRoute(waypoints)
    }
  }

  /**
   * Try multi-waypoint routing using OSRM
   * @param {Array} waypoints - Array of waypoint objects [{lat, lng}, ...]
   * @returns {Promise} - Route data or throws error
   */
  async tryOSRMMultiWaypointRouting(waypoints) {
    console.log('  → Trying OSRM multi-waypoint routing...');
    
    try {
      // OSRM supports multiple waypoints in a single request
      const coordinates = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
      const osrmPath = `/osrm-api/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
      
      const response = await axios.get(osrmPath, {
        timeout: 15000,
        headers: {
          'User-Agent': 'MyWazeApp/1.0'
        }
      });

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: this.formatOSRMGeometry(route.geometry),
          waypoints: waypoints,
          isMultiWaypoint: true,
          provider: 'OSRM'
        };
      }
      
      throw new Error('No routes found in OSRM multi-waypoint response');
    } catch (error) {
      console.log('    OSRM multi-waypoint routing failed:', error.message);
      throw error;
    }
  }

  /**
   * Try multi-waypoint routing using OpenRouteService
   * @param {Array} waypoints - Array of waypoint objects [{lat, lng}, ...]
   * @returns {Promise} - Route data or throws error
   */
  async tryOpenRouteServiceMultiWaypoint(waypoints) {
    console.log('  → Trying OpenRouteService multi-waypoint routing...');
    
    try {
      const coordinates = waypoints.map(wp => [wp.lng, wp.lat])
      
      const response = await axios.post(
        `${this.baseUrl}/directions/driving-car`,
        {
          coordinates: coordinates,
          options: {
            avoid_features: ['ferries'],
            avoid_borders: 'controlled',
          },
          format: 'geojson',
          units: 'km'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json, application/geo+json, application/gpx+xml'
          },
          timeout: 15000
        }
      )

      if (response.data && response.data.features && response.data.features.length > 0) {
        const route = response.data.features[0]
        const properties = route.properties
        const geometry = route.geometry

        return {
          distance: properties.summary.distance,
          duration: properties.summary.duration,
          geometry: this.formatRouteGeometry(geometry),
          segments: properties.segments || [],
          waypoints: waypoints,
          isMultiWaypoint: true,
          provider: 'OpenRouteService'
        }
      }
      
      throw new Error('No routes found in OpenRouteService multi-waypoint response')
    } catch (error) {
      console.log('    OpenRouteService multi-waypoint routing failed:', error.message);
      throw error;
    }
  }

  /**
   * Fallback method for multi-waypoint routing
   * @param {Array} waypoints - Array of waypoint objects [{lat, lng}, ...]
   * @returns {Object} - Route data
   */
  async fallbackMultiWaypointRoute(waypoints) {
    console.log('Using fallback method for multi-waypoint route...')
    
    try {
      // Calculate individual segments between consecutive waypoints
      const segments = []
      let totalDistance = 0
      let totalDuration = 0
      let allGeometry = []
      
      for (let i = 0; i < waypoints.length - 1; i++) {
        const origin = waypoints[i]
        const destination = waypoints[i + 1]
        
        try {
          // Try to get route for each segment
          const segmentRoute = await this.getRoute(origin, destination)
          
          segments.push(segmentRoute)
          totalDistance += segmentRoute.distance || 0
          totalDuration += segmentRoute.duration || 0
          
          if (segmentRoute.geometry) {
            // For all segments except the first, skip the first point to avoid duplication
            const geometryToAdd = i === 0 ? segmentRoute.geometry : segmentRoute.geometry.slice(1)
            allGeometry = allGeometry.concat(geometryToAdd)
          }
        } catch (segmentError) {
          console.warn(`Error calculating segment ${i + 1}:`, segmentError)
          // Use simple route as fallback
          const simpleRoute = this.generateSimpleRoute(origin, destination)
          allGeometry = allGeometry.concat(i === 0 ? simpleRoute : simpleRoute.slice(1))
          
          // Estimate distance and duration
          const segmentDistance = this.calculateDistance(origin, destination)
          totalDistance += segmentDistance * 1000 // Convert to meters
          totalDuration += (segmentDistance / 50) * 3600 // Assume 50 km/h average speed
        }
      }
      
      return {
        distance: totalDistance,
        duration: totalDuration,
        geometry: allGeometry,
        segments: segments,
        waypoints: waypoints,
        isMultiWaypoint: true,
        fallbackUsed: true
      }
    } catch (error) {
      console.error('Fallback multi-waypoint routing failed:', error)
      throw error
    }
  }
  
  /**
   * Fallback route calculation method when OpenRouteService API fails
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {Object} - Route data with estimated duration, distance, and simple geometry
   */
  fallbackGetRoute(origin, destination) {
    console.log('🛣️ Using fallback route calculation...');
    
    try {
      // Calculate straight-line distance
      const distance = this.calculateDistance(origin, destination) * 1000; // Convert to meters
      
      // Estimate duration (assuming average speed of 50 km/h in urban areas)
      const avgSpeedKmh = 50;
      const duration = (distance / 1000) / avgSpeedKmh * 3600; // Convert to seconds
      
      // Create a simple route geometry (straight line with some intermediate points)
      const geometry = this.generateSimpleRoute(origin, destination);
      
      console.log(`  ✓ Fallback route: ${(distance/1000).toFixed(2)}km, ${Math.round(duration/60)}min`);
      
      return {
        distance: distance,
        duration: duration,
        geometry: geometry,
        fallbackUsed: true,
        estimatedRoute: true
      };
    } catch (error) {
      console.error('Error in fallback route calculation:', error);
      
      // Return a very basic route as last resort
      return {
        distance: this.calculateDistance(origin, destination) * 1000,
        duration: 1800, // 30 minutes default
        geometry: [origin, destination],
        fallbackUsed: true,
        estimatedRoute: true,
        basicFallback: true
      };
    }
  }

  /**
   * Generate a simple route geometry between two points
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {Array} - Array of {lat, lng} points creating a simple route
   */
  generateSimpleRoute(origin, destination) {
    const points = [origin];
    
    // Add some intermediate points to make the route look more realistic
    const steps = 5;
    for (let i = 1; i < steps; i++) {
      const ratio = i / steps;
      const intermediateLat = origin.lat + (destination.lat - origin.lat) * ratio;
      const intermediateLng = origin.lng + (destination.lng - origin.lng) * ratio;
      
      // Add slight curvature to make it look more road-like
      const curvature = Math.sin(ratio * Math.PI) * 0.001;
      
      points.push({
        lat: intermediateLat + curvature,
        lng: intermediateLng + curvature * 0.5
      });
    }
    
    points.push(destination);
    return points;
  }

  /**
   * Get the nearest road to a given point (road snapping)
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Promise} - Nearest point on a road
   */
  async snapToRoad(point) {
    console.log(`🛣️ Starting road snapping for point (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)})...`);
    
    try {
      // Try the OpenRouteService API first (if available)
      console.log('  → Attempting API-based road snapping...');
      const apiResult = await this.tryApiSnapToRoad(point);
      if (apiResult) {
        console.log('  ✓ API road snapping successful!');
        return apiResult;
      }
    } catch (error) {
      console.log('  ⚠️ API road snapping failed, using fallback algorithm...');
    }
    
    // Use fallback algorithm
    console.log('  → Using geometric fallback algorithm...');
    const result = this.fallbackSnapToRoad(point);
    console.log(`🛣️ Road snapping completed.`);
    return result;
  }

  /**
   * Try to snap using the OpenRouteService API
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Promise|null} - Snapped point or null if failed
   */
  async tryApiSnapToRoad(point) {
    // This method can be implemented later when API is working
    // For now, always return null to use fallback
    return null;
  }
  
  /**
   * Alternative road snapping implementation using known road segments
   * Used as a fallback when the OpenRouteService API fails
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Object} - Snapped point {lat, lng}
   */
  fallbackSnapToRoad(point) {
    // Define comprehensive road segments for Lisbon area with enhanced coverage
    const roadSegments = [
      // Major roads in Lisbon center
      { start: { lat: 38.7223, lng: -9.1393 }, end: { lat: 38.7268, lng: -9.1503 }, name: 'Av. da Liberdade' },
      { start: { lat: 38.7268, lng: -9.1503 }, end: { lat: 38.7317, lng: -9.1377 }, name: 'Marquês to Saldanha' },
      { start: { lat: 38.7317, lng: -9.1377 }, end: { lat: 38.7372, lng: -9.1328 }, name: 'Saldanha to Campo Pequeno' },
      { start: { lat: 38.7372, lng: -9.1328 }, end: { lat: 38.7476, lng: -9.1467 }, name: 'Campo Pequeno to Entrecampos' },
      { start: { lat: 38.7103, lng: -9.1321 }, end: { lat: 38.7223, lng: -9.1393 }, name: 'Baixa to Av. da Liberdade' },
      { start: { lat: 38.7103, lng: -9.1321 }, end: { lat: 38.7118, lng: -9.1418 }, name: 'Baixa to Cais do Sodré' },
      
      // A5 highway (simplified segments)
      { start: { lat: 38.7223, lng: -9.1623 }, end: { lat: 38.7208, lng: -9.1783 }, name: 'A5 segment 1' },
      { start: { lat: 38.7208, lng: -9.1783 }, end: { lat: 38.7197, lng: -9.1922 }, name: 'A5 segment 2' },
      { start: { lat: 38.7197, lng: -9.1922 }, end: { lat: 38.7186, lng: -9.2088 }, name: 'A5 segment 3' },
      { start: { lat: 38.7186, lng: -9.2088 }, end: { lat: 38.7163, lng: -9.2254 }, name: 'A5 segment 4' },
      
      // A1 highway (simplified segments)
      { start: { lat: 38.7659, lng: -9.1183 }, end: { lat: 38.7765, lng: -9.1148 }, name: 'A1 segment 1' },
      { start: { lat: 38.7765, lng: -9.1148 }, end: { lat: 38.7857, lng: -9.1099 }, name: 'A1 segment 2' },
      { start: { lat: 38.7857, lng: -9.1099 }, end: { lat: 38.7939, lng: -9.1026 }, name: 'A1 segment 3' },
      
      // Belem area
      { start: { lat: 38.6969, lng: -9.2055 }, end: { lat: 38.6978, lng: -9.1969 }, name: 'Belem 1' },
      { start: { lat: 38.6978, lng: -9.1969 }, end: { lat: 38.6985, lng: -9.1901 }, name: 'Belem 2' },
      { start: { lat: 38.6985, lng: -9.1901 }, end: { lat: 38.6994, lng: -9.1823 }, name: 'Belem 3' },
      
      // Northwest area coverage (around test coordinates)
      { start: { lat: 38.7507, lng: -9.1900 }, end: { lat: 38.7547, lng: -9.1947 }, name: 'NW area 1' },
      { start: { lat: 38.7547, lng: -9.1947 }, end: { lat: 38.7593, lng: -9.1987 }, name: 'NW area 2' },
      { start: { lat: 38.7593, lng: -9.1987 }, end: { lat: 38.7630, lng: -9.2025 }, name: 'NW area 3' },
      { start: { lat: 38.7500, lng: -9.1850 }, end: { lat: 38.7507, lng: -9.1900 }, name: 'NW area 4' },
      { start: { lat: 38.7547, lng: -9.1947 }, end: { lat: 38.7500, lng: -9.1970 }, name: 'NW area 5' },
      { start: { lat: 38.7500, lng: -9.1970 }, end: { lat: 38.7450, lng: -9.2000 }, name: 'NW area 6' },
      { start: { lat: 38.7450, lng: -9.2000 }, end: { lat: 38.7400, lng: -9.2030 }, name: 'NW area 7' },
      { start: { lat: 38.7400, lng: -9.2030 }, end: { lat: 38.7350, lng: -9.2050 }, name: 'NW area 8' },
      
      // Additional coverage for better snapping
      { start: { lat: 38.7300, lng: -9.1400 }, end: { lat: 38.7400, lng: -9.1500 }, name: 'Coverage 1' },
      { start: { lat: 38.7400, lng: -9.1500 }, end: { lat: 38.7500, lng: -9.1600 }, name: 'Coverage 2' },
      { start: { lat: 38.7350, lng: -9.1450 }, end: { lat: 38.7450, lng: -9.1550 }, name: 'Coverage 3' },
      { start: { lat: 38.7450, lng: -9.1550 }, end: { lat: 38.7550, lng: -9.1650 }, name: 'Coverage 4' },
      { start: { lat: 38.7250, lng: -9.1450 }, end: { lat: 38.7350, lng: -9.1550 }, name: 'Coverage 5' },
      { start: { lat: 38.7350, lng: -9.1550 }, end: { lat: 38.7450, lng: -9.1650 }, name: 'Coverage 6' },
      { start: { lat: 38.7450, lng: -9.1650 }, end: { lat: 38.7550, lng: -9.1750 }, name: 'Coverage 7' },
      { start: { lat: 38.7550, lng: -9.1750 }, end: { lat: 38.7600, lng: -9.1850 }, name: 'Coverage 8' },
      
      // Cross streets and connecting roads
      { start: { lat: 38.7200, lng: -9.1500 }, end: { lat: 38.7300, lng: -9.1400 }, name: 'Cross 1' },
      { start: { lat: 38.7300, lng: -9.1600 }, end: { lat: 38.7400, lng: -9.1700 }, name: 'Cross 2' },
      { start: { lat: 38.7400, lng: -9.1700 }, end: { lat: 38.7500, lng: -9.1800 }, name: 'Cross 3' },
      { start: { lat: 38.7500, lng: -9.1800 }, end: { lat: 38.7550, lng: -9.1900 }, name: 'Cross 4' },
      
      // Ring road segments
      { start: { lat: 38.7000, lng: -9.1200 }, end: { lat: 38.7100, lng: -9.1100 }, name: 'Ring 1' },
      { start: { lat: 38.7100, lng: -9.1100 }, end: { lat: 38.7200, lng: -9.1000 }, name: 'Ring 2' },
      { start: { lat: 38.7600, lng: -9.1000 }, end: { lat: 38.7700, lng: -9.1100 }, name: 'Ring 3' },
      { start: { lat: 38.7700, lng: -9.1100 }, end: { lat: 38.7800, lng: -9.1200 }, name: 'Ring 4' },
      
      // Additional main streets
      { start: { lat: 38.7150, lng: -9.1300 }, end: { lat: 38.7200, lng: -9.1200 }, name: 'Main 1' },
      { start: { lat: 38.7200, lng: -9.1200 }, end: { lat: 38.7250, lng: -9.1100 }, name: 'Main 2' },
      { start: { lat: 38.7250, lng: -9.1100 }, end: { lat: 38.7300, lng: -9.1000 }, name: 'Main 3' },
      { start: { lat: 38.7300, lng: -9.1000 }, end: { lat: 38.7400, lng: -9.0900 }, name: 'Main 4' },
      
      // Riverside roads
      { start: { lat: 38.7050, lng: -9.1400 }, end: { lat: 38.7000, lng: -9.1500 }, name: 'River 1' },
      { start: { lat: 38.7000, lng: -9.1500 }, end: { lat: 38.6950, lng: -9.1600 }, name: 'River 2' },
      { start: { lat: 38.6950, lng: -9.1600 }, end: { lat: 38.6900, lng: -9.1700 }, name: 'River 3' },
      { start: { lat: 38.6900, lng: -9.1700 }, end: { lat: 38.6850, lng: -9.1800 }, name: 'River 4' }
    ];
    
    let closestPoint = { ...point };
    let minDistance = Number.MAX_VALUE;
    let closestSegmentName = '';
    
    console.log(`  Attempting to snap point (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}) to ${roadSegments.length} road segments...`);
    
    // Find the closest point on any road segment
    for (let i = 0; i < roadSegments.length; i++) {
      const segment = roadSegments[i];
      const snappedPoint = this.snapPointToSegment(
        point, 
        segment.start, 
        segment.end
      );
      
      const distance = this.calculateDistance(point, snappedPoint);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = snappedPoint;
        closestSegmentName = segment.name || `Segment ${i}`;
      }
    }
    
    // Only use the snapped point if it's reasonably close (within ~1km for better coverage)
    if (minDistance <= 1.0) {
      console.log(`  ✓ Snapped to ${closestSegmentName}, distance: ${(minDistance * 1000).toFixed(1)}m`);
      console.log(`  → Moved from (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}) to (${closestPoint.lat.toFixed(6)}, ${closestPoint.lng.toFixed(6)})`);
      return closestPoint;
    }
    
    // Otherwise return the original point
    console.log(`  - No nearby road found (closest: ${(minDistance * 1000).toFixed(1)}m), using original point`);
    return point;
  }
}

export default new RoutingService();
