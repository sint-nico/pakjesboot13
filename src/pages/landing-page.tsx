import { A } from "@solidjs/router";
import { Component, JSX, ParentComponent, children, createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { useLocation } from '../components/location-context';
import { fetchLocationsList, Location } from "../supabase";

import './landing-page.css';

import phoneGuyImage from './telefoon-piet.svg?no-inline'
import mapImage from './kaart.png?no-inline'
import phoneImage from './phone-illustration.png?no-inline'

import compasIcon from './kompas.svg?no-inline'
import loaderIcon from './setting-line-svgrepo-com.svg?no-inline'
import infoIcon from './info-svgrepo-com.svg?no-inline'
import rejectedIcon from './close-round-svgrepo-com.svg?no-inline'
import successIcon from './done-round-svgrepo-com.svg?no-inline'

import moreContentImage from './more-to-come.svg?no-inline'
import endOfPageImage from './end-of-page.svg?no-inline'

export const LandingPage: Component = () => {

	const [locations, setLocations] = createSignal<Location[]>()

	createEffect(async () => {
		if (locations() != undefined) return;

		const fetchedLocations = await fetchLocationsList();
		setLocations(fetchedLocations)

	}, [locations])

	const locationsLoading = createMemo(() => {
		if (!locations()) return true;
		if(locations()?.length === 0) return true;

		return false;
	}, [locations])

	return <>
		<h2>Gevonden!</h2>
		<img src={phoneGuyImage} class='phone-guy' />

		<p>
			TODO gedichtje met instructies<br />
			Maar nu nog even niet
		</p>
		<p>
			Hier komt nog meer gedichtje... <br />
			Maar nu nog even niet
		</p>
		<p>
			Hier komt nog meer gedichtje... <br />
			Maar nu nog even niet
		</p>
		<p>
			Hier komt nog meer gedichtje... <br />
			Maar nu nog even niet
		</p>

		<LocationMatch>
			<p>
				Hier komt nog meer gedichtje... <br />
				Maar nu nog even niet
			</p>
			<p>
				Hier komt nog meer gedichtje... <br />
				Maar nu nog even niet
			</p>
			<p>
				Hier komt nog meer gedichtje... <br />
				Maar nu nog even niet
			</p>
			<PhoneIllustration />
			<p>
				Hier komt nog meer gedichtje... <br />
				Maar nu nog even niet
			</p>
			<p>
				Hier komt nog meer gedichtje... <br />
				Maar nu nog even niet
			</p>
			<p>
				<A 
					href="/zoeken/" 
					class="button start-button" 
					aria-disabled={locationsLoading() ? 'true' : undefined}
					onClick={(e) => {
						if (locationsLoading()) {
							e.preventDefault();
							e.stopPropagation();
							return false;
						}
					}}
				>
					<span class="text">Start</span>
				</A>
			</p>
			<EndOfPage />
		</LocationMatch>
		<a id="after-location" />
	</>
}

const LocationMatch: ParentComponent = (props) => {

	const locationContext = useLocation();

	return <>
		<p>
			De pieten willen proberen je te lokaliseren, <br />
			daarvoor moet je eerst de locatie‑toestemming activeren.
		</p>
		<div class="map" style={{ 'background-image': `url("${mapImage}")` }}>
			<p>
				Zonder hun kompas blijven ze zoeken in de koude nacht, <br />
				dus klik snel, dan weten ze precies waar je wacht!
			</p>
		</div>
		<p>“Klik hier, lieve kind, op de magische knop,” roept de Sint zacht. <br />
			<LocationButton onClick={() => {
				locationContext.requestAccess();
				// TODO on status change
				document.getElementById('after-location')?.scrollIntoView({
					behavior: 'smooth'
				})
			}} /> <span class="after-button">– een mooi gebaar,</span>
			<br style="clear: both;" />
			en niet geheel onverwacht.
		</p>
		<p>
			Een venster zal je vragen: "Wil ik je de locatie ontbinden?” <br />
			Accepteer het verzoek en de Pieten kunnen je vinden!
		</p>
		{
			createMemo(() => {
				if (locationContext.access() === 'allowed') return <>

					<p>De bel galmt luid, de Sint lacht: “Ja, ik zie je daar!” <br />
						Met een vrolijk “ja” staat jouw plek nu helder en klaar.</p>
					<p>Nu de locatie bekend is, gaan we vol vertrouwen eropuit, <br />
						de Pieten scheuren door de nacht, telefoon in de hand, op zoek naar de buit.</p>
					<ScrollHere />
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
					<ScrollHere />
				</>

				return <MoreContent />
			}, [locationContext.access])()
		}</>
}

type LocationButtonProps = {
	onClick: JSX.CustomEventHandlersCamelCase<HTMLButtonElement>['onClick']
}
const LocationButton: Component<LocationButtonProps> = ({ onClick }) => {

	const locationContext = useLocation();
	const disabled = createMemo(() => {
		if (locationContext.access() === 'idle') return false;
		return true;
	})

	const statusIcon = createMemo(() => {
		if (locationContext.access() === 'requesting') return <img class="status spin loader" src={loaderIcon} />;
		if (locationContext.access() === 'unsupported') return <img class="status" src={rejectedIcon} />;
		if (locationContext.access() === 'denied') return <img class="status" src={infoIcon} />;
		if (locationContext.access() === 'allowed') return <img class="status allowed" src={successIcon} />;
		return undefined
	})

	return <button onClick={onClick} class="button location-button" disabled={disabled()}>

		<span class="text">Deel mijn locatie</span>
		<img class="icon" src={compasIcon} />
		{statusIcon()}
	</button>
}

const ScrollHere: Component = () => {

	const [ref, setRef] = createSignal<HTMLAnchorElement>();

	onMount(() => {
		ref()?.scrollIntoView({
			behavior: 'smooth'
		})
	})

	return <a ref={setRef} />
}

const MoreContent: Component = () => {

	return <img class="foot-illustration" src={moreContentImage} />
}
const EndOfPage: Component = () => {

	return <img class="foot-illustration" src={endOfPageImage} />
}
const PhoneIllustration: Component = () => {

	return <div class="illustration" ><img src={phoneImage} /></div>
}