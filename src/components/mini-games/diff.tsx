import { Accessor, Component, createEffect, createMemo, createSignal } from "solid-js";

import "./diff.css";

import originalImage from './diff/original.png'
import alteredImage from './diff/changed.png'

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
	[76, 65, 15]
] as [x: number, y: number, size: number][]

export const DiffGame: Component = () => {

	const [hotSpots, setHotspots] = createSignal<HotSpot[]>(coordinates.map((coordinate, i) => ({
		marked: false,
		coordinate,
		onClick() {
			setHotspots(original => {
				const newValue = [...original]			
				newValue[i].marked = true	
				return newValue;
			})
		}
	}) as HotSpot))

	const amount = hotSpots().length;

	const markedCount = createMemo(() => {
		return hotSpots().filter(h => h.marked).length
	}, [ hotSpots])



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