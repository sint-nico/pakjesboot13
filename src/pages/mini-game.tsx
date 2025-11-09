import { useParams } from "@solidjs/router";
import { Component, createMemo, JSX } from "solid-js";
import { FullScreenState, WakeLock } from "../components/screen-control";
import { DiffGame } from '../components/mini-games/diff';

import "./mini-game.css"

// TODO should be false
const ALLOW_SKIP = true;

export type MiniGame = {
	finish(): void,
	back(): void
}

export const MiniGame: Component = () => {

	const { gameName } = useParams()

	function back() {
		const ok = 
			localStorage[`game-done-${gameName}`] === 'true' ||
			confirm("Je hebt de aanwijzing nog niet gevonden, weet je zeker dat je weg wilt?");
		if (ok) history.back();
	}

	function finish() {
		localStorage[`game-done-${gameName}`] = true;
	}

	const backButton = <button class="big-button back-button" onClick={back}>
		<span class="icon">&leftharpoonup;</span>
		<span class="text">terug</span>
	</button>;
	const skipButton = ALLOW_SKIP && <button class="big-button skip-button" onClick={() => { finish(); back(); }}>
		<span class="text">SKIP</span>
	</button>;

	const game = createMemo(() => {
		if (gameName === 'diff') return <DiffGame back={back} finish={finish} />
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