import { Accessor, Component, createEffect, createSignal, Setter } from "solid-js";
import { MiniGame } from "../../pages/mini-game";

import "./mini-game.css";
import "./simon.css";

import simonSvg from './simon/sinterklaas-simon-says.svg?raw'
import simonTab from './simon/deur.tab.txt?raw'
import { ErrorCross, triggerError } from "../error";
import { Success } from "../success";
import { useAudio, AudioContext } from "../audio-context";

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

export const SimonSaysGame: Component<MiniGame> = ({ finish, finished, back }) => {

	const [svgElement, svgRef] = createSignal<HTMLDivElement>();
	const [round, setRound] = createSignal(-1);
	const [gameOn, setGameOn] = createSignal(false);

	const { ctx, playTone } = useAudio();

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

		simonSays(miterBtn, squares, buttons, colors, round, setRound, playTone, setGameOn, finish, finished);

	}, [svgElement, ctx])

	return <div class="game" id="game-simon">
		<ErrorCross />
		<div>
			<h3>Sint zegt!</h3>
			<p>De sint doet het voor, speel het na en verdien een aanwijzing door na te spelen.</p>
			<p>Gebruik ook <span class="sound-notice">je oren</span>, zet je volume op z'n hoogst, wat kan jou het schelen?</p>

			<p>Een groene, een rode, een blauwe, een gele<span class="bad-rime">(n)</span>.</p>
			<div class="double-height">
				{!finished() && !gameOn() && round() === -1 && <p>Klik op de <span class="sound-notice">mijter</span> om te spelen.</p>}
				{!finished() && !gameOn() && round() !== -1 && <p>Klik op de <span class="sound-notice">mijter</span> om opnieuw te spelen.</p>}
				{!finished() && gameOn() && round() >= 0 && round() < 3 && <p>Je bent ronde {round() + 1}/3 aan het spelen.</p>}
				{finished() && <p>Gelukt! Je bent klaar met spelen.</p>}
			</div>
		</div>

		<div ref={svgRef} class="sint-image" innerHTML={simonSvg} />

		<Success message="Je bent klaar, goed gespeeld vriend." show={finished} back={back} />

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

function simonSays(
	miterBtn: SVGElement, squares: Squares, buttons: Buttons, colors: Colors,
	getRound: Accessor<number>, setRound: Setter<number>, playTone: AudioContext['playTone'],
	setGameOn: Setter<boolean>, finish: MiniGame['finish'], finished: MiniGame['finished']
) {

	if (!finished()) miterBtn.onclick = game;

	async function game() {
		miterBtn.onclick = null;
		if (finished()) return;
		let roundNr = getRound();
		if (roundNr < 0) roundNr = setRound(0);
		setGameOn(true);

		async function goRound() {
			if (finished()) return;
			if (roundNr === 3) return;
			if (getRound() === 3) return;
			miterBtn.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
			roundNr = getRound();
			buttons.all(b => b.onclick = null);
			buttons.all(b => b.style.fill = 'white');
			try {
				buttons.all(b => b.style.display = 'unset');
				const round = rounds[roundNr]
				for (const record of round) {
					squares[record.color].style.display = 'unset';
					await playTone(getNoteFrequency(record.stringName, record.fret), 500, 'sine')
					squares[record.color].style.display = 'none';
					await wait(200)
				}

				buttons.red.style.fill = colors.red;
				buttons.blue.style.fill = colors.blue;
				buttons.green.style.fill = colors.green;
				buttons.yellow.style.fill = colors.yellow;

				const roundReversed = round.toReversed()
				let pressed = false;
				await new Promise<void>((res, rej) => buttons.all((b, c) => b.onclick = async () => {
					if (pressed) return;
					pressed = true;
					const currentNote = roundReversed.at(-1)!;
					const correct = c === currentNote.color

					b.style.opacity = '1';
					if (correct) {
						playTone(getNoteFrequency(currentNote.stringName, currentNote.fret), 500, 'sine')
						await wait(150)
					}
					else {
						await triggerError()
					}
					b.style.opacity = '.5';

					pressed = false;
					if (!correct) return rej('wrong')
					roundReversed.pop();
					if (roundReversed.length === 0) res()
				}))

				setRound(roundNr + 1)
				await wait(600);
				await goRound();
			} catch {
				setGameOn(false);
				miterBtn.onclick = game;
			} finally {
				buttons.all(b => b.onclick = null);
				buttons.all(b => b.style.display = 'none');
				if (getRound() === 3) finish()
			}
		}
		await goRound();
	}
}