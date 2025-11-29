import { Accessor, createContext, createSignal, onCleanup, onMount, ParentProps, useContext } from "solid-js";

type AudioContext = {
  ctx: Accessor<globalThis.AudioContext | undefined>
}
const audioContext = createContext<AudioContext>({
  ctx: () => undefined
})

export function AudioProvider(props: ParentProps) {
  const abortController = new AbortController();
  const [ctx, setCtx] = createSignal<globalThis.AudioContext>();

  onCleanup(() => abortController.abort('cleanup'));
  onMount(() => {
    window.addEventListener('touchstart', tryGetContext, { signal: abortController.signal });
    window.addEventListener('click', tryGetContext, { signal: abortController.signal });
    window.addEventListener('scroll', tryGetContext, { signal: abortController.signal });
    tryGetContext();
  })

  function tryGetContext() {
    if (ctx()) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) return;
      audioCtx.addEventListener('statechange', () => {
        if (audioCtx.state !== 'running') return
        setCtx(audioCtx);
        console.log('ctx set', audioCtx)
        abortController.signal.addEventListener('abort', () => ctx()?.close(), { once: true });
      }, { signal: abortController.signal })
    } catch (err) {
      console.warn(err)
    }
  }

  return (
    <audioContext.Provider value={{ctx}}>
      {props.children}
    </audioContext.Provider>
  );
}

export function useAudio() {
  return useContext(audioContext)!;
}


export function createGain(context: globalThis.AudioContext) {

  const gain = context.createGain();
  gain.connect(context.destination);

  return gain
}
export function playTone(context: globalThis.AudioContext, gain: GainNode, freq: number, duration = 500, type: OscillatorType = "sine") {

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
