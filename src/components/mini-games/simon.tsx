import { Accessor, Component, createEffect, createMemo, createSignal, onCleanup, Setter } from "solid-js";
import { MiniGame } from "../../pages/mini-game";
import { ScrollHere } from "../scroll-here";

import "./mini-game.css";
import "./simon.css";

import simonSvg from './simon/sinterklaas-simon-says.svg?raw'
import simonTab from './simon/deur.tab.txt?raw'
import { useAudio } from "../audio-context";

type TabData = (typeof rounds)[number][number];
type Color = 'red' | 'green' | 'blue' | 'yellow'
const rounds = parseTab();

function parseTab() {

	const lines = simonTab.trim().split("\n");

	return [
		parseTabLine(lines.slice(0, 6)),
		parseTabLine(lines.slice(7, 7 + 6)),
		parseTabLine(lines.slice(14, 14 + 6)),
	]
}

function parseTabLine(lines: string[]) {
	const stringToColor = {
		"E": "red" as Color,
		"B": "blue" as Color,
		"G": "green" as Color,
		"A": "yellow" as Color,
		"D": "yellow" as Color
	};

	console.log(lines.join('\n'))

	// Build array of {string, charArray}
	const parsedLines = lines.map(line => {
		const stringName = line[0] as keyof typeof stringToColor;             // first char (e B G D)
		const chars = line.slice(1).split(""); // rest of the line
		return { stringName, chars };
	});
	const result = [];

	// Go column by column
	const maxLength = Math.max(...parsedLines.map(l => l.chars.length));

	for (let i = 0; i < maxLength; i++) {
		for (const { stringName, chars } of parsedLines) {
			const char = chars[i];
			if (char && char.trim() !== '' && char !== '-' && !isNaN(+char)) {    // if it's a number
				result.push({
					color: stringToColor[stringName],
					fret: +char,
					stringName
				});
			}
		}
	}

	console.log(result)
	return result;
}

function wait(d: number) { return new Promise(r => setTimeout(r, d)) }

type Squares = Record<Color, SVGPathElement> & {
	all(action: (el: SVGPathElement) => void): void
}
type Buttons = Record<Color, SVGCircleElement> & {
	all(action: (el: SVGCircleElement, color: Color) => void): void
}
type Colors = Record<Color, string>;

export const SimonSaysGame: Component<MiniGame> = ({ finish, back }) => {

	const [svgElement, svgRef] = createSignal<HTMLDivElement>();
	const [round, setRound] = createSignal(-1);

	const { ctx } = useAudio();

	createEffect(async () => {
		const svg = svgElement();
		if (!svg) return;
		const context = ctx();

		const squares = {
			red: svg.querySelector<SVGPathElement>('#red')!,
			green: svg.querySelector<SVGPathElement>('#green')!,
			blue: svg.querySelector<SVGPathElement>('#blue')!,
			yellow: svg.querySelector<SVGPathElement>('#yellow')!,
			all(action: (square: SVGPathElement) => void) {
				action(squares.red)
				action(squares.green)
				action(squares.blue)
				action(squares.yellow)
			}
		}

		squares.all(s => s.style.display = 'none');

		const buttons = {
			red: svg.querySelector<SVGCircleElement>('#btn-red')!,
			green: svg.querySelector<SVGCircleElement>('#btn-green')!,
			blue: svg.querySelector<SVGCircleElement>('#btn-blue')!,
			yellow: svg.querySelector<SVGCircleElement>('#btn-yellow')!,
			all(action: (button: SVGCircleElement, color: Color) => void) {
				action(buttons.red, 'red')
				action(buttons.green, 'green')
				action(buttons.blue, 'blue')
				action(buttons.yellow, 'yellow')
			}
		}
		const colors: Record<Color, string> = {
			red: '#f00',
			green: '#0f0',
			blue: '#00f',
			yellow: '#ff0'
		}
		buttons.all(b => b.style.fill = 'white');
		buttons.all(b => b.style.opacity = '.5');
		buttons.all(b => b.style.display = 'none');

		const miterBtn = svg.querySelector<SVGElement>('#miter')!;

		if (!context) return;
		// Play low not to load the sound
		const gain = createGain(context);
		await playTone(context!, gain, 20, 200, 'triangle');

		simonSays(miterBtn, squares, buttons, colors, context, gain, round, setRound);

	}, [svgElement, ctx])

	return <div class="game" id="game-simon">
		<div>
			<h3>Sint zegt!</h3>
			<p>De sint doet het voor, speel het na en verdien een aanwijzing.</p>

			{round() === -1 && <p>Klik op de mijter om te beginnen.</p>}
			{round() === -2 && <p>Klik op de mijter om opnieuw te proberen.</p>}
			{round() >= 0 && round() < 4 && <p>Ronde {round() + 1}/3.</p>}
			{round() === 4 && <p>Gelukt!.</p>}
		</div>

		<div ref={svgRef} class="image" innerHTML={simonSvg} />

	</div>
}


function getNoteFrequency(stringName: TabData['stringName'], fret: number) {
	const baseFrequencies = {
		"E": 329.63, // high E
		"B": 246.94,
		"G": 196.00,
		"D": 146.83,
		"A": 110.00,
		// "E": 82.41
	};

	if (!(stringName in baseFrequencies)) throw 'should not happen';

	const fretOffset = 12; // 12 = 1 octave up
	return baseFrequencies[stringName] * Math.pow(2, (fret + fretOffset) / 12);
}

function createGain(context: AudioContext) {

	const gain = context.createGain();
	gain.connect(context.destination);

	return gain
}
function playTone(context: AudioContext, gain: GainNode, freq: number, duration = 500, type: OscillatorType = "sine") {

	const osc = context.createOscillator();
	osc.type = type;

	osc.connect(gain);

	osc.frequency.value = freq;
	osc.start();
	onCleanup(() => osc.stop());

	// fade out
	gain.gain.setValueAtTime(1, context.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration / 1000);

	osc.stop(context.currentTime + duration / 1000);

	return new Promise<void>(res => {
		osc.onended = () => res();
	})
}

function simonSays(
	miterBtn: SVGElement, squares: Squares, buttons: Buttons, colors: Colors,
	context: AudioContext, gain: GainNode, getRound: Accessor<number>, setRound: Setter<number>
) {

	miterBtn.onclick = game;

	async function game() {
		miterBtn.onclick = null;
		let roundNr = getRound();
		if (roundNr < 0) roundNr = setRound(0)

		async function goRound() {
			roundNr = getRound();
			buttons.all(b => b.onclick = null);
			buttons.all(b => b.style.fill = 'white');
			try {
				buttons.all(b => b.style.display = 'unset');
				const round = rounds[roundNr]
				for (const record of round) {
					squares[record.color].style.display = 'unset';
					await playTone(context!, gain, getNoteFrequency(record.stringName, record.fret))
					squares[record.color].style.display = 'none';
					await wait(200)
				}

				buttons.red.style.fill = colors.red;
				buttons.blue.style.fill = colors.blue;
				buttons.green.style.fill = colors.green;
				buttons.yellow.style.fill = colors.yellow;

				console.log(colors)

				const roundReversed = round.toReversed()
				let pressed = false;
				await new Promise<void>((res, rej) => buttons.all((b, c) => b.onclick = async () => {
					if (pressed) return;
					pressed = true;
					const currentNote = roundReversed.at(-1)!;
					const correct = c === currentNote.color

					b.style.opacity = '1';
					if (correct) await playTone(context, gain, getNoteFrequency(currentNote.stringName, currentNote.fret))
					else {
						await Promise.all([
							playTone(context!, gain, 80, 150, 'sawtooth'),
							playTone(context!, gain, 200, 150, 'sawtooth')
						]);
						await Promise.all([
							playTone(context!, gain, 80, 600, 'sawtooth'),
							playTone(context!, gain, 200, 700, 'sawtooth')
						]);
					}
					b.style.opacity = '.5';

					pressed = false;
					if (!correct) return rej('wrong')
					roundReversed.pop();
					if (roundReversed.length === 0) res()
				}))

				setRound(roundNr + 1)
				await wait(200)
				await goRound();
			} catch {
				setRound(-2)
				miterBtn.onclick = game;
			} finally {
				buttons.all(b => b.onclick = null);
				buttons.all(b => b.style.display = 'none');
				if (getRound() === 4) alert('Gelukt')
			}
		}
		goRound();
	}
}