import { Component, createEffect, onCleanup, onMount } from "solid-js";
import Map from '../components/map';
import { getLocationsFromCache } from "../supabase";
import { useLocation } from "../components/location-context";
import { errorRedirect } from "../helpers";

const LOG_WAKE_LOCK_ISSUES = false;
const LOG_FULL_SCREEN_ISSUES = false;

export const Scanner: Component = () => {

	// TODO: mini-games

	let wakeLock: WakeLockSentinel | undefined | void = undefined;
	const ii = setInterval(async () => {
		if (!wakeLock) {
			wakeLock = await navigator.wakeLock.request("screen").catch(LOG_WAKE_LOCK_ISSUES ? console.debug : () => { });
			console.debug('wakelock enabled')
		}
		if (import.meta.env.PROD && !document.fullscreenElement) {
			await document.body.requestFullscreen({
				navigationUI: 'hide'
			}).catch(console.debug)
		}
	}, 300);
	const locationContext = useLocation();

	onMount(() => {
		if (locationContext.access() === "idle") {
			locationContext.requestAccess();
			createEffect(() => {
				if (locationContext.access() === "requesting") return;
				if (locationContext.access() !== "allowed") return errorRedirect();
			}, [locationContext.access])
			return;
		}
		if (locationContext.access() !== "allowed") return errorRedirect();
	})

	onCleanup(async () => {
		clearInterval(ii);
		if (wakeLock) await wakeLock.release().catch(LOG_WAKE_LOCK_ISSUES ? console.debug : () => { })
		wakeLock = undefined;
		console.debug('wakelock disabled')
		await document.exitFullscreen?.().catch(LOG_FULL_SCREEN_ISSUES ? console.debug : () => { });
		console.debug('fullscreen disabled')
	});


	const locations = getLocationsFromCache();
	if (!locations) errorRedirect();

	return <>
		<h2>Game</h2>
		<Map locations={locations!} />
	</>
}