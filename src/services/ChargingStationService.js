/**
 * EV Charging Station Service
 * 
 * Provides electric vehicle charging station information using RapidAPI.
 * Integrates with the EV Charging Stations API to fetch real-time data
 * about nearby charging stations with availability status.
 * 
 * Key Features:
 * - Real-time charging station search by location
 * - Availability status with color-coded indicators (green/red/yellow)
 * - Multiple connector type support (CCS, CHAdeMO, Type 2, Tesla)
 * - Charging speed categorization (Ultra-rapid, Rapid, Fast, Standard)
 * - Route-based charging station discovery
 * - Fallback mock data for development/testing
 * 
 * API Integration:
 * - RapidAPI EV Charging Stations endpoint
 * - Rate limiting to prevent API quota exhaustion
 * - Error handling with graceful fallbacks
 * - Response data normalization and formatting
 * 
 * Data Structure:
 * - Standardized charging station objects
 * - Location coordinates (lat/lng)
 * - Address and contact information
 * - Connector types and charging speeds
 * - Operating hours and access type
 * - Real-time availability status
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

import axios from 'axios';

export class ChargingStationService {
  constructor() {
    // RapidAPI configuration for EV charging stations
    this.rapidApiKey = '34b3d5b307mshe4d1bd151b020f7p177e29jsnd834b8f75135'; 
    this.baseUrl = 'https://ev-charging-stations-api.p.rapidapi.com';
    
    // Search configuration
    this.searchRadius = 30000; // 30km radius in meters (expanded for better coverage)
    this.maxResults = 50; // Maximum number of results per request
    
    // Rate limiting to prevent API quota exhaustion and 429 errors
    this.lastRequestTime = 0;
    this.requestInterval = 2000; // Minimum 2 seconds between requests
    
    // API status tracking for UI indicators
    this.apiStatus = 'unknown'; // 'success', 'fallback', 'error', 'unknown'
    this.lastApiStatusUpdate = Date.now();
    
    // RapidAPI headers for authentication
    this.headers = {
      'x-rapidapi-key': this.rapidApiKey,
      'x-rapidapi-host': 'ev-charging-stations-api.p.rapidapi.com'
    };
  }

  /**
   * Search for EV charging stations near a given location
   * @param {Object} location - Location coordinates {lat, lng}
   * @param {number} radius - Search radius in meters (default: 10km)
   * @param {number} limit - Maximum number of results (default: 50)
   * @returns {Promise<Array>} - Array of charging station objects
   */
  async searchChargingStations(location, radius = this.searchRadius, limit = this.maxResults) {
    try {
      // Rate limiting: ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.requestInterval) {
        const waitTime = this.requestInterval - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.lastRequestTime = Date.now();
      
      console.log(`🔋 Searching for EV charging stations near (${location.lat}, ${location.lng})...`);
      
      const response = await axios.get(`${this.baseUrl}/ev/locations`, {
        headers: this.headers,
        params: {
          lat: location.lat,
          lng: location.lng,
          page: 1
        },
        timeout: 10000
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response data structure:', Object.keys(response.data || {}));

      // Handle different possible response structures
      let stations = [];
      if (response.data && Array.isArray(response.data)) {
        stations = response.data.map(station => this.formatChargingStation(station));
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        stations = response.data.data.map(station => this.formatChargingStation(station));
      } else if (response.data && response.data.locations && Array.isArray(response.data.locations)) {
        stations = response.data.locations.map(station => this.formatChargingStation(station));
      }

      if (stations.length === 0) {
        console.warn('⚠️ No charging stations found in API response - using mock data');
        this.apiStatus = 'fallback';
        this.lastApiStatusUpdate = Date.now();
        return this.getMockChargingStations(location);
      }

      console.log(`✅ Found ${stations.length} charging stations`);
      this.apiStatus = 'success';
      this.lastApiStatusUpdate = Date.now();
      return stations;
    } catch (error) {
      console.error('❌ Error fetching charging stations:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response headers:', error.response.headers);
        console.error('❌ Response data:', error.response.data);
      }
      
      // Check for rate limiting
      if (error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded (429). Using mock data. Please wait before making more requests.');
        this.apiStatus = 'fallback';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('⚠️ API authentication failed. Please check your RapidAPI key.');
        this.apiStatus = 'error';
      } else {
        this.apiStatus = 'error';
      }
      
      this.lastApiStatusUpdate = Date.now();
      
      // Return mock data for development/fallback
      return this.getMockChargingStations(location);
    }
  }

  /**
   * Format RapidAPI charging station data to standardized format
   * @param {Object} station - Raw station data from RapidAPI
   * @returns {Object} - Formatted charging station object
   */
  formatChargingStation(station) {
    return {
      id: station.id || station.station_id || `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: station.name || station.title || station.operator || 'EV Charging Station',
      lat: parseFloat(station.latitude || station.lat || station.coords?.lat || 0),
      lng: parseFloat(station.longitude || station.lng || station.coords?.lng || 0),
      address: this.formatAddress(station.address || station.location || station.street),
      phone: station.phone || station.telephone || null,
      category: 'EV Charging',
      distance: station.distance || null,
      connectorTypes: this.extractConnectorTypes(station),
      operatingHours: this.formatOperatingHours(station.hours || station.opening_hours || station.open_hours),
      accessType: this.determineAccessType(station),
      chargingSpeed: this.determineChargingSpeed(station),
      amenities: this.extractAmenities(station),
      brand: station.operator || station.network || station.brand || null,
      url: station.website || station.url || null,
      // Availability status for green/red indicators
      isAvailable: this.determineAvailability(station),
      availableConnectors: station.connectors_available || station.available_connectors || 0,
      totalConnectors: station.connectors_total || station.total_connectors || 0,
      lastUpdated: station.last_updated || station.updated_at || new Date().toISOString()
    };
  }

  /**
   * Format address from RapidAPI response
   * @param {Object|string} address - Address object or string from RapidAPI
   * @returns {string} - Formatted address string
   */
  formatAddress(address) {
    if (!address) return 'Address not available';
    
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.city) parts.push(address.city);
    if (address.postal_code) parts.push(address.postal_code);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ') || 'Address not available';
  }

  /**
   * Extract connector types from station data
   * @param {Object} station - Station data
   * @returns {Array} - Array of connector types
   */
  extractConnectorTypes(station) {
    if (station.connectors && Array.isArray(station.connectors)) {
      return station.connectors.map(conn => conn.type || conn.connector_type).filter(Boolean);
    }
    
    if (station.connector_types && Array.isArray(station.connector_types)) {
      return station.connector_types;
    }
    
    // Default connector types for fallback
    return ['Type 2', 'CCS'];
  }

  /**
   * Format operating hours
   * @param {Object|string} hours - Operating hours data
   * @returns {string} - Formatted operating hours
   */
  formatOperatingHours(hours) {
    if (!hours) return '24/7';
    
    if (typeof hours === 'string') return hours;
    
    if (hours.always_open) return '24/7';
    
    // Format hours object if available
    if (hours.monday || hours.tue || hours.open) {
      return 'See details'; // Simplified for now
    }
    
    return '24/7';
  }

  /**
   * Determine access type (public, private, etc.)
   * @param {Object} station - Station data
   * @returns {string} - Access type
   */
  determineAccessType(station) {
    if (station.access) return station.access;
    if (station.public_access === true) return 'Public';
    if (station.public_access === false) return 'Private';
    
    // Default to public for most charging stations
    return 'Public';
  }

  /**
   * Determine charging speed category
   * @param {Object} station - Station data
   * @returns {string} - Charging speed category
   */
  determineChargingSpeed(station) {
    if (station.max_power || station.power) {
      const power = station.max_power || station.power;
      if (power >= 150) return 'Ultra-rapid';
      if (power >= 50) return 'Rapid';
      if (power >= 22) return 'Fast';
      return 'Slow';
    }
    
    // Check connector types for speed estimation
    const connectors = this.extractConnectorTypes(station);
    if (connectors.some(c => c.includes('CCS') || c.includes('CHAdeMO'))) {
      return 'Fast';
    }
    
    return 'Standard';
  }

  /**
   * Determine availability status for green/red indicators
   * @param {Object} station - Station data
   * @returns {boolean} - Whether station has available connectors
   */
  determineAvailability(station) {
    // Check if station is operational
    if (station.status && station.status.toLowerCase() === 'offline') return false;
    if (station.operational === false) return false;
    
    // Check connector availability
    if (station.connectors_available !== undefined) {
      return station.connectors_available > 0;
    }
    
    if (station.available !== undefined) {
      return station.available;
    }
    
    // Check individual connectors
    if (station.connectors && Array.isArray(station.connectors)) {
      return station.connectors.some(conn => 
        conn.status === 'available' || conn.available === true
      );
    }
    
    // Default to available if no status info (better UX)
    return true;
  }

  /**
   * Extract amenities from station data
   * @param {Object} station - Station data
   * @returns {Array} - Array of amenities
   */
  extractAmenities(station) {
    const amenities = [];
    
    if (station.amenities && Array.isArray(station.amenities)) {
      return station.amenities;
    }
    
    // Check for common amenities in various fields
    if (station.restaurant || station.food) amenities.push('Restaurant');
    if (station.shopping || station.retail) amenities.push('Shopping');
    if (station.parking) amenities.push('Parking');
    if (station.wifi) amenities.push('WiFi');
    if (station.restroom || station.toilet) amenities.push('Restroom');
    
    return amenities;
  }

  /**
   * Get mock charging stations for development/fallback
   * @param {Object} location - Center location
   * @returns {Array} - Array of mock charging stations
   */
  getMockChargingStations(location) {
    console.log('🔧 Using mock charging station data');
    
    const mockStations = [
      {
        id: 'mock_station_1',
        name: 'Tesla Supercharger Lisbon',
        lat: location.lat + 0.01,
        lng: location.lng + 0.01,
        address: 'Av. da Liberdade, 1250-001 Lisboa',
        phone: '+351 210 000 001',
        category: 'EV Charging',
        distance: 1100,
        connectorTypes: ['Tesla Supercharger', 'Type 2'],
        operatingHours: '24/7',
        accessType: 'Public',
        chargingSpeed: 'Ultra-rapid',
        amenities: ['Restaurant', 'Shopping'],
        brand: 'Tesla',
        url: null,
        isAvailable: true,
        availableConnectors: 6,
        totalConnectors: 8,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mock_station_2',
        name: 'Ionity Charging Hub',
        lat: location.lat - 0.005,
        lng: location.lng + 0.015,
        address: 'Centro Comercial Colombo, 1500-392 Lisboa',
        phone: '+351 210 000 002',
        category: 'EV Charging',
        distance: 1800,
        connectorTypes: ['CCS', 'CHAdeMO'],
        operatingHours: '06:00-24:00',
        accessType: 'Public',
        chargingSpeed: 'Rapid',
        amenities: ['Shopping', 'Food Court'],
        brand: 'Ionity',
        url: null,
        isAvailable: false,
        availableConnectors: 0,
        totalConnectors: 4,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mock_station_3',
        name: 'EDP Charge Point',
        lat: location.lat + 0.008,
        lng: location.lng - 0.012,
        address: 'Parque das Nações, 1990-079 Lisboa',
        phone: '+351 210 000 003',
        category: 'EV Charging',
        distance: 2200,
        connectorTypes: ['Type 2', 'CCS'],
        operatingHours: '24/7',
        accessType: 'Public',
        chargingSpeed: 'Fast',
        amenities: ['Parking'],
        brand: 'EDP',
        url: null,
        isAvailable: true,
        availableConnectors: 2,
        totalConnectors: 3,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'mock_station_4',
        name: 'ChargePoint Network',
        lat: location.lat - 0.012,
        lng: location.lng - 0.008,
        address: 'Shopping Amoreiras, 1070-001 Lisboa',
        phone: '+351 210 000 004',
        category: 'EV Charging',
        distance: 2500,
        connectorTypes: ['Type 2'],
        operatingHours: '08:00-22:00',
        accessType: 'Public',
        chargingSpeed: 'Standard',
        amenities: ['Shopping', 'Parking', 'WiFi'],
        brand: 'ChargePoint',
        url: null,
        isAvailable: true,
        availableConnectors: 1,
        totalConnectors: 2,
        lastUpdated: new Date().toISOString()
      }
    ];

    return mockStations;
  }

  /**
   * Search charging stations along a route
   * @param {Array} routePoints - Array of route coordinates
   * @param {number} searchRadius - Search radius around route points in meters
   * @returns {Promise<Array>} - Array of charging stations along the route
   */
  async searchChargingStationsAlongRoute(routePoints, searchRadius = 5000) {
    if (!routePoints || routePoints.length === 0) {
      return [];
    }

    try {
      console.log(`🛣️ Searching for charging stations along route (${routePoints.length} points)...`);
      
      // Sample every nth point to avoid too many API calls
      const sampleRate = Math.max(1, Math.floor(routePoints.length / 10));
      const samplePoints = routePoints.filter((_, index) => index % sampleRate === 0);
      
      const allStations = [];
      const stationIds = new Set(); // To avoid duplicates
      
      for (const point of samplePoints) {
        const stations = await this.searchChargingStations(point, searchRadius, 10);
        
        // Add unique stations
        stations.forEach(station => {
          if (!stationIds.has(station.id)) {
            stationIds.add(station.id);
            allStations.push(station);
          }
        });
      }
      
      console.log(`✅ Found ${allStations.length} unique charging stations along route`);
      return allStations;
      
    } catch (error) {
      console.error('❌ Error searching charging stations along route:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific charging station
   * @param {string} stationId - Station ID
   * @returns {Promise<Object>} - Detailed station information
   */
  async getChargingStationDetails(stationId) {
    try {
      console.log(`🔍 Fetching details for charging station: ${stationId}`);
      
      const response = await axios.get(`${this.baseUrl}/station/${stationId}`, {
        headers: this.headers,
        timeout: 8000
      });

      if (response.data && response.data.station) {
        return this.formatChargingStation(response.data.station);
      }

      throw new Error('Station details not found');

    } catch (error) {
      console.error('❌ Error fetching charging station details:', error);
      throw error;
    }
  }

  /**
   * Get real-time availability for a charging station
   * @param {string} stationId - Station ID
   * @returns {Promise<Object>} - Real-time availability data
   */
  async getChargingStationAvailability(stationId) {
    try {
      console.log(`📊 Fetching availability for charging station: ${stationId}`);
      
      const response = await axios.get(`${this.baseUrl}/station/${stationId}/availability`, {
        headers: this.headers,
        timeout: 5000
      });

      if (response.data) {
        return {
          stationId,
          isAvailable: response.data.available || false,
          availableConnectors: response.data.connectors_available || 0,
          totalConnectors: response.data.connectors_total || 0,
          lastUpdated: response.data.last_updated || new Date().toISOString(),
          status: response.data.status || 'unknown'
        };
      }

      throw new Error('Availability data not found');

    } catch (error) {
      console.error('❌ Error fetching charging station availability:', error);
      // Return default availability data
      return {
        stationId,
        isAvailable: true,
        availableConnectors: 1,
        totalConnectors: 1,
        lastUpdated: new Date().toISOString(),
        status: 'unknown'
      };
    }
  }

  /**
   * Get current API status for UI indicators
   * @returns {Object} - API status information
   */
  getApiStatus() {
    return {
      status: this.apiStatus,
      lastUpdate: this.lastApiStatusUpdate,
      isHealthy: this.apiStatus === 'success',
      isFallback: this.apiStatus === 'fallback',
      hasError: this.apiStatus === 'error'
    };
  }
}

// Create and export singleton instance
export default new ChargingStationService();
