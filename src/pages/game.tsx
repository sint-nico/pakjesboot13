import { Component, onCleanup } from "solid-js";
import Map from '../components/map';

const LOG_WAKE_LOCK_ISSUES = false;
const LOG_FULL_SCREEN_ISSUES = false;

export const Scanner: Component = () => {

	// TODO: map
	// TODO: track position
	// TODO: markers on map
	// TODO: mini-games

	let wakeLock: WakeLockSentinel | undefined | void = undefined;
	const ii = setInterval(async () => {
		if (!wakeLock) {
			wakeLock = await navigator.wakeLock.request("screen").catch(LOG_WAKE_LOCK_ISSUES ? console.debug : () => {});
			console.log('wakelock enabled')
		}
		if (import.meta.env.PROD && !document.fullscreenElement) {
			await document.body.requestFullscreen({
				navigationUI: 'hide'
			}).catch(console.debug)
			console.log('fullscreen enabled')
			document.addEventListener('fullscreenchange', (_e) => {
				if(document.fullscreenElement) return;
				// Reloading goes back to the landing page because of the location request.
				// TODO: pause lightbox might be nicer?
				window.location.reload();
			}, { once: true })
		}
	}, 300);

	onCleanup(async () => {
		clearInterval(ii);
		if (wakeLock) await wakeLock.release().catch(LOG_WAKE_LOCK_ISSUES ? console.debug : () => {})
			wakeLock = undefined;
		console.log('wakelock disabled')
		await document.exitFullscreen?.().catch(LOG_FULL_SCREEN_ISSUES ? console.debug : () => {});
		console.log('fullscreen disabled')
	});

	return <>
		<h2>Game</h2>
		<Map />
	</>
}