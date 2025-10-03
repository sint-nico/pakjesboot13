import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import L, { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map.css"

// Helper: calculate distance in meters between two lat/lng pairs
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const Map = () => {
  let map: LeafletMap;
  const [mapElement, setMapElement] = createSignal<HTMLElement>()
  let userMarker: Marker;

  // Example markers (normally you’d fetch from OSM/DB)
  const poiMarkers = [
    { id: 1, name: "Fountain", lat: 52.3702, lng: 4.8952 }, // Amsterdam coords
    { id: 2, name: "Statue", lat: 52.3728, lng: 4.9000 },
  ];

  createEffect(() => {
    const element = mapElement();
    if (!element) return;
    // Setup map
    map = L.map(element).setView([52.3702, 4.8952], 15);

    // Tile layer (MapTiler with env key OR fallback to OSM)
    const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create markers for POIs
    poiMarkers.forEach((poi) => {
      const marker = L.marker([poi.lat, poi.lng]).addTo(map);
      marker.bindPopup(`${poi.name}<br><i>Get closer to interact!</i>`);
      marker.on("click", () => {
        if (userMarker) {
          const userLatLng = userMarker.getLatLng();
          const dist = haversine(
            userLatLng.lat,
            userLatLng.lng,
            poi.lat,
            poi.lng
          );

          if (dist < 50) {
            alert(`You interacted with ${poi.name}! 🎉`);
          } else {
            alert(`Too far away! You’re ${Math.round(dist)}m away.`);
          }
        }
      });
    });

    // Track user location
    userMarker = L.marker([0, 0], {
      icon: L.icon({
        iconUrl:
          "https://cdn-icons-png.flaticon.com/512/149/149060.png", // simple icon
        iconSize: [32, 32],
      }),
    }).addTo(map);

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          userMarker.setLatLng([latitude, longitude]);
          map.setView([latitude, longitude]);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );

      onCleanup(() => navigator.geolocation.clearWatch(watchId));
    }
  }, [mapElement]);

  return <div id="map" ref={setMapElement} style={{ height: "100vh", width: "100%" }} />;
};

export default Map;
