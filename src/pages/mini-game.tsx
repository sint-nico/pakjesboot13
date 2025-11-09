import { useParams } from "@solidjs/router";
import { Component } from "solid-js";

export const MiniGame: Component = () => {

	const { gameName } = useParams()

	function back() {
		history.back();
	}

	function finish() {
        localStorage[`game-done-${gameName}`] = true;
		back();
	}

	return <>
		<h2>Minigame</h2>
		<p>{}</p>
		<button onClick={back}>Back</button>
		<button onClick={finish}>Finish</button>
	</>
}