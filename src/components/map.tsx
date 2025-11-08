import { Accessor, Component, createEffect, createMemo, createRoot, createSignal, getOwner, onCleanup, onMount, ParentComponent } from "solid-js";
import L, { DivIconOptions, LatLng, Map as LeafletMap, Marker } from "leaflet";
import "./map.css"
import { getLocationsList, Location, resetCache } from '../supabase';
import { useLocation } from './location-context';
import { LeafletMapWrapper } from "./leaflet-wrapper";
import { Portal, render } from "solid-js/web";

/**
 * This file has nested createEffects, this causes memory leaks.
 * However, when done we redirect and this is just a joke app anyways.
 * Don't treat this as a good example.
 */

const TARGET_DISTANCE_METERS = 50; // <-- change this to your “points”
const SHOW_COORDS = true;

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
    const locationMarkerPromise = getLocationsList();
    let markersLoaded = false;

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
    const [mapLocation, setMapLocation] = createSignal<LatLng>(new LatLng(9, 9, 0));
    const [markers, setMarkers] = createSignal<(Marker & { location: Location })[]>([]);
    const userMarker = L.marker(mapLocation(), {
        icon: L.icon({
            iconUrl: "https://cdn0.iconfinder.com/data/icons/phosphor-fill-vol-3/256/map-pin-fill-512.png", // simple icon
            iconSize: [32, 32],
            // 👉 Move the anchor to the centre (half width, half height)
            iconAnchor: [16, 16],
        }),
    });


    function resetView() {
        disableMap();
        setManual(false);
        const latLong = userMarker.getLatLng();
        if (latLong.lat !== 0 && latLong.lng !== 0) {
            leafletMap()?.setView(latLong, leafletMap()?.getMaxZoom(), {
                animate: true
            });
            setMapLocation(latLong);
        }
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

        const initialLatLong = new LatLng(initialLocation.latitude, initialLocation.longitude)
        if (!manual() && map && initialLatLong.lat !== 0 && initialLatLong.lng !== 0) {
            map.setView(initialLatLong, map.getMaxZoom(), {
                animate: true,
                noMoveStart: true,
            });
            setMapLocation(initialLatLong)
        }

        const loadMarkers = async () => {
            if (markersLoaded) return;

            const locationMarkers = await locationMarkerPromise;
            markersLoaded = true;
            markers().forEach(marker => marker.remove());
            setMarkers(locationMarkers.map(mapMarker))
                .forEach(marker => {
                    if (!marker.location.final || finalVisible()) {
                        marker.addTo(map)
                    }

                    marker.on("click", async () => {
                        marker.closePopup();

                        disableMap();
                        setManual(true)
                        const markerPos = marker.getLatLng();
                        if (markerPos.lat !== 0 && markerPos.lng !== 0) {
                            map.setView(markerPos, map.getMaxZoom(), {
                                animate: true
                            });
                            setMapLocation(markerPos);
                        }

                        // Wait for animation to finish before showing the popup
                        await new Promise<void>(res => {
                            const interval = setInterval(() => {
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
        }

        try {
            // try to see if map is loaded
            map.getCenter();
        }
        catch {
            return;
        }

        await loadMarkers();


        let lastPos = map.getCenter();
        let lastZoom = map.getZoom();
        const moveByUser = () => {
            setMapLocation(map.getCenter())
            setManual(true)
        }
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

        const applyPixelRadius = () => {
            // +32 to fit icon
            const radiusPx = getPixelRadius(leafletMap()!, marker.getLatLng(), TARGET_DISTANCE_METERS + 32);
            // Grab the underlying DIV that Leaflet created for the marker
            const el = marker.getElement();
            if (el) {
                // The pseudo‑elements inherit from the root element, so we set a CSS custom property.
                el.style.setProperty("--pulse-radius", `${radiusPx}px`);
            }
        }

        // TODO color gift when close
        // TODO Solid Component here?
        if (!(marker.getIcon()?.options as DivIconOptions).html)
            marker.setIcon(L.divIcon({
                html: `<div class="custom-div-icon">
                <img
                    width="32" height="32"
                    class="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive pin-img"
                    src="https://cdn1.iconfinder.com/data/icons/icons-for-a-site-1/64/advantage_gift-64.png" />
            </div>`,
                // iconUrl: "https://cdn0.iconfinder.com/data/icons/phosphor-fill-vol-3/256/map-pin-fill-512.png", // simple icon
                iconSize: [32, 32],
                // 👉 Move the anchor to the centre (half width, half height)
                iconAnchor: [16, 16],
            }));


        // Initial sizing
        applyPixelRadius();

        // Re‑compute on every zoom/pan (any view change)
        leafletMap()?.on("zoom viewreset moveend", applyPixelRadius);

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
            // Use the component's owner to allow access to contexts
        }, renderOwner);
        abortController.signal.addEventListener('abort', dispose, { once: true });
        return Object.assign(marker, { location }) as L.Marker & { location: Location };
    }

    createEffect(() => {
        if (!leafletMap()?.dragging.enabled) return;
        const { latitude, longitude } = locationContext.location();
        if (latitude === 0 && longitude === 0) return
        const contextLatLng = new LatLng(latitude, longitude);

        userMarker.setLatLng(contextLatLng);

        if (!manual()) {
            leafletMap()?.setView(contextLatLng, leafletMap()?.getMaxZoom(), {
                animate: true,
                noMoveStart: true,
            });
            setMapLocation(contextLatLng)
            enableMap();
        }
    }, [locationContext.location, () => leafletMap()?.dragging.enabled, manual])

    return <>
        <MapOverlay leafletMap={leafletMap} markers={markers} mapLocation={mapLocation}>
            <button id="recenter" class="leaflet-control-zoom-out" disabled={nonManual()} onClick={resetView}>
                <img src="https://cdn2.iconfinder.com/data/icons/boxicons-regular-vol-3/24/bx-target-lock-64.png" />
            </button>
            <LeafletMapWrapper mapRef={setMap} />
        </MapOverlay>
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

    const closeEnough = createMemo(() => distanceFromUser() < TARGET_DISTANCE_METERS, [distanceFromUser])

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

/**
 * Helper – converts a real‑world distance (metres) to pixel radius.
 * Copied from the previous code block.
 */
function getPixelRadius(
    map: L.Map | undefined,
    centerLL: L.LatLng | undefined,
    distMeters: number
): number {
    if (!map) return TARGET_DISTANCE_METERS;
    if (!centerLL) return TARGET_DISTANCE_METERS;
    const earthRadius = 6378137; // metres (WGS‑84)
    const dLat = (distMeters / earthRadius) * (180 / Math.PI);
    const northLL = L.latLng(centerLL.lat + dLat, centerLL.lng);
    const pCenter = map.latLngToLayerPoint(centerLL);
    const pNorth = map.latLngToLayerPoint(northLL);
    return Math.round(pCenter.distanceTo(pNorth));
}

const MapOverlay: ParentComponent<{
    leafletMap: Accessor<LeafletMap | undefined>
    markers: Accessor<Marker[]>
    mapLocation: Accessor<LatLng>
}> = ({ children, leafletMap, markers, mapLocation }) => {

    const locationContext = useLocation();
    const status = createMemo(() => {
        if (locationContext.access() !== "allowed") return "WAITING"
        if (locationContext.location().toJSON() === "NO_DATA") return "NO_DATA"
        if (locationContext.location().latitude === 0
            && locationContext.location().longitude) return "NO_COORDS"

        return "LISTENING"
    }, [locationContext.access, locationContext.location])

    const mapInitialized = createMemo(() => {
        if (!leafletMap()) return 'pending'
        return mapLocation().lat !== 0 && mapLocation().lng !== 0
            ? 'initialized'
            : 'pending'
    }, [mapLocation, leafletMap]);

    const stylePortal: (x: HTMLElement) => void = x => x.className = "debug";

    return <>
        <div class="map-overlay">
            {/* <div class="notifications">oops</div> */}
        </div>
        {SHOW_COORDS && <Portal ref={stylePortal} mount={document.body}>
            <button onClick={resetCache}>Clear cache</button>
            <pre>
                ({locationContext.location().latitude},{locationContext.location().longitude}) {status()} <br />
                markers: {markers().length} map: {mapInitialized()}
            </pre>
        </Portal>}
        {children}
    </>
}