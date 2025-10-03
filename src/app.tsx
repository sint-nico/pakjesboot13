
import { RouteSectionProps } from '@solidjs/router'
import { children, Component } from 'solid-js'

import './app.css'

export const AppRoot: Component<RouteSectionProps> = (props) => {

    return <div>
        <h1>Pakjesboot 13</h1>
	    <p>Dit is een privé applicatie.</p>
        {children(() => props.children)()}
    </div>
}