import { createMemo, createSignal, onCleanup, onMount } from "solid-js";

export function monitorStorage() {

	const [diff, setDiff] = createSignal(localStorage[`game-done-diff`] === 'true')
	const [simon, setSimon] = createSignal(localStorage[`game-done-simon`] === 'true')
	const [slider, setSlider] = createSignal(localStorage[`game-done-slider`] === 'true')

    const all = createMemo(
        () => diff() && simon() && slider()
    , [diff, simon, slider]
)

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

    return [diff, simon, slider, all]
}