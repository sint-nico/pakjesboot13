import { Accessor, Component, createEffect, createMemo, createSignal } from "solid-js";
import { MiniGame } from "../../pages/mini-game";
import { ErrorCross } from "../error";
import { Success } from "../success";

import "./mini-game.css";
import "./slider.css";

export const SliderGame: Component<MiniGame> = ({ finish, finished, back }) => {

	return <div class="game" id="game-slider">
		<ErrorCross />
		<div>
			<h3>Zoek de verschillen</h3>
			<p>WIP</p>
		</div>
		<Klotski finished={finished} finish={finish} />
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

const Klotski: Component<Omit<MiniGame, 'back'>> = () => {

	const [pieces, setPieces] = createSignal<Piece[]>([]);
	let initialPieces: Piece[] = [];
	const [dragging, setDragging] = createSignal<Piece | null>(null);
	const [ghost, setGhost] = createSignal<{ x: number; y: number; p: Piece } | null>(null);

	const isSolved = createMemo(() => {
		const mainPiece = pieces().find(p => p?.type === 'main')
		if (!mainPiece) return false;

		if (mainPiece.y !== 4) return false
		if (mainPiece.x !== 1) return false

		return true;
	}, [pieces])

	const clonePieces = (arr: Piece[]) => arr.map(p => ({ ...p }));
	const makeInitial = (): Piece[] => [
		{ id: 'A', w: 2, h: 2, x: 1, y: 0, type: 'main' },
		{ id: 'B', w: 1, h: 2, x: 0, y: 0, type: 'tall' },
		{ id: 'C', w: 1, h: 2, x: 3, y: 0, type: 'tall' },
		{ id: 'D', w: 2, h: 1, x: 1, y: 2, type: 'wide' },
		{ id: 'E', w: 1, h: 1, x: 0, y: 2, type: 'tiny' },
		{ id: 'F', w: 1, h: 1, x: 3, y: 2, type: 'tiny' },
		{ id: 'G', w: 1, h: 2, x: 0, y: 3, type: 'tall' },
		{ id: 'H', w: 1, h: 2, x: 3, y: 3, type: 'tall' },
	];

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
				const newPieces = clonePieces(pieces());
				const idx = newPieces.findIndex((piece) => piece.id === p.id);
				newPieces[idx].x = x;
				newPieces[idx].y = y;
				setPieces(newPieces);
			}
			setDragging(null);
			setGhost(null);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	};





	return (<div class="klotski">
		<div style={{ 'margin-bottom': '12px' }}>
			{/* <button onClick={reset}>Reset</button> */}
			<span style={{ 'margin-left': '12px', 'font-weight': '600' }}>
				{isSolved() ? 'Solved! 🎉' : 'Drag main piece down to exit'}
			</span>
		</div>
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
				const isDragging = dragging()?.id === p.id;
				return (
					<div
						class={`piece ${isDragging ? "dragging" : ""}`}
						style={{
							left: `${p.x * CELL}px`,
							top: `${p.y * CELL}px`,
							width: `${p.w * CELL}px`,
							height: `${p.h * CELL}px`,
						}}
						onPointerDown={(e) => handleDragStart(e, p)}
					>
						{p.type === 'main' ? 'MAIN' : p.id}
					</div>
				);
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
	</div>
	);
};
