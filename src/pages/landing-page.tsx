import { A } from "@solidjs/router";
import { Component, ParentComponent, children, createMemo } from 'solid-js';
import { useLocation } from "../components/location-context";

export const LandingPage: Component = () => {

	return <>
		<h2>Start</h2>
		<p>Druk op start:</p>
		<p>TODO instructies</p>

		<LocationMatch>
			<p><A href="/zoeken/">Start</A></p>
		</LocationMatch>
	</>
}

const LocationMatch: ParentComponent = (props) => {

	const locationContext = useLocation();

	return <> {
		createMemo(() => {
			if (locationContext.access() === 'allowed') return children(() => props.children)()
			if (locationContext.access() === 'unsupported') return <>
				<h3>Helaas, geen ondersteuning</h3>
				<p>Helaas is jouw apparaat niet ondersteund, zonder locatievoorziening kunnen we je niet helpen.</p>
				<p>Vraag iemand anders om hulp.</p>
			</>
			if (locationContext.access() === 'denied') return <>
				<h3>Helaas, geen locatie</h3>
				<p>Oeps! Je hebt de locatievoorziening afgewezen. <br/> dat is niet zo handig.</p>
				<p>AUB reset je browser permissies.</p>
			</>

			return <>
				<p>{locationContext.access()}</p>
				<p>{locationContext.location().toJSON()}</p>
				<button onClick={locationContext.requestAccess}>Access</button>
			</>
		}, [locationContext.access])()
	}</>;
}