
import { RouteSectionProps } from '@solidjs/router'
import { children, Component } from 'solid-js'

import './app.css'
import { LocationProvider } from './components/location-context'
import { AudioProvider } from './components/audio-context'

export const AppRoot: Component<RouteSectionProps> = (props) => <div>
    <LocationProvider>
        <AudioProvider>
            <h1 class="hidden">Pakjesboot 13</h1>
            <p class="hidden">Dit is een privé applicatie.</p>
            {children(() => props.children)()}
        </AudioProvider>
    </LocationProvider>
</div>