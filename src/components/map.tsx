import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
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

function fromGoogle(url: string) {
    const [lat, lng] = url
        .split('/')
        .find(part => part.includes('@'))!
        .replace('@', '')
        .split(',')

    return { lat: +lat, lng: +lng }
}

const Map = () => {
    let map: LeafletMap;
    const [mapElement, setMapElement] = createSignal<HTMLElement>()
    let userMarker: Marker;

    // Example markers (normally you’d fetch from OSM/DB)
    const poiMarkers = [
        { id: 1, name: "Partou", ...fromGoogle("https://www.google.nl/maps/place/Pleiadenplantsoen+63,+1973+BS+IJmuiden/@52.4534869,4.5959365,20.87z/data=!4m6!3m5!1s0x47c5f1dcb553ac83:0x52f05d604188f66c!8m2!3d52.4533326!4d4.5961647!16s%2Fg%2F11bw3x8w9x?entry=ttu&g_ep=EgoyMDI1MDkzMC4wIKXMDSoASAFQAw%3D%3D") }, // Amsterdam coords
        { id: 2, name: "De Tiemenlaan", ...fromGoogle('https://www.google.nl/maps/place/De+Tiemenlaan+12,+1974+RE+IJmuiden/@52.4507088,4.5931367,19.87z/data=!4m6!3m5!1s0x47c5f1ddaa52c2c9:0xbe170bdd92759054!8m2!3d52.4506715!4d4.5936671!16s%2Fg%2F11crt_lrpc?entry=ttu&g_ep=EgoyMDI1MDkzMC4wIKXMDSoASAFQAw%3D%3D') },
        { id: 3, name: "Sporthal Zeewijk", ...fromGoogle('https://www.google.nl/maps/@52.451914,4.5989405,17z?entry=ttu&g_ep=EgoyMDI1MDkzMC4wIKXMDSoASAFQAw%3D%3D') },
    ];

    const [manual, setManual] = createSignal(false);
    const nonManual = createMemo(() => !manual(), [manual]);

    function resetView() {
        disableMap();
        setManual(false);
        const latLong = userMarker.getLatLng();
        map.setView(latLong, map.getMaxZoom(), {
            animate: true
        });
        enableMap();
    }

    function disableMap() {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        // if (map.tap) map.tap.disable();
        mapElement()!.style.cursor = 'default';
    }
    function enableMap() {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        // if (map.tap) map.tap.disable();
        mapElement()!.style.cursor = 'grab';
    }


    const ctrllr = new AbortController();
    onCleanup(() => ctrllr.abort());
    createEffect(() => {

        const element = mapElement();
        if (!element) return;

        // Setup map
        map = L.map(element).setView([52.3702, 4.8952], 10, {
            animate: false
        });

        disableMap();

        map.setMinZoom(15);
        map.setMaxZoom(18);

        // Tile layer (MapTiler with env key OR fallback to OSM)
        const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

        L.tileLayer(tileUrl, {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Create markers for POIs
        poiMarkers.forEach((poi) => {
            const marker = L.marker([poi.lat, poi.lng]).addTo(map);
            marker.setIcon(L.icon({
                iconUrl: 'https://cdn1.iconfinder.com/data/icons/icons-for-a-site-1/64/advantage_gift-64.png',
                iconSize: [32, 32]
            }))
            const popup = marker.bindPopup(`${poi.name}<br><i>Kom dichtbij om te zoeken!</i>`, {
                autoPan: false,
            });

            marker.on("click", async () => {
                if (userMarker) {
                    marker.closePopup();
                    const userLatLng = userMarker.getLatLng();

                    disableMap();
                    setManual(true)
                    map.setView(marker.getLatLng(), map.getMaxZoom(), {
                        animate: true
                    });
                    const dist = haversine(
                        userLatLng.lat,
                        userLatLng.lng,
                        poi.lat,
                        poi.lng
                    );

                    if (dist < 50) {
                        marker.setPopupContent(`${poi.name}`);
                    } else {
                        marker.setPopupContent(`${poi.name}<br><i>Kom dichtbij om te zoeken!</i>`);
                    }
                    

                    await new Promise<void>(res => {
                        const interval = setInterval(() => {
                            console.log(Math.floor(map.getCenter().distanceTo(marker.getLatLng())));
                            if (Math.floor(map.getCenter().distanceTo(marker.getLatLng())) < 1) return
                            clearInterval(interval)
                            res()
                        }, 100)
                    })
                    enableMap();

                    
                    if (dist < 50) {
                        alert(`You interacted with ${poi.name}! 🎉`);
                    }
                    marker.openPopup();
                    document.addEventListener('click', ()=> marker.closePopup(), { once: true })
                    document.addEventListener('touchstart', ()=> marker.closePopup(), { once: true })

                }
            });
        });

        // Track user location
        userMarker = L.marker([0, 0], {
            icon: L.icon({
                iconUrl:
                    "https://cdn0.iconfinder.com/data/icons/phosphor-fill-vol-3/256/map-pin-fill-512.png", // simple icon
                iconSize: [32, 32],
            }),
        }).addTo(map);

        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    userMarker.setLatLng([latitude, longitude]);
                    if (!manual()) {
                        map.setView([latitude, longitude], map.getMaxZoom(), {
                            animate: true,
                            noMoveStart: true,
                        });
                        enableMap();
                    }
                },
                (err) => console.error("Geolocation error:", err),
                { enableHighAccuracy: true }
            );

            onCleanup(() => navigator.geolocation.clearWatch(watchId));
        }


        let lastPos = map.getCenter();
        let lastZoom = map.getZoom();
        const moveByUser = () => setManual(true)
        // window.addEventListener('click', moveByUser, ctrllr)
        window.addEventListener('mousedown', () => {
            lastPos = map.getCenter();
            lastZoom = map.getZoom();
        }, ctrllr)
        window.addEventListener('touchstart', () => {
            lastPos = map.getCenter();
            lastZoom = map.getZoom();
        }, ctrllr)
        window.addEventListener('mouseup', () => {
            if (map.getCenter().distanceTo(lastPos)) moveByUser()
            if (lastZoom !== map.getZoom()) moveByUser()
        }, ctrllr)
        window.addEventListener('touchend', () => {
            if (map.getCenter().distanceTo(lastPos)) moveByUser()
            if (lastZoom !== map.getZoom()) moveByUser()
        }, ctrllr)
        document.addEventListener('dragstart', moveByUser, ctrllr)
        document.addEventListener('dblclick', moveByUser, ctrllr)
        document.addEventListener('scroll', moveByUser, ctrllr)
        document.addEventListener('keydown', moveByUser, ctrllr)

    }, [mapElement]);

    return <>
        <button id="recenter" class="leaflet-control-zoom-out" disabled={nonManual()} onClick={resetView}>
            <img src="https://cdn2.iconfinder.com/data/icons/boxicons-regular-vol-3/24/bx-target-lock-64.png" />
        </button>
        <div id="map" ref={setMapElement} style={{ height: "100vh", width: "100%" }} />;
    </>
};

export default Map;
