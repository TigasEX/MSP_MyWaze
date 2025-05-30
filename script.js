let map, userMarker, destinationMarker;
let watchId;
let userPosition = null;
let destinationPosition = null;
let directionsService, directionsRenderer;

function nextStage(stageId) {
  document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
  document.getElementById(stageId).classList.remove('hidden');
  if (stageId === 'map-stage') initMap();
}

function initMap() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();

  navigator.geolocation.getCurrentPosition(position => {
    userPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    map = new google.maps.Map(document.getElementById('map'), {
      center: userPosition,
      zoom: 15
    });

    directionsRenderer.setMap(map);

    userMarker = new google.maps.Marker({
      position: userPosition,
      map,
      title: "Your Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });

    document.getElementById('from-location').textContent = `Lat: ${userPosition.lat.toFixed(4)}, Lng: ${userPosition.lng.toFixed(4)}`;

    // Watch position changes
    watchId = navigator.geolocation.watchPosition(updateLocation);

    // Map click to set destination
    map.addListener("click", function (event) {
      setDestination(event.latLng);
    });
  });
}

function updateLocation(position) {
  const newPos = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  userMarker.setPosition(newPos);
  userPosition = newPos;

  if (destinationPosition) {
    drawRoute();
  }
}

function setDestination(latLng) {
  destinationPosition = {
    lat: latLng.lat(),
    lng: latLng.lng()
  };

  if (destinationMarker) destinationMarker.setMap(null);
  destinationMarker = new google.maps.Marker({
    position: destinationPosition,
    map,
    title: "Destination",
    icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
  });

  drawRoute();
}

function drawRoute() {
  directionsService.route(
    {
      origin: userPosition,
      destination: destinationPosition,
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(response);

        const duration = response.routes[0].legs[0].duration.text;
        document.getElementById("etaDisplay").textContent = `ETA: ${duration}`;
      } else {
        alert("Directions request failed due to " + status);
      }
    }
  );
}
