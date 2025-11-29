import { Accessor, Component } from "solid-js"
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