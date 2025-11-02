import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import L, { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map.css"
import { getLocationsList } from "../supabase";
import { useLocation } from "./location-context";


const [finalVisible, setFinalVisible] = createSignal(false);


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
    const locationContext = useLocation();

    onMount(() => {
        if(locationContext.access() !== "allowed") history.back();
    })
    
    let map: LeafletMap;
    const [mapElement, setMapElement] = createSignal<HTMLElement>()
    let userMarker: Marker;

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
    createEffect(async () => {

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
        const markers = await getLocationsList();
        markers.forEach((poi) => {
            const marker = L.marker([poi.lat, poi.lng]).addTo(map);
            marker.setIcon(L.icon({
                iconUrl: 'https://cdn1.iconfinder.com/data/icons/icons-for-a-site-1/64/advantage_gift-64.png',
                iconSize: [32, 32]
            }))

            marker.bindPopup(`${poi.name}<br><i>Kom dichtbij om te zoeken!</i>`, {
                autoPan: false,
                autoClose: false
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
                        marker.setPopupContent(`<h3>${poi.name}</h3><p><hr/><b>Hier kom een knop <br/> naar een spelletje</b></p>`);

                    } else {
                        marker.setPopupContent(`<h3>${poi.name}</h3><br><i>Kom dichtbij om te zoeken!</i>`);
                    }


                    await new Promise<void>(res => {
                        const interval = setInterval(() => {
                            console.log(Math.floor(map.getCenter().distanceTo(marker.getLatLng()) * 10) / 10);
                            if (map.getCenter().distanceTo(marker.getLatLng()) > .5) return
                            clearInterval(interval)
                            res()
                        }, 100)
                    })
                    enableMap();
                    marker.openPopup();
                    document.addEventListener('click', () => marker.closePopup(), { once: true })
                    document.addEventListener('touchstart', () => marker.closePopup(), { once: true })

                }
            });

            if (poi.final && !finalVisible()){
                marker.remove()
                createEffect(() => {
                    const visible = finalVisible();
                    if (visible) marker.addTo(map);
                }, [finalVisible])
            }
        });

        // Track user location
        userMarker = L.marker([0, 0], {
            icon: L.icon({
                iconUrl:
                    "https://cdn0.iconfinder.com/data/icons/phosphor-fill-vol-3/256/map-pin-fill-512.png", // simple icon
                iconSize: [32, 32],
            }),
        }).addTo(map);
        userMarker.on('click', resetView)

        createEffect(() => {const { latitude, longitude } = locationContext.location();
            userMarker.setLatLng([latitude, longitude]);
            if (!manual()) {
                map.setView([latitude, longitude], map.getMaxZoom(), {
                    animate: true,
                    noMoveStart: true,
                });
                enableMap();
            }
        }, [locationContext.location])

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
