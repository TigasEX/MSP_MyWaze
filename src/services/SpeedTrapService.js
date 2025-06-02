/**
 * Speed Trap Service
 * 
 * Handles speed trap functionality including adding, verifying, removing,
 * and retrieving speed traps through both REST API and WebSocket connections.
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

class SpeedTrapService {
  constructor() {
    this.speedTraps = new Map(); // Maps speedTrapId -> speedTrap object
    this.baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080' : '';
    this.onSpeedTrapsUpdated = null;
    this.onSpeedTrapAdded = null;
    this.onSpeedTrapVerified = null;
    this.onSpeedTrapRemoved = null;
  }

  /**
   * Set callback functions for speed trap events
   * @param {Object} callbacks - Object containing callback functions
   */
  setCallbacks(callbacks) {
    this.onSpeedTrapsUpdated = callbacks.onSpeedTrapsUpdated || null;
    this.onSpeedTrapAdded = callbacks.onSpeedTrapAdded || null;
    this.onSpeedTrapVerified = callbacks.onSpeedTrapVerified || null;
    this.onSpeedTrapRemoved = callbacks.onSpeedTrapRemoved || null;
  }

  /**
   * Set WebSocket service for real-time communication
   * @param {Object} wsService - WebSocket service instance
   */
  setWebSocketService(wsService) {
    this.wsService = wsService;
    
    // Set up message handler for speed trap messages
    if (wsService && wsService.addMessageHandler) {
      wsService.addMessageHandler('speed_trap', (data) => {
        this.handleWebSocketMessage(data);
      });
    }
  }

  /**
   * Transform speed trap data from backend format to frontend format
   * @param {Object} speedTrap - Speed trap object from backend
   * @returns {Object} Transformed speed trap object
   */
  transformSpeedTrap(speedTrap) {
    if (!speedTrap) return null;
    
    return {
      ...speedTrap,
      lat: speedTrap.latitude || speedTrap.lat,
      lng: speedTrap.longitude || speedTrap.lng,
      // Keep original properties for compatibility
      latitude: speedTrap.latitude || speedTrap.lat,
      longitude: speedTrap.longitude || speedTrap.lng
    };
  }

  /**
   * Add a new speed trap via REST API
   * @param {number} latitude - Speed trap latitude
   * @param {number} longitude - Speed trap longitude
   * @param {string} addedBy - Email of user adding the speed trap
   * @returns {Promise<Object>} Speed trap object
   */
  async addSpeedTrap(latitude, longitude, addedBy) {
    try {
      const response = await fetch(`${this.baseUrl}/api/speed-traps/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          addedBy
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to add speed trap');
      }

      // Transform and update local storage
      const transformedSpeedTrap = this.transformSpeedTrap(data.speedTrap);
      this.speedTraps.set(transformedSpeedTrap.id, transformedSpeedTrap);
      
      return transformedSpeedTrap;
    } catch (error) {
      console.error('Error adding speed trap:', error);
      throw error;
    }
  }

  /**
   * Add a new speed trap via WebSocket
   * @param {number} latitude - Speed trap latitude
   * @param {number} longitude - Speed trap longitude
   * @param {Object} wsService - WebSocket service instance
   */
  addSpeedTrapViaWebSocket(latitude, longitude, wsService) {
    if (!wsService || !wsService.ws || wsService.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    wsService.ws.send(JSON.stringify({
      type: 'add_speed_trap',
      latitude,
      longitude
    }));
  }

  /**
   * Verify/report a speed trap via REST API
   * @param {string} speedTrapId - Speed trap ID to verify
   * @param {string} verifiedBy - Email of user verifying the speed trap
   * @returns {Promise<Object>} Updated speed trap object
   */
  async verifySpeedTrap(speedTrapId, verifiedBy) {
    try {
      const response = await fetch(`${this.baseUrl}/api/speed-traps/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          speedTrapId,
          verifiedBy
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to verify speed trap');
      }

      // Transform and update local storage
      const transformedSpeedTrap = this.transformSpeedTrap(data.speedTrap);
      this.speedTraps.set(transformedSpeedTrap.id, transformedSpeedTrap);
      
      return transformedSpeedTrap;
    } catch (error) {
      console.error('Error verifying speed trap:', error);
      throw error;
    }
  }

  /**
   * Verify a speed trap via WebSocket
   * @param {string} speedTrapId - Speed trap ID to verify
   * @param {Object} wsService - WebSocket service instance
   */
  verifySpeedTrapViaWebSocket(speedTrapId, wsService) {
    if (!wsService || !wsService.ws || wsService.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    wsService.ws.send(JSON.stringify({
      type: 'verify_speed_trap',
      speedTrapId
    }));
  }

  /**
   * Remove a speed trap via REST API
   * @param {string} speedTrapId - Speed trap ID to remove
   * @param {string} removedBy - Email of user removing the speed trap
   * @returns {Promise<boolean>} Success status
   */
  async removeSpeedTrap(speedTrapId, removedBy) {
    try {
      const response = await fetch(`${this.baseUrl}/api/speed-traps/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          speedTrapId,
          removedBy
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove speed trap');
      }

      // Remove from local storage
      this.speedTraps.delete(speedTrapId);
      
      return data.success;
    } catch (error) {
      console.error('Error removing speed trap:', error);
      throw error;
    }
  }

  /**
   * Remove a speed trap via WebSocket
   * @param {string} speedTrapId - Speed trap ID to remove
   * @param {Object} wsService - WebSocket service instance
   */
  removeSpeedTrapViaWebSocket(speedTrapId, wsService) {
    if (!wsService || !wsService.ws || wsService.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    wsService.ws.send(JSON.stringify({
      type: 'remove_speed_trap',
      speedTrapId
    }));
  }

  /**
   * Get all speed traps or nearby ones via REST API
   * @param {number} latitude - Optional: center latitude for nearby search
   * @param {number} longitude - Optional: center longitude for nearby search
   * @param {number} radius - Optional: search radius in kilometers (default: 10)
   * @returns {Promise<Array>} Array of speed trap objects
   */
  async getSpeedTraps(latitude = null, longitude = null, radius = 10) {
    try {
      let url = `${this.baseUrl}/api/speed-traps`;
      const params = new URLSearchParams();
      
      if (latitude && longitude) {
        params.append('lat', latitude.toString());
        params.append('lng', longitude.toString());
        params.append('radius', radius.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get speed traps');
      }

      // Transform and update local storage
      const transformedSpeedTraps = data.speedTraps.map(speedTrap => this.transformSpeedTrap(speedTrap));
      transformedSpeedTraps.forEach(speedTrap => {
        this.speedTraps.set(speedTrap.id, speedTrap);
      });
      
      return transformedSpeedTraps;
    } catch (error) {
      console.error('Error getting speed traps:', error);
      throw error;
    }
  }

  /**
   * Request speed traps via WebSocket
   * @param {Object} wsService - WebSocket service instance
   * @param {number} latitude - Optional: center latitude for nearby search
   * @param {number} longitude - Optional: center longitude for nearby search
   * @param {number} radius - Optional: search radius in kilometers (default: 10)
   */
  getSpeedTrapsViaWebSocket(wsService, latitude = null, longitude = null, radius = 10) {
    if (!wsService || !wsService.ws || wsService.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    const message = { type: 'get_speed_traps' };
    if (latitude && longitude) {
      message.latitude = latitude;
      message.longitude = longitude;
      message.radius = radius;
    }

    wsService.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming WebSocket messages related to speed traps
   * @param {Object} data - Parsed message data
   */
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'speed_traps_data':
        // Received speed traps data
        if (data.speedTraps && Array.isArray(data.speedTraps)) {
          data.speedTraps.forEach(speedTrap => {
            const transformed = this.transformSpeedTrap(speedTrap);
            this.speedTraps.set(transformed.id, transformed);
          });
          
          if (this.onSpeedTrapsUpdated) {
            this.onSpeedTrapsUpdated(Array.from(this.speedTraps.values()));
          }
        }
        break;

      case 'speed_trap_added':
        // New speed trap was added by someone
        if (data.speedTrap) {
          const transformed = this.transformSpeedTrap(data.speedTrap);
          this.speedTraps.set(transformed.id, transformed);
          
          if (this.onSpeedTrapAdded) {
            this.onSpeedTrapAdded(transformed);
          }
          
          if (this.onSpeedTrapsUpdated) {
            this.onSpeedTrapsUpdated(Array.from(this.speedTraps.values()));
          }
        }
        break;

      case 'speed_trap_verified':
        // Speed trap was verified by someone
        if (data.speedTrap) {
          const transformed = this.transformSpeedTrap(data.speedTrap);
          this.speedTraps.set(transformed.id, transformed);
          
          if (this.onSpeedTrapVerified) {
            this.onSpeedTrapVerified(transformed, data.verifiedBy);
          }
          
          if (this.onSpeedTrapsUpdated) {
            this.onSpeedTrapsUpdated(Array.from(this.speedTraps.values()));
          }
        }
        break;

      case 'speed_trap_removed':
        // Speed trap was removed by someone
        if (data.speedTrapId) {
          this.speedTraps.delete(data.speedTrapId);
          
          if (this.onSpeedTrapRemoved) {
            this.onSpeedTrapRemoved(data.speedTrapId, data.removedBy);
          }
          
          if (this.onSpeedTrapsUpdated) {
            this.onSpeedTrapsUpdated(Array.from(this.speedTraps.values()));
          }
        }
        break;

      case 'speed_trap_add_success':
        // Confirmation that our speed trap was added
        if (data.speedTrap) {
          const transformed = this.transformSpeedTrap(data.speedTrap);
          this.speedTraps.set(transformed.id, transformed);
          console.log('Speed trap added successfully:', transformed);
        }
        break;

      case 'speed_trap_verify_success':
        // Confirmation that our speed trap verification was successful
        if (data.speedTrap) {
          const transformed = this.transformSpeedTrap(data.speedTrap);
          this.speedTraps.set(transformed.id, transformed);
          console.log('Speed trap verified successfully:', transformed);
        }
        break;

      case 'speed_trap_remove_success':
        // Confirmation that our speed trap removal was successful
        if (data.speedTrapId && data.success) {
          this.speedTraps.delete(data.speedTrapId);
          console.log('Speed trap removed successfully:', data.speedTrapId);
        }
        break;

      default:
        // Not a speed trap related message, ignore
        break;
    }
  }

  /**
   * Get all locally stored speed traps
   * @returns {Array} Array of speed trap objects
   */
  getAllSpeedTraps() {
    return Array.from(this.speedTraps.values());
  }

  /**
   * Get speed traps near a specific location from local storage
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radius - Search radius in kilometers
   * @returns {Array} Array of nearby speed trap objects
   */
  getNearbySpeedTraps(latitude, longitude, radius = 10) {
    const nearbyTraps = [];
    
    this.speedTraps.forEach(speedTrap => {
      const distance = this.calculateDistance(
        latitude, longitude,
        speedTrap.lat || speedTrap.latitude, speedTrap.lng || speedTrap.longitude
      );
      
      if (distance <= radius) {
        nearbyTraps.push({
          ...speedTrap,
          distance: distance
        });
      }
    });
    
    // Sort by distance
    nearbyTraps.sort((a, b) => a.distance - b.distance);
    return nearbyTraps;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - First point latitude
   * @param {number} lng1 - First point longitude
   * @param {number} lat2 - Second point latitude
   * @param {number} lng2 - Second point longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  degToRad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Clear all locally stored speed traps
   */
  clearSpeedTraps() {
    this.speedTraps.clear();
  }

  /**
   * Get speed trap by ID
   * @param {string} speedTrapId - Speed trap ID
   * @returns {Object|null} Speed trap object or null if not found
   */
  getSpeedTrapById(speedTrapId) {
    return this.speedTraps.get(speedTrapId) || null;
  }
}

// Export as singleton
export const speedTrapService = new SpeedTrapService();
export default speedTrapService;