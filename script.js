let map, marker, watchId, destinationCoords;

function nextStage(stageId) {
  document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
  document.getElementById(stageId).classList.remove('hidden');
  if (stageId === 'map-stage') initMap();
}

function initMap() {
  navigator.geolocation.getCurrentPosition(position => {
    const userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    map = new google.maps.Map(document.getElementById('map'), {
      center: userLocation,
      zoom: 15
    });

    marker = new google.maps.Marker({
      position: userLocation,
      map,
      title: "You are here"
    });

    watchId = navigator.geolocation.watchPosition(updateLocation);
  });
}

function updateLocation(position) {
  const newPos = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  marker.setPosition(newPos);
  map.panTo(newPos);

  if (destinationCoords) {
    const distance = computeDistance(newPos, destinationCoords);
    const speed = position.coords.speed || 50 / 3.6; // fallback 50km/h
    const eta = distance / speed;
    document.getElementById("etaDisplay").textContent = `ETA: ${eta.toFixed(2)} min`;
  }
}

function calculateRoute() {
  const dest = document.getElementById('destination').value;
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: dest }, function(results, status) {
    if (status === 'OK') {
      destinationCoords = results[0].geometry.location;
      new google.maps.Marker({
        position: destinationCoords,
        map,
        title: "Destination"
      });
      map.panTo(destinationCoords);
    } else {
      alert("Could not find location: " + status);
    }
  });
}

function computeDistance(pos1, pos2) {
  const R = 6371e3; // metres
  const φ1 = pos1.lat * Math.PI / 180;
  const φ2 = pos2.lat() * Math.PI / 180;
  const Δφ = (pos2.lat() - pos1.lat) * Math.PI / 180;
  const Δλ = (pos2.lng() - pos1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c;
  return d / 1000 * 60; // return minutes if speed is in m/s
}
