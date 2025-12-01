import { Accessor, Component, createMemo, createSignal, JSX, onCleanup, onMount } from 'solid-js';
import { MiniGame } from "../../pages/mini-game";
import { ErrorCross } from "../error";
import { Success } from "../success";

import "./mini-game.css";
import "./slider.css";

import redGiftImg from "./slider/red-gift-top.svg?url"
import leftShoeImg from "./slider/left-shoe.svg?url"
import rightShoeImg from "./slider/right-shoe.svg?url"
import chocoEImg from "./slider/choco-letter-e.svg?url"
import chocoDImg from "./slider/choco-letter-d.svg?url"
import speculaasImg from "./slider/Speculaas.svg?url"
import pepperNutsImg from "./slider/pepernoten.svg?url"
import chocoCoinsImg from "./slider/choco-coins.svg?url"

export const SliderGame: Component<MiniGame> = ({ finish, finished, back }) => {

	return <div class="game" id="game-slider">
		<ErrorCross />
		<div>
			<h3>Schuiven maar</h3>
			<p>WIP</p>
		</div>
		<Klotski finished={finished} finish={finish} />
		{finished() && <p>&nbsp;</p>}
		<Success message="Je hebt de puzzel opgelost, goed geschoven vriend." show={finished} back={back} />
	</div>
}

const CELL = 64;
const W = 4;
const H = 5;

type Piece = {
	id: string;
	w: number;
	h: number;
	x: number;
	y: number;
	type: string;
}
const pieceImage = (src: string, width: number, height: number) => Object.assign(document.createElement('img'),{
	src,
	width: width * CELL,
	height: height * CELL,
	onload(e: Event) {
		const element = e.currentTarget as HTMLImageElement
		element.setAttribute('loaded', '')
	}
})
const imageMap: Record<string, HTMLImageElement | undefined> = {
	A: pieceImage(redGiftImg, 2, 2),
	G: pieceImage(leftShoeImg, 1, 2),
	C: pieceImage(rightShoeImg, 1, 2),
	B: pieceImage(chocoEImg, 1, 2),
	H: pieceImage(chocoDImg, 1, 2),
	D: pieceImage(speculaasImg, 2, 1),
	E: pieceImage(pepperNutsImg, 1, 1),
	F: pieceImage(chocoCoinsImg, 1, 1),
}
const klotskiBoard: Piece[] = [
	{ id: 'A', w: 2, h: 2, x: 1, y: 0, type: 'main' },
	{ id: 'B', w: 1, h: 2, x: 0, y: 0, type: 'tall' },
	{ id: 'C', w: 1, h: 2, x: 3, y: 0, type: 'tall' },
	{ id: 'D', w: 2, h: 1, x: 1, y: 2, type: 'wide' },
	{ id: 'E', w: 1, h: 1, x: 0, y: 2, type: 'tiny' },
	{ id: 'F', w: 1, h: 1, x: 3, y: 2, type: 'tiny' },
	{ id: 'G', w: 1, h: 2, x: 0, y: 3, type: 'tall' },
	{ id: 'H', w: 1, h: 2, x: 3, y: 3, type: 'tall' },
]

const Klotski: Component<Omit<MiniGame, 'back'>> = ({ finish, finished }) => {

	const [pieces, setPieces] = createSignal<Piece[]>([]);
	let initialPieces: Piece[] = [];
	const [dragging, setDragging] = createSignal<Piece | null>(null);
	const [ghost, setGhost] = createSignal<{ x: number; y: number; p: Piece } | null>(null);
	
	
	const [imagesReady, setImagesReady] = createSignal(false)
	let tim: number | undefined;
	onMount(() => {
		tim = setInterval(() => {
			if (Object.values(imageMap).every(i => i!.hasAttribute('loaded'))) setImagesReady(true)
		}, 10);
	})
	onCleanup(() => {
		clearTimeout(tim)
	})

	const isSolved = createMemo(() => {
		if (finished()) return true;
		const mainPiece = pieces().find(p => p?.type === 'main')
		if (!mainPiece) return false;

		if (mainPiece.y !== 4) return false
		if (mainPiece.x !== 1) return false

		return true;
	}, [pieces])

	function getStoredBoard() {
		try {
			return JSON.parse(localStorage['game-slider-state'])
		} catch {
			return klotskiBoard
		}
	}
	const clonePieces = (arr: Piece[]) => arr.map(p => ({ ...p }));
	const makeInitial = (): Piece[] => finished()
		? getStoredBoard()
		: klotskiBoard;

	const occupancyMap = (pcs: Piece[]) => {
		const map: (string | null)[][] = Array.from({ length: H }, () => Array(W).fill(null));
		for (const p of pcs) {
			for (let dy = 0; dy < p.h; dy++) {
				for (let dx = 0; dx < p.w; dx++) {
					const x = p.x + dx;
					const y = p.y + dy;
					if (x >= 0 && x < W && y >= 0 && y < H) map[y][x] = p.id;
				}
			}
		}
		return map;
	};

	const canMoveOne = (pcs: Piece[], id: string, dx: number, dy: number) => {
		const p = pcs.find(x => x.id === id);
		if (!p) return false;
		const map = occupancyMap(pcs);
		for (let yy = 0; yy < p.h; yy++) {
			for (let xx = 0; xx < p.w; xx++) {
				const nx = p.x + xx + dx;
				const ny = p.y + yy + dy;
				if (ny >= H) return p.type === 'main';
				if (ny < 0 || nx < 0 || nx >= W) return false;
				if (map[ny][nx] && map[ny][nx] !== id) return false;
			}
		}
		return true;
	};

	if (pieces().length === 0) {
		initialPieces = clonePieces(makeInitial());
		setPieces(clonePieces(initialPieces));
	}

	const handleDragStart = (e: PointerEvent, p: Piece) => {
		if (!imagesReady()) return;
		e.preventDefault();
		setDragging(p);
		const startX = e.clientX;
		const startY = e.clientY;
		const origX = p.x;
		const origY = p.y;

		const onMove = (ev: PointerEvent) => {
			if (!dragging()) return;

			const dxCells = Math.round((ev.clientX - startX) / CELL);
			const dyCells = Math.round((ev.clientY - startY) / CELL);

			// Queen-style: horizontal or vertical
			let moveX = 0, moveY = 0;
			if (Math.abs(dxCells) > Math.abs(dyCells)) moveX = dxCells;
			else if (Math.abs(dyCells) > Math.abs(dxCells)) moveY = dyCells;

			const newX = origX + moveX;
			const newY = origY + moveY;

			let clampedX = Math.max(0, Math.min(W - p.w, newX));
			let clampedY =
				p.type === 'main' && clampedX === 1
					? Math.min(newY, H - 1)
					: Math.max(0, Math.min(H - p.h, newY));

			const dxAllowed = clampedX - origX;
			const dyAllowed = clampedY - origY;

			if (canMoveOne(pieces(), p.id, dxAllowed, dyAllowed)) {
				// Update ghost only if move is valid
				setGhost({ x: clampedX, y: clampedY, p });
			}
			// else do nothing → keep last valid ghost
		};


		const onUp = () => {
			if (ghost()) {
				const { x, y, p } = ghost()!;
				setPieces(prev => prev.map(pp => {
					if (pp.id !== p.id) return pp;
					return {
						...pp,
						x, y
					}
				}));
				if (isSolved()) {
					finish()
					localStorage['game-slider-state'] = JSON.stringify(pieces());
				}

			}
			setDragging(null);
			setGhost(null);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	};
	const reset = () => setPieces(pieces => pieces.map(p =>({
		...p,
		x: initialPieces.find(pp => p.id === pp.id)!.x,
		y: initialPieces.find(pp => p.id === pp.id)!.y
	})));

	return (<div class={`klotski${imagesReady() ? '' : ' loading'}`}
		style={{
			width: `${CELL * W}px`,
			height: `${(CELL * H) + CELL}px`,
		}}>
		<div
			class="klotski-board"
			style={{
				width: `${CELL * W}px`,
				height: `${CELL * H}px`,
				'margin-bottom': `${CELL}px`,
			}}
		>
			<div
				class="exit"
				style={{
					left: `${CELL}px`,
					top: `${CELL * H}px`,
					width: `${CELL * 2}px`,
					height: `${CELL}px`,
				}}
			>
				UIT
			</div>

			{/* Pieces */}
			{pieces().map(p => {
				const image = imageMap[p.id]!
				return <PieceDisplay
					dragging={dragging} finished={finished} piece={p}
					handleDragStart={handleDragStart}
					image={image}
				/>
			})}

			{/* Ghost */}
			{ghost() && (
				<div
					class="ghost-piece"
					style={{
						left: `${ghost()!.x * CELL}px`,
						top: `${ghost()!.y * CELL}px`,
						width: `${ghost()!.p.w * CELL}px`,
						height: `${ghost()!.p.h * CELL}px`,
					}}
				/>
			)}
		</div>

		<button
			class="big-button reset"
			onClick={reset}
			disabled={finished()}
			style={{
				right: `0px`,
				bottom: `${(CELL * 2) - (CELL / 2)}px`,
				width: `${CELL - 6}px`,
				height: `${CELL - 6}px`,
			}}
		>
			<span class="icon">&circlearrowleft;</span>
			<span class="text">Reset</span>
		</button>
	</div>
	);
};

type PieceProps = {
	piece: Piece
	dragging: Accessor<Piece | null>
	finished: Accessor<boolean>
	handleDragStart(e: MouseEvent, piece: Piece): void
	image: HTMLImageElement,
}
const PieceDisplay: Component<PieceProps> = ({ dragging, piece, finished, handleDragStart, image }) => {
	const isDragging = () => dragging()?.id === piece.id;
	const content = createMemo(() => {
		if (!image) return piece.id
		return image
	}, [image])

	const className = createMemo(
		() => `piece ${isDragging() ? "dragging" : ""}`,
		[isDragging]
	)
	const pos = createMemo(
		() => ({
			left: `${piece.x * CELL}px`,
			top: `${piece.y * CELL}px`,
			width: `${piece.w * CELL}px`,
			height: `${piece.h * CELL}px`,
		}) as JSX.CSSProperties,
		[() => piece.x, () => piece.y]
	)
	return <div
		class={className()}
		style={pos()}
		onPointerDown={finished() ? undefined : (e) => handleDragStart(e, piece)}
	>
		{content()}
	</div>
}