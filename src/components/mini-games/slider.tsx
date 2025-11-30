import { Accessor, Component, createEffect, createMemo, createSignal } from "solid-js";
import { MiniGame } from "../../pages/mini-game";
import { ErrorCross } from "../error";
import { Success } from "../success";

import "./mini-game.css";
import "./slider.css";

export const SliderGame: Component<MiniGame> = ({ finish, finished, back }) => {

	return <div class="game" id="game-slider">
		<ErrorCross />
		<div>
			<h3>Zoek de verschillen</h3>
			<p>WIP</p>
		</div>
		<Success message="Je hebt de puzzel opgelost, goed geschoven vriend." show={finished} back={back} />
	</div>
}
