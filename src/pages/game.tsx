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
		if (wakeLock) return;
  		wakeLock = await navigator.wakeLock.request("screen").catch(console.error);
		console.log('wakelock enabled')
	}, 300);

	onCleanup(async () => {
		clearInterval(ii);
		if (wakeLock) await wakeLock.release()
			wakeLock = undefined;
		console.log('wakelock disabled')
	});

	return <>
		<style>{style}</style>
		<h2>Game</h2>
		<Map />
	</>
}