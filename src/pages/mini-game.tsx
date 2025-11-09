import { useParams } from "@solidjs/router";
import { Component, createMemo, JSX } from "solid-js";
import { FullScreenState, WakeLock } from "../components/screen-control";
import { DiffGame } from '../components/mini-games/diff';

import "./mini-game.css"

// TODO should be false
const ALLOW_SKIP = true;

export const MiniGame: Component = () => {

	const { gameName } = useParams()

	function back() {
		history.back();
	}

	function finish() {
		localStorage[`game-done-${gameName}`] = true;
		back();
	}

	const backButton = <button class="big-button back-button" onClick={back}>
		<span class="icon">&leftharpoonup;</span>
		<span class="text">terug</span>
	</button>;
	const skipButton = ALLOW_SKIP && <button class="big-button skip-button" onClick={finish}>
		<span class="icon">&leftharpoonup;</span>
		<span class="text">SKIP</span>
	</button>;

	const game = createMemo(() => {
		if (gameName === 'diff') return <DiffGame />
		return gameName +  " NOT YET IMPLEMENTED"
	}, [gameName])

	return <div class="mini-game">
		{backButton} {skipButton}
		{game()}
		<WakeLock />
		<FullScreenState mode="full" />
		
		{/* <button onClick={finish}>Skip</button> */}
	</div>
}