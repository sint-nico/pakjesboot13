import { Accessor, Component, createEffect, createMemo, createSignal } from "solid-js";

import "./mini-game.css";
import "./diff.css";

import originalImage from './diff/original.png'
import alteredImage from './diff/changed.png'
import { MiniGame } from "../../pages/mini-game";
import { ErrorCross, triggerError } from "../error";
import { Success } from "../success";

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

export const DiffGame: Component<MiniGame> = ({ finish, finished, back }) => {

	const [hotSpots, setHotspots] = createSignal<HotSpot[]>(coordinates.map((coordinate, i) => ({
		marked: localStorage[`game-diff-marked-${i}`] === 'true' || finished(),
		coordinate,
		i,
		onClick() {
			setHotspots(original => {
				if (finished()) return original;
				const newValue = [...original]
				newValue[i].marked = true;
				localStorage[`game-diff-marked-${i}`] = true
				return newValue;
			})
		}
	}) as HotSpot))

	const amount = hotSpots().length;

	function reset() {
		triggerError()
		if (localStorage[`game-done-diff`] === 'true') return;
		setHotspots(() => {
			const val = [...hotSpots()]
			for (const hotSpot of val) {
				localStorage[`game-diff-marked-${hotSpot.i}`] = false
				hotSpot.marked = false
			}
			return val
		})
	}

	const markedCount = createMemo(() => {
		return hotSpots().filter(h => h.marked).length
	}, [hotSpots])

	createEffect(() => {
		if ((markedCount() < amount)) return;
		finish();
	}, [markedCount])

	return <div class="game" id="game-diff">
		<ErrorCross />
		<div>
			<h3>Zoek de verschillen</h3>
			<p>Zoek de {amount} verschillen om een aanwijzing te verdienen</p>
			<p>Je hebt {markedCount()}/{amount} gevonden.</p>
		</div>
		<div class="seeker">
			<div>
				<img src={originalImage} onClick={reset} />
				<HotSpots hotSpots={hotSpots} />
			</div>
			<div>
				<img src={alteredImage} onClick={reset} />
				<HotSpots hotSpots={hotSpots} />
			</div>
		</div>
		<Success show={finished} back={back} />
	</div>
}

type HotSpot = {
	marked: boolean
	i: number
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