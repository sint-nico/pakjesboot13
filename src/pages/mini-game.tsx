import { useParams } from "@solidjs/router";
import { Component, createMemo, JSX } from "solid-js";
import { FullScreenState, WakeLock } from "../components/screen-control";
import { DiffGame } from '../components/mini-games/diff';

import "./mini-game.css"

export type MiniGame = {
	backButton: JSX.Element
}

export const MiniGame: Component = () => {

	const { gameName } = useParams()

	function back() {
		history.back();
	}

	function finish() {
		localStorage[`game-done-${gameName}`] = true;
		back();
	}

	const backButton = <button class="back-button" onClick={back}>
		<span class="icon">&leftharpoonup;</span>
		<span class="text">terug</span>
	</button>;

	const game = createMemo(() => {
		if (gameName === 'diff') return <DiffGame backButton={backButton} />
		return gameName +  " NOT YET IMPLEMENTED"
	}, [gameName])

	return <div class="mini-game">
		
		{game()}
		<WakeLock />
		<FullScreenState mode="full" />
		
		{/* <button onClick={finish}>Skip</button> */}
	</div>
}