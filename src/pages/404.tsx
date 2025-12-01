import { Component, onMount } from "solid-js";
import { useFullScreen } from "../components/screen-control";

export const NotFoundPage: Component = () => {

	const fs = useFullScreen();
	onMount(() => fs.set('normal'))
	
	return <>
		<h2>Niet gevonden!</h2>
		<p>Pagina niet gevonden <a href={import.meta.env.BASE_URL}>Terug naar de start</a>.</p>
	</>;
}