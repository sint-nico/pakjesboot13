import { Accessor, Component, createSignal, onCleanup, onMount } from "solid-js"
import { ScrollHere } from "./scroll-here"
import { MiniGame } from "../pages/mini-game"

import './success.css'

export type SuccessProps = {
	show: Accessor<boolean>
	back: MiniGame['back']
}
export const Success: Component<SuccessProps> = ({ show, back }) => {

	return <div id="success">
		{show() && <>
			<p>
				He hebt alle verschillen gevonden, goed gezien vriend. <br />
				Omdat je zo je hest doet, heb je een aanwijzing verdiend!
			</p>
			<Display />
			<p>
				Het is weer tijd om je avontuur op de kaart voort te zetten, vlug.
			</p>
			<button onClick={back} class="button back">
				<span class="icon">&leftharpoonup;</span>
				<span class="text">Verlaat deze puzzel, en ga terug</span>
			</button>
			<ScrollHere />
		</>}
	</div>
}
import redGiftIcon from './markers/gift-red.svg' 
import blueGiftIcon from './markers/gift-blue.svg' 
import greenGiftIcon from './markers/gift-green.svg' 

const Display: Component = () => {

	const [diff, setDiff] = createSignal(localStorage[`game-done-diff`] === 'true')
	const [simon, setSimon] = createSignal(localStorage[`game-done-simon`] === 'true')
	const [slider, setSlider] = createSignal(localStorage[`game-done-slider`] === 'true')

	let tim: number | undefined;
	onMount(() => {
		setDiff(localStorage[`game-done-diff`] === 'true')
		setSimon(localStorage[`game-done-simon`] === 'true')
		setSlider(localStorage[`game-done-slider`] === 'true')
		tim = setInterval(() => {		
			setDiff(localStorage[`game-done-diff`] === 'true')		
			setSimon(localStorage[`game-done-simon`] === 'true')
			setSlider(localStorage[`game-done-slider`] === 'true')
		}, 100);
	})

	onCleanup(() => {
		clearInterval(tim)
	})

	return <ol class="clues">
		<li class={!diff() ? 'not-done' : ''}><img src={greenGiftIcon} /></li>
		<li class={!simon() ? 'not-done' : ''}><img src={blueGiftIcon} /></li>
		<li class={!slider() ? 'not-done' : ''}><img src={redGiftIcon} /></li>
		<li>{diff() ? <>Het ligt<br />buiten</> : '???'}</li>
		<li>{simon() ? <>In een<br />zwarte tas</> : '???'}</li>
		<li>{slider() ? <>Vlakbij<br />het begin</> : '???'}</li>
	</ol>
}