import { Component, createEffect, createMemo, createRenderEffect, createRoot, createSignal, getOwner, onCleanup, onMount } from "solid-js";
import L, { Map as LeafletMap, Marker } from "leaflet";
import "./map.css"
import { getLocationsList, Location } from '../supabase';
import { LocationContext, useLocation } from "./location-context";
import { LeafletMapWrapper } from "./leaflet-wrapper";
import { render } from "solid-js/web";

/**
 * This file has nested createEffects, this causes memory leaks.
 * However, when done we redirect and this is just a joke app anyways.
 * Don't treat this as a good example.
 */

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
    const renderOwner = getOwner();

    onMount(() => {
        if (locationContext.access() === "idle") {
            locationContext.requestAccess();
            createEffect(() => {
                if (locationContext.access() === "requesting") return;
                if (locationContext.access() !== "allowed") history.back();
            }, [locationContext.access])
            return;
        }
        if (locationContext.access() !== "allowed") history.back();
    })

    const [finalVisible, setFinalVisible] = createSignal(false);
    const [manual, setManual] = createSignal(false);
    const nonManual = createMemo(() => !manual(), [manual]);

    const [leafletMap, setMap] = createSignal<LeafletMap>();
    const [markers, setMarkers] = createSignal<(Marker & { location: Location })[]>([]);
    const userMarker = L.marker([0, 0], {
        icon: L.icon({
            iconUrl: "https://cdn0.iconfinder.com/data/icons/phosphor-fill-vol-3/256/map-pin-fill-512.png", // simple icon
            iconSize: [32, 32],
        }),
    });


    function resetView() {
        disableMap();
        setManual(false);
        const latLong = userMarker.getLatLng();
        leafletMap()?.setView(latLong, leafletMap()?.getMaxZoom(), {
            animate: true
        });
        enableMap();
    }

    function disableMap() {

        leafletMap()?.dragging.disable();
        leafletMap()?.touchZoom.disable();
        leafletMap()?.doubleClickZoom.disable();
        leafletMap()?.scrollWheelZoom.disable();
        leafletMap()?.boxZoom.disable();
        leafletMap()?.keyboard.disable();

        const container = leafletMap()?.getContainer();
        if (container) container.style.cursor = 'default';
    }
    function enableMap() {

        leafletMap()?.dragging.enable();
        leafletMap()?.touchZoom.enable();
        leafletMap()?.doubleClickZoom.enable();
        leafletMap()?.scrollWheelZoom.enable();
        leafletMap()?.boxZoom.enable();
        leafletMap()?.keyboard.enable();

        const container = leafletMap()?.getContainer();
        if (container) container.style.cursor = 'grab';
    }


    const abortController = new AbortController();
    onCleanup(() => abortController.abort());


    createEffect(async () => {
        const initialLocation = locationContext.location();
        const map = leafletMap();
        if (!map) return;

        map.setMinZoom(15);
        map.setMaxZoom(18);

        disableMap()

        userMarker.setLatLng([initialLocation.latitude, initialLocation.longitude])
        userMarker.addTo(map);
        userMarker.on('click', resetView);
        abortController.signal.addEventListener('abort', () => userMarker.off('click', resetView), { once: true })

        const locationMarkers = await getLocationsList();
        setMarkers(locationMarkers.map(mapMarker))
            .forEach(marker => {
                if (!marker.location.final || finalVisible()) {
                    marker.addTo(map)
                }

                marker.on("click", async () => {
                    marker.closePopup();

                    disableMap();
                    setManual(true)
                    map.setView(marker.getLatLng(), map.getMaxZoom(), {
                        animate: true
                    });

                    // Wait for animation to finish before showing the popup
                    await new Promise<void>(res => {
                        const interval = setInterval(() => {
                            console.log(Math.floor(map.getCenter().distanceTo(marker.getLatLng()) * 10) / 10);
                            if (map.getCenter().distanceTo(marker.getLatLng()) > .5) return
                            if (map.getZoom() !== map.getMaxZoom()) return;
                            clearInterval(interval)
                            res()
                        }, 100)
                    })
                    await new Promise<void>(res => setTimeout(res, 100));

                    marker.openPopup();
                    enableMap();
                    document.addEventListener('click', () => marker.closePopup(), { once: true, signal: abortController.signal })
                    document.addEventListener('touchstart', () => marker.closePopup(), { once: true, signal: abortController.signal })
                });
            });

        if (!manual())
            map.setView([initialLocation.latitude, initialLocation.longitude], map.getMaxZoom(), {
                animate: true,
                noMoveStart: true,
            });


        let lastPos = map.getCenter();
        let lastZoom = map.getZoom();
        const moveByUser = () => setManual(true)
        window.addEventListener('mousedown', () => {
            lastPos = map.getCenter();
            lastZoom = map.getZoom();
        }, abortController)
        window.addEventListener('touchstart', () => {
            lastPos = map.getCenter();
            lastZoom = map.getZoom();
        }, abortController)
        window.addEventListener('mouseup', () => {
            if (map.getCenter().distanceTo(lastPos)) moveByUser()
            if (lastZoom !== map.getZoom()) moveByUser()
        }, abortController)
        window.addEventListener('touchend', () => {
            if (map.getCenter().distanceTo(lastPos)) moveByUser()
            if (lastZoom !== map.getZoom()) moveByUser()
        }, abortController)
        document.addEventListener('dragstart', moveByUser, abortController)
        document.addEventListener('dblclick', moveByUser, abortController)
        document.addEventListener('scroll', moveByUser, abortController)
        document.addEventListener('keydown', moveByUser, abortController)

        enableMap();

    }, [leafletMap])

    function mapMarker(location: Location) {
        const marker = L.marker([location.lat, location.lng])

        marker.setIcon(L.icon({
            iconUrl: 'https://cdn1.iconfinder.com/data/icons/icons-for-a-site-1/64/advantage_gift-64.png',
            iconSize: [32, 32]
        }))

        marker.bindPopup(document.createElement('div'), {
            autoPan: false,
            autoClose: false
        });
        
        const target = marker.getPopup()?.getContent() as HTMLElement;
        const dispose = createRoot(disposeRoot => {
            // Solid will render into the wrapper.
            render(() => <MarkerFrame location={location} />, target);
            // Return the disposer for the caller.
            return disposeRoot;
        }, renderOwner);
        abortController.signal.addEventListener('abort', dispose, { once: true });
        return Object.assign(marker, { location }) as L.Marker & { location: Location };
    }

    createEffect(() => {
        if (!leafletMap()?.dragging.enabled) return;
        const { latitude, longitude } = locationContext.location();
        userMarker.setLatLng([latitude, longitude]);
        if (!manual()) {
            leafletMap()?.setView([latitude, longitude], leafletMap()?.getMaxZoom(), {
                animate: true,
                noMoveStart: true,
            });
            enableMap();
        }
    }, [locationContext.location, () => leafletMap()?.dragging.enabled, manual])

    return <>
        <button id="recenter" class="leaflet-control-zoom-out" disabled={nonManual()} onClick={resetView}>
            <img src="https://cdn2.iconfinder.com/data/icons/boxicons-regular-vol-3/24/bx-target-lock-64.png" />
        </button>
        <LeafletMapWrapper mapRef={setMap} />
    </>
};

export default Map;

type MarkerFrameProps = {
    location: Location
}
const MarkerFrame: Component<MarkerFrameProps> = ({ location }) => {

    const locationContext = useLocation();

    const distanceFromUser = createMemo(() => {
        const userLocation = locationContext.location()

        const dist = haversine(
            userLocation.latitude,
            userLocation.longitude,
            location.lat,
            location.lng
        );
        return dist;
    }, [locationContext.location, location])

    const closeEnough = createMemo(() => distanceFromUser() < 50, [distanceFromUser])

    return <div>
        <h3>{location.name}</h3>
        <p>{distanceFromUser()} {closeEnough() ? 'close' : 'not close'}</p>
        {!closeEnough() && <><br /><i>Kom dichtbij om te zoeken!</i></>}
        {closeEnough() && <>
            <hr />
            <b>Hier kom een knop <br /> naar een spelletje</b>
        </>}
    </div>
}