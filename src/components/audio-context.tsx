import { Accessor, createContext, createSignal, onCleanup, onMount, ParentProps, useContext } from "solid-js";

export type AudioContext = {
  ctx: Accessor<globalThis.AudioContext | undefined>
  osc: Accessor<Record<OscillatorType, OscillatorNode> | undefined>
  playTone(frequency: number, duration: number, type: OscillatorType): Promise<void>
}
const audioContext = createContext<AudioContext>({
  ctx: () => undefined,
  osc: () => undefined,
  playTone: () => Promise.resolve()
})
type OscillatorType = Exclude<OscillatorNode['type'], 'custom'>;
export function AudioProvider(props: ParentProps) {
  const abortController = new AbortController();
  const [ctx, setCtx] = createSignal<globalThis.AudioContext>();
  const [osc, setOsc] = createSignal<Record<OscillatorType, OscillatorNode>>();

  onCleanup(() => abortController.abort('cleanup'));
  onMount(() => {
    window.addEventListener('touchstart', tryGetContext, { signal: abortController.signal });
    window.addEventListener('click', tryGetContext, { signal: abortController.signal });
    window.addEventListener('scroll', tryGetContext, { signal: abortController.signal });
    tryGetContext();
  })

  async function playTone(frequency: number, duration: number, type: OscillatorType) {
    const context = ctx();
    const oscillator = osc()?.[type];
    if (!context || !oscillator) return;

    const gain = context.createGain();

    // connect oscillator → gain → destination
    oscillator.connect(gain);
    gain.connect(context.destination);

    // set frequency
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);

    // envelope
    const now = context.currentTime;

    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);

    // cleanup
    setTimeout(() => {
      oscillator.disconnect(gain);
      gain.disconnect();
    }, duration);

    return new Promise<void>(resolve =>
      setTimeout(resolve, duration)
    );
  }

  function tryGetContext() {
    if (ctx()) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) return;
      audioCtx.addEventListener('statechange', () => {
        if (audioCtx.state !== 'running') return
        setCtx(audioCtx);
        const oscNode = setOsc(() => ({
          sine: audioCtx.createOscillator(),
          square: audioCtx.createOscillator(),
          sawtooth: audioCtx.createOscillator(),
          triangle: audioCtx.createOscillator()
        }));
        oscNode.sine.start()
        oscNode.sine.type = 'sine'
        oscNode.square.start()
        oscNode.square.type = 'square'
        oscNode.sawtooth.start()
        oscNode.sawtooth.type = 'sawtooth'
        oscNode.triangle.start()
        oscNode.triangle.type = 'triangle'
        console.log('ctx set', audioCtx, oscNode)
        abortController.signal.addEventListener('abort', () => {
          if (!ctx()) return;
          if (ctx()!.state === 'closed') return;
          ctx()!.close()
        }, { once: true });
        abortController.signal.addEventListener('abort', () => {
          if (!osc()) return;
          Object.values(osc()!).forEach(n => n.stop())
        }, { once: true });
        
        // Play a low note to load everything
		    playTone(20, 200, 'triangle');
      }, { signal: abortController.signal })
    } catch (err) {
      console.warn(err)
    }
  }

  return (
    <audioContext.Provider value={{ ctx, osc, playTone }}>
      {props.children}
    </audioContext.Provider>
  );
}

export function useAudio() {
  return useContext(audioContext)!;
}