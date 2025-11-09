import { Component } from "solid-js";

import "./diff.css";

import originalImage from './diff/original.png'
import alteredImage from './diff/changed.png'
import { MiniGame } from "../../pages/mini-game";

export const DiffGame: Component<MiniGame> = ({ backButton }) => {

	const amount = 7;

    return <div id="game-diff">
		{backButton} 
		<div>
			<h3>Zoek de verschillen</h3>
			<p>Zoek de {amount} verschillen om een aanwijzing te verdienen</p>
		</div>
		<DiffSeeker />
	</div>
}

const DiffSeeker: Component = () => {

    return <div class="seeker">
		<div><img src={originalImage} /></div>
		<div><img src={alteredImage} /></div>
	</div>
}