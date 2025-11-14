import { Accessor, Component, createEffect, createMemo, createSignal } from "solid-js";

import "./diff.css";

import originalImage from './diff/original.png'
import alteredImage from './diff/changed.png'
import { MiniGame } from "../../pages/mini-game";
import { ScrollHere } from "../scroll-here";

const coordinates = [
	// Book -> Phone
	[11, 34, 17],
	// Helper face
	[21, 30, 17],
	// Anchor
	[5, 59, 20],
	// Lantern
	[20, 10, 15],
	// Cat -> Gift
	[74, 62, 22]
] as [x: number, y: number, size: number][]

export const DiffGame: Component<MiniGame> = ({ finish, back }) => {

	const [hotSpots, setHotspots] = createSignal<HotSpot[]>(coordinates.map((coordinate, i) => ({
		marked: localStorage[`game-diff-marked-${i}`] === 'true',
		coordinate,
		onClick() {
			setHotspots(original => {
				const newValue = [...original]
				newValue[i].marked = true;
				localStorage[`game-diff-marked-${i}`] = true
				return newValue;
			})
		}
	}) as HotSpot))

	const amount = hotSpots().length;

	const markedCount = createMemo(() => {
		return hotSpots().filter(h => h.marked).length
	}, [hotSpots])

	createEffect(() => {
		if ((markedCount() < amount)) return;
		finish();
	}, [markedCount])

	return <div id="game-diff">
		<div>
			<h3>Zoek de verschillen</h3>
			<p>Zoek de {amount} verschillen om een aanwijzing te verdienen</p>
			<p>Je hebt {markedCount()}/{amount} gevonden.</p>
		</div>
		<div class="seeker">
			<div>
				<img src={originalImage} />
				<HotSpots hotSpots={hotSpots} />
			</div>
			<div>
				<img src={alteredImage} />
				<HotSpots hotSpots={hotSpots} />
			</div>
		</div>
		<div>
		{markedCount() == amount && <>
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
	</div>
}

type HotSpot = {
	marked: boolean
	coordinate: [x: number, y: number, size: number]
	onClick(): void
}
type HotSpotsProps = {
	hotSpots: Accessor<HotSpot[]>
}
const HotSpots: Component<HotSpotsProps> = ({ hotSpots }) => {
	return <>{hotSpots()
		.map(h => (
			<div
				class={h.marked ? "hotspot marked" : "hotspot"}
				style={{
					left: `${h.coordinate[0]}%`,
					top: `${h.coordinate[1]}%`,
					width: `${h.coordinate[2]}%`
				}}
				onClick={h.onClick}
			>&nbsp;</div>
		))
	}</>
}