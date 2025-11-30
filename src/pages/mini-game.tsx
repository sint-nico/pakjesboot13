import { useParams } from "@solidjs/router";
import { Accessor, Component, createMemo, createSignal, JSX, onCleanup, onMount } from "solid-js";
import { FullScreenState, WakeLock } from "../components/screen-control";
import { DiffGame } from '../components/mini-games/diff';

import "./mini-game.css"
import { SimonSaysGame } from "../components/mini-games/simon";
import { SliderGame } from "../components/mini-games/slider";

const SKIP_START_MS = 1000 * 50 * 7;
const SKIP_STEP_MS = 1000 * 60;

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

	const [skipper, setSkipper] = createSignal(-1);
	const allowSkip = createMemo(() => skipper() > -1, [skipper]);
	const skipOpacity = createMemo(() => (60 + (skipper() *20)) /100, [skipper]);

	let tim: number | undefined;
	onMount(() => {
		tim = setTimeout(() => {
			setSkipper(0);
			console.log('skipper', allowSkip(), skipOpacity())
			tim = setInterval(() => {
				if (skipper() >= 2) return clearInterval(tim);
				setSkipper(s => s+1)
			console.log('skipper', allowSkip(), skipOpacity())
			}, SKIP_STEP_MS);
		}, SKIP_START_MS)
	})
	onCleanup(() => {
		clearTimeout(tim);
		clearInterval(tim);
	})

	const backButton = <button class="big-button back-button" onClick={back}>
		<span class="icon">&leftharpoonup;</span>
		<span class="text">terug</span>
	</button>;
	const skipButton = <button 
		class="big-button skip-button" 
		style={{ display: allowSkip() ? 'grid' : 'none', opacity: skipOpacity()}} 
		onClick={() => { finish(); }}
	>
		<span class="text"></span>
		<span class="text">SKIP<br/>GAME</span>
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