import { Component, createSignal, onCleanup, onMount, Show } from "solid-js";

import './error.css';
import { useAudio } from "./audio-context";

type Listener = () => Promise<void>;
let listeners: Listener[] = [];

export async function triggerError() {
    await Promise.all(listeners.map(fn => fn()));
}

export function onError(fn: Listener) {
    listeners.push(fn);
    return () => {
        listeners = listeners.filter(l => l !== fn);
    };
}


export const ErrorCross: Component = () => {
    const [visible, setVisible] = createSignal(false);
    const { playTone } = useAudio();

    onMount(() => {

        const unsub = onError(async () => {
            setVisible(true);

            await Promise.all([
                playTone(80, 150, 'sawtooth'),
                playTone(200, 150, 'sawtooth'),
            ]);

            await Promise.all([
                playTone(80, 600, 'sawtooth'),
                playTone(200, 70, 'sawtooth'),
            ]);

            setVisible(false);
        });

        onCleanup(unsub);
    });

    return (
        <Show when={visible()}>
            <div class="error-display">
                Fout!
            </div>
        </Show>
    );
}
