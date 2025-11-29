
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
            
            <div class="keep-image">
                <img alt="preload" src="https://ekimpvoesisnllcrwvwn.supabase.co/storage/v1/object/public/images/prd/final.jpg" />
                <img alt="preload" src="https://ekimpvoesisnllcrwvwn.supabase.co/storage/v1/object/public/images/prd/playground.jpg" />
                <img alt="preload" src="https://ekimpvoesisnllcrwvwn.supabase.co/storage/v1/object/public/images/prd/restaurant.jpg" />
                <img alt="preload" src="https://ekimpvoesisnllcrwvwn.supabase.co/storage/v1/object/public/images/prd/train.jpg" />
            </div>
        </AudioProvider>
    </LocationProvider>
</div>