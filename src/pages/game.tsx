import { Component, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import Map from '../components/map';
import { getLocationsFromCache } from "../supabase";
import { useLocation } from "../components/location-context";
import { errorRedirect } from "../helpers";
import { FullScreenState, WakeLock } from "../components/screen-control";
import { monitorStorage } from "../components/storage-helper";

import './game.css'
import { SuccessDisplay } from "../components/success";

export const Scanner: Component = () => {

	const locationContext = useLocation();

	onMount(() => {
		if (locationContext.access() === "idle") {
			locationContext.requestAccess();
			createEffect(() => {
				if (locationContext.access() === "requesting") return;
				if (locationContext.access() === "idle") return;
				if (locationContext.access() !== "allowed") return errorRedirect(`location: ${locationContext.access()}`);
			}, [locationContext.access])
			return;
		}
		if (locationContext.access() !== "allowed") return errorRedirect(`location: ${locationContext.access()}`);
	})

	const locations = getLocationsFromCache();
	if (!locations) errorRedirect('no markers loaded');

	return <>
		<h2>Game</h2>
		<Map locations={locations!} />
		<FinalMessage />
		<WakeLock />
		<FullScreenState mode="full" />
	</>
}

const FinalMessage: Component = () => {

	const [,,,finalVisible] = monitorStorage();
	const [closed, setClosed] = createSignal(false)
	const [ref, setRef] = createSignal<HTMLDialogElement>()

	return finalVisible() && <dialog id="end-message" open={!closed()} ref={setRef}>
		<div>
			<h2>Gefeliciteerd</h2>
			<p>
				Je hebt alle drie de aanwizingen bij elkaar!<br />
				En daarom ligt er nu een cadeautje voor je klaar.
			</p>
			<div id="success"><SuccessDisplay /></div>
			<p>
				Er is een plek op de kaart bij gezet, <br />
				daar heeft piet het cadeutje gezet.
			</p>
			<p>
				Als je er op klikt krijg je een foto van de plek in detail, gemaakt door mijn knecht, <br />
				dan kan je makkelijker zien waar het is neergelegd.
			</p>
			<p>
				Haal hem gauw op, dan is het maar gedaan. <br />
				De jute zak is van jou, de zwarte tas mag je laten staan.
			</p>
			<button onClick={() => { setClosed(true); ref()?.close()}} class="button close">
				<span class="icon">X</span>
				<span class="text">Sluit venster</span>
			</button>
		</div>
	</dialog>
}