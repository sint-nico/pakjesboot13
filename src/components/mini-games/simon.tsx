import { Accessor, Component, createEffect, createMemo, createSignal } from "solid-js";
import { MiniGame } from "../../pages/mini-game";
import { ScrollHere } from "../scroll-here";

import "./mini-game.css";
import "./simon.css";

import simonSvg from './simon/sinterklaas-simon-says.svg?raw'
import simonTab from './simon/deur.tab.txt?raw'

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

export const SimonSaysGame: Component<MiniGame> = ({ finish, back }) => {

	const [svgElement, svgRef] = createSignal<HTMLDivElement>();
	const [round, setRound] = createSignal(0);

	createEffect(() => {
		const svg = svgElement();
		if (!svg) return;

		const squares: Record<Color, SVGPathElement> = {
			red: svg.querySelector<SVGPathElement>('#red')!,
			green: svg.querySelector<SVGPathElement>('#green')!,
			blue: svg.querySelector<SVGPathElement>('#blue')!,
			yellow: svg.querySelector<SVGPathElement>('#yellow')!
		}

		squares.red.style.display = 'none';
		squares.green.style.display = 'none';
		squares.blue.style.display = 'none';
		squares.yellow.style.display = 'none';

		
		const buttons: Record<Color, SVGCircleElement> = {
			red: svg.querySelector<SVGCircleElement>('#btn-red')!,
			green: svg.querySelector<SVGCircleElement>('#btn-green')!,
			blue: svg.querySelector<SVGCircleElement>('#btn-blue')!,
			yellow: svg.querySelector<SVGCircleElement>('#btn-yellow')!
		}
		const colors: Record<Color, string> = {
			red: buttons.red.style.fill,
			green: buttons.red.style.fill,
			blue: buttons.red.style.fill,
			yellow: buttons.red.style.fill
		}
		buttons.red.style.fill = 'white';
		buttons.red.style.opacity = '.5';
		buttons.red.style.display = 'none';
		buttons.green.style.fill = 'white';
		buttons.green.style.opacity = '.5';
		buttons.green.style.display = 'none';
		buttons.blue.style.fill = 'white';
		buttons.blue.style.opacity = '.5';
		buttons.blue.style.display = 'none';
		buttons.yellow.style.fill = 'white';
		buttons.yellow.style.opacity = '.5';
		buttons.yellow.style.display = 'none';

		const miterBtn = svg.querySelector<SVGElement>('#miter')!;
		miterBtn.onclick = game;

		function blink(d: number) { return new Promise(r => setTimeout(r, d)) }
		async function game() {
			miterBtn.onclick = null;
			let gameWon = false;

			try {
				setRound(0)
				buttons.red.style.display = 'unset';
				buttons.green.style.display = 'unset';
				buttons.blue.style.display = 'unset';
				buttons.yellow.style.display = 'unset';
				for (const round of rounds) {
					setRound(r => r+1)
					for (const record of round) {
						squares[record.color].style.display = 'unset';
						await playTone(getNoteFrequency(record.stringName, record.fret))
						squares[record.color].style.display = 'none';
						await blink(200)
					}
					await blink(500)
					buttons.red.style.fill = colors.red;
					buttons.blue.style.fill = colors.blue;
					buttons.green.style.fill = colors.green;
					buttons.yellow.style.fill = colors.yellow;
					await blink(1500)
					buttons.red.style.fill = 'white';
					buttons.blue.style.fill = 'white';
					buttons.green.style.fill = 'white';
					buttons.yellow.style.fill = 'white';
				}
			} finally {
				buttons.red.style.display = 'none';
				buttons.green.style.display = 'none';
				buttons.blue.style.display = 'none';
				buttons.yellow.style.display = 'none';
				if (!gameWon) miterBtn.onclick = game;
			}
		}

	}, [svgElement])

	return <div class="game" id="game-simon">
		<div>
			<h3>Sint zegt!</h3>
			<p>De sint doet het voor, speel het na en verdien een aanwijzing.</p>
			
			{round() === 0 && <p>Klik op de mijter om te beginnen.</p>}
			{round() !== 0 && <p>Ronde {round()}/3.</p>}
		</div>

		<div ref={svgRef} innerHTML={simonSvg} />

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

function getContext() {

	if (ctx) return ctx;
	ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
	console.log('setcontext')
	return ctx
}

let ctx: AudioContext | undefined = undefined;
window.addEventListener('touchstart', getContext);
window.addEventListener('click', getContext);
window.addEventListener('scroll', getContext);

function playTone(freq: number, duration = 500) {

	ctx ??= getContext();

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = "sine";

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.frequency.value = freq;
	osc.start();

	// fade out
	gain.gain.setValueAtTime(1, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

	osc.stop(ctx.currentTime + duration / 1000);

	return new Promise<void>(res => {
		osc.onended = () => res();
	})
}
