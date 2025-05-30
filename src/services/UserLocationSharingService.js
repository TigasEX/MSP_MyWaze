/**
 * User Location Sharing Service
 * 
 * Handles real-time location sharing with other users via WebSockets.
 * This service is core to MyWaze's collaborative navigation features.
 * 
 * Key Features:
 * - Always-on location sharing (cannot be disabled by users)
 * - Fixed 10-meter precision threshold for location updates
 * - Real-time WebSocket communication with the server
 * - Automatic reconnection with exponential backoff
 * - User authentication integration
 * - Real username display after authentication
 * 
 * Architecture:
 * - WebSocket connection to location sharing server
 * - Event-driven message handling
 * - Haversine distance calculation for location threshold
 * - Automatic session management
 * 
 * Security:
 * - Location sharing only during active sessions
 * - 10-meter precision threshold for privacy
 * - Authentication required for real username display
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */
export class UserLocationSharingService {
  constructor() {
    // WebSocket connection state
    this.ws = null;
    this.isConnected = false;
    this.userId = null;
    this.userName = null;
    
    // Reconnection management
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    
    // Location sharing configuration
    this.lastLocationSent = null;
    this.locationThreshold = 10; // Fixed at 10 meters - cannot be changed
    
    // Event callbacks for real-time updates
    this.onUserConnected = null;
    this.onUserDisconnected = null;
    this.onUserUpdated = null;
    this.onUserLocationUpdate = null;
    this.onUsersListUpdate = null;
    this.onConnectionStateChange = null;
    this.onError = null;
  }

  /**
   * Connect to WebSocket server
   * @param {string} serverUrl - WebSocket server URL
   */
  connect(serverUrl = 'ws://localhost:8080') {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('Already connected or connecting');
      return;
    }

    try {
      console.log('Connecting to location sharing service...');
      this.ws = new WebSocket(serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to location sharing service');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(true);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Disconnected from location sharing service', event.code, event.reason);
        this.isConnected = false;
        this.userId = null;
        this.userName = null;
        
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(false);
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError('Connection error occurred');
        }
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      if (this.onError) {
        this.onError('Failed to connect to location sharing service');
      }
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} data - Parsed message data
   */
  handleMessage(data) {
    switch (data.type) {
      case 'welcome':
        console.log('Received welcome message:', data.message);
        this.userId = data.userId;
        this.userName = data.userName;
        break;

      case 'user_connected':
        console.log(`User connected: ${data.userName} (${data.userId})`);
        if (this.onUserConnected) {
          this.onUserConnected({
            id: data.userId,
            name: data.userName,
            timestamp: data.timestamp
          });
        }
        break;

      case 'user_disconnected':
        console.log(`User disconnected: ${data.userName} (${data.userId})`);
        if (this.onUserDisconnected) {
          this.onUserDisconnected({
            id: data.userId,
            name: data.userName,
            timestamp: data.timestamp
          });
        }
        break;

      case 'user_updated':
        console.log(`User updated: ${data.userName} (${data.userId})`);
        if (this.onUserUpdated) {
          this.onUserUpdated({
            id: data.userId,
            name: data.userName,
            timestamp: data.timestamp
          });
        }
        break;

      case 'user_location_update':
        console.log(`Location update from ${data.userName}:`, data.position);
        if (this.onUserLocationUpdate) {
          this.onUserLocationUpdate({
            id: data.userId,
            name: data.userName,
            position: data.position,
            timestamp: data.timestamp
          });
        }
        break;

      case 'users_list':
        console.log('Received users list:', data.users);
        if (this.onUsersListUpdate) {
          // Filter out current user from the list
          const otherUsers = data.users.filter(user => user.id !== this.userId);
          this.onUsersListUpdate(otherUsers);
        }
        break;

      case 'location_update_ack':
        // Location update was acknowledged
        break;

      case 'pong':
        // Ping response
        break;

      case 'error':
        console.error('Server error:', data.message);
        if (this.onError) {
          this.onError(data.message);
        }
        break;

      case 'force_disconnect':
        console.warn('Force disconnect from server:', data.reason);
        // Import store dynamically to avoid circular dependencies
        import('../store/index.js').then(({ store }) => {
          store.logout();
          alert(`Session terminated: ${data.reason}`);
          // Reload the page to return to login
          window.location.reload();
        });
        break;

      case 'authentication_success':
        console.log('Authentication successful:', data.message);
        if (data.userId) {
          this.userId = data.userId;
        }
        if (data.userName) {
          this.userName = data.userName;
        }
        break;

      case 'authentication_failed':
        console.error('Authentication failed:', data.message);
        if (this.onError) {
          this.onError(`Authentication failed: ${data.message}`);
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  /**
   * Share current location with other users
   * @param {Object} position - Position object with lat, lng
   * @param {boolean} force - Force send even if location hasn't changed significantly
   */
  shareLocation(position, force = false) {
    if (!this.isConnected || !this.ws) {
      console.log('Not connected to sharing service');
      return false;
    }

    // Check if location has changed significantly
    if (!force && this.lastLocationSent) {
      const distance = this.calculateDistance(
        this.lastLocationSent.lat, this.lastLocationSent.lng,
        position.lat, position.lng
      ) * 1000; // Convert to meters

      if (distance < this.locationThreshold) {
        console.log(`Location change too small (${distance.toFixed(1)}m), not sharing`);
        return false;
      }
    }

    try {
      const message = {
        type: 'location_update',
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        timestamp: position.timestamp || Date.now()
      };

      this.ws.send(JSON.stringify(message));
      this.lastLocationSent = {
        lat: position.lat,
        lng: position.lng,
        timestamp: Date.now()
      };
      
      console.log('Location shared:', position);
      return true;
    } catch (error) {
      console.error('Failed to share location:', error);
      return false;
    }
  }

  /**
   * Request current users list
   */
  requestUsersList() {
    if (!this.isConnected || !this.ws) {
      console.log('Not connected to sharing service');
      return;
    }

    try {
      this.ws.send(JSON.stringify({ type: 'get_users' }));
    } catch (error) {
      console.error('Failed to request users list:', error);
    }
  }

  /**
   * Send ping to server
   */
  ping() {
    if (!this.isConnected || !this.ws) {
      return;
    }

    try {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    } catch (error) {
      console.error('Failed to send ping:', error);
    }
  }

  /**
   * Disconnect from the service
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnecting');
      this.ws = null;
    }
    this.isConnected = false;
    this.userId = null;
    this.userName = null;
  }

  /**
   * Authenticate user with WebSocket connection
   * @param {string} userEmail - User's email
   * @param {string} sessionId - Session ID from login
   */
  authenticate(userEmail, sessionId = null) {
    if (!this.isConnected || !this.ws) {
      console.error('Cannot authenticate: WebSocket not connected');
      return false;
    }

    const authData = {
      type: 'authenticate',
      email: userEmail
    };

    if (sessionId) {
      authData.sessionId = sessionId;
    }

    try {
      this.ws.send(JSON.stringify(authData));
      console.log('Sent authentication request for user:', userEmail);
      return true;
    } catch (error) {
      console.error('Failed to send authentication:', error);
      return false;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 
   * @param {number} lon1 
   * @param {number} lat2 
   * @param {number} lon2 
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get connection status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      userName: this.userName,
      reconnectAttempts: this.reconnectAttempts,
      lastLocationSent: this.lastLocationSent
    };
  }
}

// Create and export singleton instance
export const userLocationSharingService = new UserLocationSharingService();
