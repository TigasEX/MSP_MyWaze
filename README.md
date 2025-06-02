# MyWaze

![MyWaze Logo](src/assets/car_images/car_icon.png)

## Introduction

MyWaze is a web-based interactive navigation application (not affiliated with Waze).
Work made for MSP - 2024/2025 FCT Nova.
André Gaspar - 59859
João Lima - 60350
Marisa Basílio - 54550
Pedro Afonso - 70357
Tiago Sequeira - 55354

## Screenshots

![Login Screen](https://media.discordapp.net/attachments/1357732915617992918/1366178159028080694/Screenshot_from_2025-04-27_23-22-30.png?ex=6810000f&is=680eae8f&hm=2cc43fd8a59c7eaa1175b2ec2532ff7f420bb2e5514288e62d11193e48f647d3&=&format=webp&quality=lossless&width=1205&height=1132)
![Navigation Interface](https://media.discordapp.net/attachments/1357732915617992918/1366178159397048441/Screenshot_from_2025-04-27_23-22-54.png?ex=6810000f&is=680eae8f&hm=c7dd69f297742cbc9b2accbfdc888b9c3bf00ee1f240f6d50cc20446dd620cc5&=&format=webp&quality=lossless&width=1279&height=1132)

## Technologies Used

- **Frontend**: Vue.js 3, HTML5, CSS3
- **Maps**: Leaflet with OpenStreetMap
- **State Management**: Vuex Store
- **Real-time Communication**: WebSocket Server
- **Build Tools**: Vite
- **AI Assistance**: GitHub Copilot
- **APIs**: OpenRouteService API (for routing and road data)

## Getting Started

### Prerequisites

- Node.js (v14.0 or higher)
- npm (v6.0 or higher)
- An OpenRouteService API key (optional, a default free tier key is provided)

### Installation

1. Clone the repository:

```sh
git clone https://github.com/yourusername/MSP_MyWaze
cd msp-mywaze
```

2. Install dependencies:

```sh
npm install
```

3. Create a `.env` file in the root directory and add your API keys (optional, default keys are provided):

```
VITE_OPENROUTE_API_KEY=your_openroute_service_api_key
```

4. Start the WebSocket server (required for login, register, location sharing, etc.):

```sh
node websocket-server.js
```

5. In a new terminal, start the development server:

```sh
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create a production build:

```sh
npm run build
```

The built files will be in the `dist` directory, ready to be deployed.

## Usage

1. **Log in or register** to access the navigation features
2. **Navigation**:
   - Use WASD keys or on-screen controls to move around the map
   - Click anywhere on the map to set a destination
   - Follow the route displayed on the map
3. **Vehicle Management**:
   - Click "Register Vehicle" to add a new vehicle to your profile
   - View your registered vehicles in "My Vehicles"
4. **Location Sharing**:
   - Location sharing is automatically enabled for all users
   - Real-time user locations are shared with a fixed 10-meter precision threshold
   - See other users' real usernames on the map after authentication
5. **Safety Features**:
   - Speed limit warnings based on current location
   - EV charging station locations displayed automatically
   - All safety features activate only after user location is established

## Project Structure

```
/src
  /assets        # Static assets and car images
  /components    # Vue components
    /map         # Map-related components
      MapContainer.vue           # Main map component
      LocationSharingPanel.vue   # Location sharing UI (auto-enabled)
      UserLocationInitializer.js # Unified location initialization
  /services      # Application services
    UserLocationSharingService.js # Location sharing logic
  /store         # Vuex state management
    index.js     # Main store with location sharing state
  carDatabase.js # Vehicle database
  HomePage.vue   # Main application page
  App.vue        # Root Vue component
  main.js        # Application entry point
  UserManager.js # User authentication logic
/websocket-server.js # WebSocket server for real-time communication
```

# **Key Features**

## Basic Features:
   - T1 - Register Account
   - T2 - Registar type of vehicle
   - T3 - Define Route
   - T4 - Speed Limit
   - T5 - Get Arrival Time

## Chosen Features:
   - T6 - Plan Route
   - T7 - Save Route
   - T8 - See other users
   - T9 - Report Speed Traps

## New Feature:
   - T10 - Find eletric posts

## Development Setup

### Running the Full Application

1. **Start the WebSocket server** (terminal 1):
```sh
node websocket-server.js
```

2. **Start the frontend development server** (terminal 2):
```sh
npm run dev
```

### Testing Location Features

The project includes test files for location functionality:
- `test-always-on-location-sharing.js` - Tests the always-on location sharing
- `test-location-simple.js` - Basic location testing

### Recommended IDE

[VSCode](https://code.visualstudio.com/) with these extensions:

- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Customize Configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

### Technical Implementation
- **State Management**: Vuex store manages the always-enabled location sharing state
- **Service Layer**: `UserLocationSharingService.js` handles location updates with fixed thresholds
- **WebSocket Communication**: Real-time location updates between users via WebSocket server
- **Error Handling**: Graceful fallbacks and user feedback for location access issues

### Security & Privacy
- Location data is only shared during active sessions
- WebSocket connections are managed per session with proper cleanup
