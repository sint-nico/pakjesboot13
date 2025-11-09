import { useParams } from "@solidjs/router";
import { Component, createMemo } from "solid-js";
import { FullScreenState, WakeLock } from "../components/screen-control";
import { DiffGame } from '../components/mini-games/diff';

import "./mini-game.css"

export const MiniGame: Component = () => {

	const { gameName } = useParams()

	function back() {
		history.back();
	}

	function finish() {
		localStorage[`game-done-${gameName}`] = true;
		back();
	}

	const game = createMemo(() => {
		if (gameName === 'diff') return <DiffGame />
		return gameName +  " NOT YET IMPLEMENTED"
	}, [gameName])

	return <div class="mini-game">
		<button onClick={back}>Back</button>
		<button onClick={finish}>Skip</button>
		{game()}
		<WakeLock />
		<FullScreenState mode="full" />
	</div>
}