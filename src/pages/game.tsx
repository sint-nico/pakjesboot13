import { Component, onCleanup } from "solid-js";
import Map from '../components/map';


const style = `
.data {
	display: block;
	width: 300px;
	overflow-wrap: break-word;
}
`
export const Scanner: Component = () => {

	// TODO: map
	// TODO: track position
	// TODO: markers on map
	// TODO: mini-games

	let wakeLock: WakeLockSentinel | undefined | void = undefined;
	const ii = setInterval(async () => {
		if (!wakeLock) {
			wakeLock = await navigator.wakeLock.request("screen").catch(console.error);
			console.log('wakelock enabled')
		}
		if (import.meta.env.PROD && !document.fullscreenElement) {
			await document.body.requestFullscreen({
				navigationUI: 'hide'
			}).catch(console.error)
			console.log('fullscreen enabled')
			document.addEventListener('fullscreenchange', (e) => {
				if(document.fullscreenElement) return;
				// TODO back to home
				window.location.reload();
			}, { once: true })
		}
	}, 300);

	onCleanup(async () => {
		clearInterval(ii);
		if (wakeLock) await wakeLock.release().catch(console.error)
			wakeLock = undefined;
		console.log('wakelock disabled')
		await document.exitFullscreen?.().catch(console.error);
		console.log('fullscreen disabled')
	});

	return <>
		<style>{style}</style>
		<h2>Game</h2>
		<Map />
	</>
}