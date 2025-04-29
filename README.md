# MyWaze

![MyWaze Logo](src/assets/car_images/car_icon.png)

## Introduction

MyWaze is a web-based interactive navigation (not affiliated with Waze).
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
- **Maps**: Google Maps API
- **State Management**: Vue Composition API
- **Build Tools**: Vite
- **AI Assistance**: GitHub Copilot
- **APIs**: Google Routes API, HERE Maps API (for speed limits)

## Getting Started

### Prerequisites

- Node.js (v14.0 or higher)
- npm (v6.0 or higher)
- A Google Maps API key (for map and routing functionality)
- A HERE Maps API key (for speed limit data)

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

3. Create a `.env` file in the root directory and add your API keys (while we have a here api backup key, we do not provide a google maps api key here, please provide your own):

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_HERE_API_KEY=your_here_api_key
```

4. Start the development server:

```sh
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

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

## Project Structure

```
/src
  /assets        # Static assets and car images
  /components    # Vue components
  carDatabase.js # Vehicle database
  HomePage.vue   # Main application page
  App.vue        # Root Vue component
  main.js        # Application entry point
  UserManager.js # User authentication logic
```

## Development Setup

### Recommended IDE

[VSCode](https://code.visualstudio.com/) with these extensions:

- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Customize Configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).
