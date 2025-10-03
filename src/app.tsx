
import { RouteSectionProps } from '@solidjs/router'
import { children, Component, createSignal } from 'solid-js'

import './app.css'

export const AppRoot: Component<RouteSectionProps> = (props) => {

    const [hasPosition, setHasPosition] = createSignal(false);

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(() => { setHasPosition(true) }, () => setHasPosition(false));
    }
    return <div>
        <h1>Pakjesboot 13</h1>
	    <p>Dit is een privé applicatie.</p>
        {hasPosition() ? children(() => props.children)() : <p>Accepteer de geolocatie aub</p>}
    </div>
}