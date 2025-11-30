import { useParams } from "@solidjs/router";
import { Accessor, Component, createMemo, createSignal, JSX } from "solid-js";
import { FullScreenState, WakeLock } from "../components/screen-control";
import { DiffGame } from '../components/mini-games/diff';

import "./mini-game.css"
import { SimonSaysGame } from "../components/mini-games/simon";
import { SliderGame } from "../components/mini-games/slider";

// TODO should be false
const ALLOW_SKIP = true;

export type MiniGame = {
	finish(): void,
	finished: Accessor<boolean>,
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

	const [finished, setFinished] = createSignal(localStorage[`game-done-${gameName}`] === 'true')

	function finish() {
		localStorage[`game-done-${gameName}`] = setFinished(true);
	}

	const backButton = <button class="big-button back-button" onClick={back}>
		<span class="icon">&leftharpoonup;</span>
		<span class="text">terug</span>
	</button>;
	const skipButton = ALLOW_SKIP && <button class="big-button skip-button" onClick={() => { finish(); }}>
		<span class="text">SKIP</span>
	</button>;

	const game = createMemo(() => {
		if (gameName === 'diff') return <DiffGame back={back} finish={finish} finished={finished} />
		if (gameName === 'simon') return <SimonSaysGame back={back} finish={finish} finished={finished} />
		if (gameName === 'slider') return <SliderGame back={back} finish={finish} finished={finished} />
		return gameName +  " NOT YET IMPLEMENTED"
	}, [gameName])

	return <div class="mini-game">
		{backButton} {skipButton}
		{game()}
		<WakeLock />
		<FullScreenState mode="full" />
	</div>
}