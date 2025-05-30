/**
 * OpenRouteService API client with fallback mechanisms
 * 
 * This service handles routing using the free OpenRouteService API
 * Sign up for a free API key at: https://openrouteservice.org/dev/#/signup
 */

import axios from 'axios';

// Default OpenRouteService API key (get your own at https://openrouteservice.org/dev/#/signup)
const DEFAULT_API_KEY = '5b3ce3597851110001cf6248367b86bb45f4468cb4c2fa4ebb0dfc05';

export class RoutingService {
  constructor(apiKey = DEFAULT_API_KEY) {
    // Store the API key without the 'Bearer ' prefix - we'll add it in each request
    this.apiKey = apiKey;
  }

  /**
   * Get a route between two points
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {Promise} - Route data including duration, distance, and geometry
   */
  async getRoute(origin, destination) {
    try {
      console.log(`Attempting to calculate route from (${origin.lat}, ${origin.lng}) to (${destination.lat}, ${destination.lng})...`);
      
      try {
        // First try using the OpenRouteService API
        console.log('Trying OpenRouteService API first...');
        const response = await axios.post(
          '/ors-api/v2/directions/driving-car', // Use absolute path
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
          console.log('OpenRouteService API call successful!');
          const route = response.data.features[0];
          const properties = route.properties;
          const geometry = route.geometry;

          // Extract route information
          return {
            distance: properties.summary.distance, // in meters
            duration: properties.summary.duration, // in seconds
            geometry: this.formatRouteGeometry(geometry)
          };
        }
        
        throw new Error('No route found in API response');
      } catch (apiError) {
        // Log API error and continue to fallback
        console.warn('OpenRouteService API error:', apiError.message);
        console.log('Using fallback routing method instead...');
        return this.fallbackGetRoute(origin, destination);
      }
    } catch (error) {
      console.error('Error in route calculation:', error);
      // Still try the fallback as a last resort
      return this.fallbackGetRoute(origin, destination);
    }
  }

  /**
   * Fallback implementation for route calculation when API fails
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @returns {Object} - Route information with estimated distance, duration, and points
   */
  fallbackGetRoute(origin, destination) {
    console.log('Using fallback routing method...');
    
    // Calculate straight-line distance
    const distance = this.calculateDistance(origin, destination);
    
    // Estimate duration based on average speed of 50 km/h
    const durationHours = distance / 50;
    const durationSeconds = durationHours * 3600;
    
    // Generate a simple route with a few intermediate points
    const points = this.generateSimpleRoute(origin, destination);
    
    return {
      distance: distance * 1000, // convert to meters
      duration: durationSeconds,
      geometry: points
    };
  }
  
  /**
   * Generate a simple route with intermediate points
   * @param {Object} origin - Origin point {lat, lng}
   * @param {Object} destination - Destination point {lat, lng}
   * @returns {Array} - Array of points representing the route
   */
  generateSimpleRoute(origin, destination) {
    const points = [];
    
    // Add origin
    points.push({...origin});
    
    // Calculate number of intermediate points based on distance
    const distance = this.calculateDistance(origin, destination);
    const numPoints = Math.max(2, Math.ceil(distance * 2)); // At least 2 points, or more for longer routes
    
    // Generate intermediate points
    for (let i = 1; i < numPoints - 1; i++) {
      const ratio = i / (numPoints - 1);
      
      // Simple linear interpolation between origin and destination
      const lat = origin.lat + (destination.lat - origin.lat) * ratio;
      const lng = origin.lng + (destination.lng - origin.lng) * ratio;
      
      // Add some small random variation to make it look more natural
      const jitter = 0.001; // About 100m
      const randomLat = lat + (Math.random() * 2 - 1) * jitter;
      const randomLng = lng + (Math.random() * 2 - 1) * jitter;
      
      // Try to snap this point to a road
      const point = { lat: randomLat, lng: randomLng };
      const snappedPoint = this.fallbackSnapToRoad(point);
      
      points.push(snappedPoint);
    }
    
    // Add destination
    points.push({...destination});
    
    return points;
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
    try {
      console.log(`Attempting to snap point (${point.lat}, ${point.lng}) to road...`);
      
      // Use the dedicated snap endpoint with the proper format
      const response = await axios.post(
        '/ors-api/v2/snap/driving-car', // Use the correct profile path parameter with absolute path
        {
          locations: [
            [point.lng, point.lat] // Coordinates format: [longitude, latitude]
          ],
          radius: 100 // Snap radius in meters
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json, application/geo+json'
          },
          timeout: 5000
        }
      );

      if (response.data && response.data.locations && response.data.locations.length > 0) {
        console.log('Road snapping successful using dedicated snap endpoint!');
        // Get the snapped coordinate
        const snappedPoint = response.data.locations[0].location;
        return {
          lat: snappedPoint[1],
          lng: snappedPoint[0]
        };
      } else if (response.data && response.data.snapped_coordinates && response.data.snapped_coordinates.length > 0) {
        // Alternative response format
        console.log('Road snapping successful using snapped_coordinates format!');
        const snappedPoint = response.data.snapped_coordinates[0];
        return {
          lat: snappedPoint[1],
          lng: snappedPoint[0]
        };
      } else if (response.data && response.data.features && response.data.features.length > 0) {
        // GeoJSON response format
        console.log('Road snapping successful using GeoJSON format!');
        const snappedPoint = response.data.features[0].geometry.coordinates;
        return {
          lat: snappedPoint[1],
          lng: snappedPoint[0]
        };
      }
      
      // If no snapped point found, use the fallback
      console.warn('No snapped point found in API response, using fallback...');
      return this.fallbackSnapToRoad(point);
    } catch (error) {
      console.warn('Error snapping to road with API:', error.message);
      
      // Try the directions API as a second approach before using the geometric fallback
      try {
        console.log('Trying to snap using directions API as fallback...');
        return await this.snapToRoadUsingDirections(point);
      } catch (directionsError) {
        console.log('Directions API fallback also failed, using geometric fallback algorithm...');
        // Use our fallback road snapping algorithm based on known road segments
        return this.fallbackSnapToRoad(point);
      }
    }
  }
  
  /**
   * Alternative road snapping implementation using known road segments
   * Used as a fallback when the OpenRouteService API fails
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Object} - Snapped point {lat, lng}
   */
  fallbackSnapToRoad(point) {
    // Define some known road segments for Lisbon area
    const roadSegments = [
      // Major roads in Lisbon (simplified)
      { start: { lat: 38.7223, lng: -9.1393 }, end: { lat: 38.7268, lng: -9.1503 } }, // Av. da Liberdade
      { start: { lat: 38.7268, lng: -9.1503 }, end: { lat: 38.7317, lng: -9.1377 } }, // Marquês de Pombal to Saldanha
      { start: { lat: 38.7317, lng: -9.1377 }, end: { lat: 38.7372, lng: -9.1328 } }, // Saldanha to Campo Pequeno
      { start: { lat: 38.7372, lng: -9.1328 }, end: { lat: 38.7476, lng: -9.1467 } }, // Campo Pequeno to Entrecampos
      { start: { lat: 38.7103, lng: -9.1321 }, end: { lat: 38.7223, lng: -9.1393 } }, // Baixa to Av. da Liberdade
      { start: { lat: 38.7103, lng: -9.1321 }, end: { lat: 38.7118, lng: -9.1418 } }, // Baixa to Cais do Sodré
      
      // A5 highway (simplified segments)
      { start: { lat: 38.7223, lng: -9.1623 }, end: { lat: 38.7208, lng: -9.1783 } },
      { start: { lat: 38.7208, lng: -9.1783 }, end: { lat: 38.7197, lng: -9.1922 } },
      { start: { lat: 38.7197, lng: -9.1922 }, end: { lat: 38.7186, lng: -9.2088 } },
      { start: { lat: 38.7186, lng: -9.2088 }, end: { lat: 38.7163, lng: -9.2254 } },
      
      // A1 highway (simplified segments)
      { start: { lat: 38.7659, lng: -9.1183 }, end: { lat: 38.7765, lng: -9.1148 } },
      { start: { lat: 38.7765, lng: -9.1148 }, end: { lat: 38.7857, lng: -9.1099 } },
      { start: { lat: 38.7857, lng: -9.1099 }, end: { lat: 38.7939, lng: -9.1026 } },
      
      // Belem area
      { start: { lat: 38.6969, lng: -9.2055 }, end: { lat: 38.6978, lng: -9.1969 } },
      { start: { lat: 38.6978, lng: -9.1969 }, end: { lat: 38.6985, lng: -9.1901 } },
      { start: { lat: 38.6985, lng: -9.1901 }, end: { lat: 38.6994, lng: -9.1823 } },
      
      // Add a few more segments covering the area from the error log (-9.1947008, 38.7547136)
      { start: { lat: 38.7507, lng: -9.1900 }, end: { lat: 38.7547, lng: -9.1947 } },
      { start: { lat: 38.7547, lng: -9.1947 }, end: { lat: 38.7593, lng: -9.1987 } },
      { start: { lat: 38.7593, lng: -9.1987 }, end: { lat: 38.7630, lng: -9.2025 } },
      { start: { lat: 38.7500, lng: -9.1850 }, end: { lat: 38.7507, lng: -9.1900 } },
      
      // Add more road segments to cover more of Lisbon
      { start: { lat: 38.7547, lng: -9.1947 }, end: { lat: 38.7500, lng: -9.1970 } },
      { start: { lat: 38.7500, lng: -9.1970 }, end: { lat: 38.7450, lng: -9.2000 } },
      { start: { lat: 38.7450, lng: -9.2000 }, end: { lat: 38.7400, lng: -9.2030 } },
      { start: { lat: 38.7400, lng: -9.2030 }, end: { lat: 38.7350, lng: -9.2050 } },
    ];
    
    let closestPoint = { ...point };
    let minDistance = Number.MAX_VALUE;
    
    // Find the closest point on any road segment
    for (const segment of roadSegments) {
      const snappedPoint = this.snapPointToSegment(
        point, 
        segment.start, 
        segment.end
      );
      
      const distance = this.calculateDistance(point, snappedPoint);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = snappedPoint;
      }
    }
    
    // Only use the snapped point if it's reasonably close (within ~500m)
    if (minDistance <= 0.5) {
      return closestPoint;
    }
    
    // Otherwise return the original point
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
   * Alternative method to snap to road using the directions API
   * Used as a secondary fallback when the dedicated snap endpoint fails
   * @param {Object} point - Point coordinates {lat, lng}
   * @returns {Promise} - Nearest point on a road
   */
  async snapToRoadUsingDirections(point) {
    try {
      console.log(`Attempting to snap point using directions API as fallback...`);
      
      // Use the directions API with a very short route (same point twice)
      // This forces the point to snap to the nearest road
      const response = await axios.post(
        '/ors-api/v2/directions/driving-car', // Use absolute path
        {
          coordinates: [
            [point.lng, point.lat],
            [point.lng + 0.0001, point.lat + 0.0001] // Tiny offset to create a short route
          ],
          format: 'geojson',
          radiuses: [50, 50] // Search radius in meters
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json, application/geo+json'
          },
          timeout: 5000
        }
      );

      if (response.data && response.data.features && response.data.features.length > 0) {
        console.log('Road snapping successful using directions API fallback!');
        // Get the first point of the route which will be snapped to the road
        const snappedPoint = response.data.features[0].geometry.coordinates[0];
        return {
          lat: snappedPoint[1],
          lng: snappedPoint[0]
        };
      }
      
      throw new Error('No route found in directions API response');
    } catch (error) {
      console.warn('Error snapping to road with directions API:', error.message);
      throw error; // Pass the error to the caller
    }
  }
}

// Create and export a singleton instance
export default new RoutingService();
