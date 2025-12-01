import { A } from "@solidjs/router";
import { Component, JSX, ParentComponent, children, createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { useLocation } from '../components/location-context';
import { fetchLocationsList, Location } from "../supabase";

import './landing-page.css';

import phoneGuyImage from './illustrations/telefoon-piet.svg'
import mapImage from './illustrations/kaart.png'
import phoneImage from './illustrations/phone-illustration.png'

import compasIcon from './illustrations/kompas.svg'
import loaderIcon from './illustrations/setting-line-svgrepo-com.svg'
import infoIcon from './illustrations/info-svgrepo-com.svg'
import rejectedIcon from './illustrations/close-round-svgrepo-com.svg'
import successIcon from './illustrations/done-round-svgrepo-com.svg'

import moreContentImage from './illustrations/more-to-come.svg'
import endOfPageImage from './illustrations/end-of-page.svg'
import { FullScreenState } from "../components/screen-control";
import { ScrollHere } from "../components/scroll-here";

export const LandingPage: Component = () => {

	const [locations, setLocations] = createSignal<Location[]>()

	createEffect(async () => {
		if (locations() != undefined) return;

		const fetchedLocations = await fetchLocationsList();
		setLocations(fetchedLocations)

	}, [locations])

	const locationsLoading = createMemo(() => {
		if (!locations()) return true;
		if (locations()?.length === 0) return true;

		return false;
	}, [locations])

	return <>
		<h2>Gevonden!</h2>
		<img src={phoneGuyImage} class='phone-guy' />

		<p>
			Je hebt de puzzel opgelost, en de boodschap ontcijferd vent.<br />
			Maar denk maar niet dat je nu klaar bent.
		</p>
		<p>
			Om het echt uitdagend te maken is piet aan het vibe-coden geslagen en heeft een app gebouwd. <br />
			In het jaar van de AI, hebben ook de Sint en Pieten in ChatGPT vertrouwd.
		</p>
		<p>
			Hopelijk zitten er niet te veel bugs in, maar wie zal het weten. <br />
			Het is niet alsof één van ons echt aan de code heeft gezeten.
		</p>
		<p>
			Om te beginnen hebben we wat van je nodig, dat staat hier beneden. <br />
			Klik op de gele knop, en dan zijn wij tevreden.
		</p>

		<LocationMatch>
			<p>
				Je avontuur gaat nu digitaal verder, doe je jas maar aan. <br />
				Voor de rest van de speurtocht, moet je naar buiten gaan.
			</p>
			<p>
				Je krijgt een kaart voor je neus, met locaties gemarkeerd. <br />
				Je mag gaan navigeren, maar kijk waar je loopt, we willen niet dat jij je bezeert.
			</p>
			<PhoneIllustration />
			<p>
				Verzamel de pakketjes, die bevatten hints voor het einde van de tocht. <br />
				Als je ze allemaal hebt krijg je van ons de laatste locatie, met het cadeau dat je zocht.
			</p>
			<p>
				Je wordt onderweg nog verder uitgedaagd, maar dat zie je daar wel. <br />
				Verzamel de pakketjes, en doe het maar snel.
			</p>
			<p>
				Iedereen de jas aan! Je hoeft niet alleen op avontuur uit. <br />
				De rest moet meelopen van de sint. Dat is zijn besluit.
			</p>
			<p>
				Wederom veel plezier, niet te veel zeuren of vloeken. <br />
				Klik op de knop en begin met zoeken.
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
		<FullScreenState mode="normal" />
	</>
}

const LocationMatch: ParentComponent = (props) => {

	const locationContext = useLocation();

	return <>
		<p>
			De pieten willen proberen je te lokaliseren, <br />
			daarvoor moet je eerst de locatie‑toestemming activeren.
		</p>
		<div class="map">
			<div style={{ 'background-image': `url("${mapImage}")` }}>
				<p>
					Zonder hun kompas blijven ze zoeken in de koude nacht, <br />
					dus klik snel, dan weten ze precies waar je wacht!
				</p>
			</div>
		</div>
		<p>“Klik hier, lieve kind, op de magische knop,” roept de Sint zacht. <br />
			<LocationButton onClick={() => {
				locationContext.requestAccess();
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
						Met een vrolijk “hoera!” staat jouw plek nu helder en klaar.</p>
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


const MoreContent: Component = () => {

	return <img class="foot-illustration" src={moreContentImage} />
}
const EndOfPage: Component = () => {

	return <img class="foot-illustration" src={endOfPageImage} />
}
const PhoneIllustration: Component = () => {

	return <div class="illustration" ><img src={phoneImage} /></div>
}