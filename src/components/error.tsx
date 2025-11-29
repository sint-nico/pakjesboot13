import { Component, createSignal, onCleanup, onMount, Show } from "solid-js";
import { playTone } from "./audio-context";

import './error.css';

type Listener = (context: AudioContext, gain: GainNode) => Promise<void>;
let listeners: Listener[] = [];

export async function triggerError(context: AudioContext, gain: GainNode) {
    await Promise.all(listeners.map(fn => fn(context, gain)));
}

export function onError(fn: Listener) {
    listeners.push(fn);
    return () => {
        listeners = listeners.filter(l => l !== fn);
    };
}


export const ErrorCross: Component = () => {
    const [visible, setVisible] = createSignal(false);

    onMount(() => {
        const unsub = onError(async (context, gain) => {
            setVisible(true);

            await Promise.all([
                playTone(context, gain, 80, 150, 'sawtooth'),
                playTone(context, gain, 200, 150, 'sawtooth')
            ]);
            await Promise.all([
                playTone(context, gain, 80, 600, 'sawtooth'),
                playTone(context, gain, 200, 700, 'sawtooth')
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
