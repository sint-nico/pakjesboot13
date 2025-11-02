import { Component, onCleanup, onMount, Setter } from "solid-js";
import type { Map } from "leaflet";
import "leaflet/dist/leaflet.css";

export type LeafletMapProps = {
    mapRef: Setter<Map | undefined>
}

export const LeafletMapWrapper: Component<LeafletMapProps> = (props) => {
    
    const mapElement: HTMLDivElement = Object.assign(document.createElement('div'), {
        id: 'map',
        style: { height: "100vh", width: "100%", position: 'unset' },
        height: "100vh",
        width: "100%",
    })

    let map: Map | undefined

    onMount(async () => {
        // Dynamically loading leaflet seems to be the key to supporting refresh
        const L = (await import('leaflet')).default;
        map = L.map(mapElement, {
            trackResize: true,
            
        })
        // Tile layer (MapTiler with env key OR fallback to OSM)
        const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

        L.tileLayer(tileUrl, {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        }).addTo(map);

        props.mapRef(map);
    });

    onCleanup(() => {
        map?.stop()
        map?.remove();
        map = undefined;
        props.mapRef(undefined);
    })


    return mapElement
};

export default Map;
