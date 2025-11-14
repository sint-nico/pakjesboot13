import { Component, createEffect, createRenderEffect, createSignal, onMount } from "solid-js";

export const ScrollHere: Component = () => {

    const [ref, setRef] = createSignal<HTMLAnchorElement>();

    onMount(() => {
        ref()?.scrollIntoView({
            behavior: 'smooth'
        })
    })
    createEffect(() => {
        ref()?.scrollIntoView({
            behavior: 'smooth'
        })
    }, [ref])

    return <a ref={setRef} />
}