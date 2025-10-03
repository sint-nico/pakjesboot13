import { Component } from "solid-js";
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

	return <>
		<style>{style}</style>
		<h2>Game</h2>
		<Map />
	</>
}