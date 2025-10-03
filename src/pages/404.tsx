import { Component } from "solid-js";

export const NotFoundPage: Component = () => <>
	<h2>Niet gevonden!</h2>
	<p>Pagina niet gevonden <a href={import.meta.env.BASE_URL}>Terug naar de start</a>.</p>
</>