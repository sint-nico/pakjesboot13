import { A } from "@solidjs/router";
import { Component, ParentComponent, children, createEffect, createMemo, createSignal } from 'solid-js';
import { useLocation } from "../components/location-context";
import { fetchLocationsList, Location } from "../supabase";

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

	const [locations, setLocations] = createSignal<Location[]>() 
	const locationContext = useLocation();

	createEffect(async () => {
		if (locations() != undefined) return;

		const fetchedLocations = await fetchLocationsList();
		setLocations(fetchedLocations)

	}, [locations])

	return <>
		<p>
			De pieten willen proberen je te lokaliseren, <br />
			daarvoor moet je eerst de locatie‑toestemming activeren.
		</p>
		<p>
			Zonder hun kompas blijven ze zoeken in de koude nacht, <br />
			dus klik snel, dan weten ze precies waar je wacht!
		</p>
		{
			createMemo(() => {
				if (locationContext.access() === 'allowed') return <>

					<p>De bel galmt luid, de Sint lacht: “Ja, ik zie je daar!” <br />
						Met een vrolijk “ja” staat jouw plek nu helder en klaar.</p>
					<p>Nu de locatie bekend is, gaan we vol vertrouwen eropuit, <br />
						de Pieten scheuren door de nacht, telefoon in de hand, op zoek naar de buit.</p>
					{children(() => props.children)()}
				</>
				if (locationContext.access() === 'unsupported') return <>
					<p>De Wegwijspiet zoekt, maar jouw toestel kent de kaart niet,<br />
						het mist de GPS‑kracht, benadrukt Piet.</p>
					<p>Pak daarom een ander mobieltje of een browser die wel kan doen, <br />
						zodat de Pieten jouw kunnen volgen van pleintje tot plantsoen.</p>
				</>
				if (locationContext.access() === 'denied') return <>
					<p>De Wegwijspiet zegt: “We horen niets, het blijft stil!” <br />
						Je drukte ons weg, keerde je schouder, het is kil. </p>
					<p>Ga naar de privacy‑opties, zet de locatie-toestemming weer terug, <br />
						reset de rechten, dan kunnen we weer verder, vlug!</p>
				</>

				return <>
					<p>“Klik hier, lieve kind, op de magische knop,” roept de Sint zacht. <br />
						<button onClick={locationContext.requestAccess} disabled={locations() === undefined || locationContext.access() === 'requesting'}>Deel mijn locatie</button> – een sprankelend gebaar, heel onverwacht.
					</p>
					<p>Een venster verschijnt, vraagt: "Wil ik je de locatie ontbinden?” <br />
						Zeg "ja" en de Pieten kunnen je vinden!
					</p>

				</>
			}, [locationContext.access])()
		}</>;
}