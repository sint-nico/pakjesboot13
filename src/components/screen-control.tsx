import { Component, onCleanup, onMount, Setter } from "solid-js";

const LOG_WAKE_LOCK_ISSUES = false;
const LOG_FULL_SCREEN_ISSUES = false;

export type FullScreenStateProps = {
    mode: 'full' | 'normal'
}

export const FullScreenState: Component<FullScreenStateProps> = ({ mode }) => {

    async function fsAction() {
        if (!import.meta.env.PROD) return;
        if (mode === 'normal') {
            if (!document.fullscreenElement) return;
            await document.exitFullscreen?.().catch(LOG_FULL_SCREEN_ISSUES ? console.debug : () => { });
            console.debug('fullscreen disabled')
        } else {
            if (!!document.fullscreenElement) return;
			await document.body.requestFullscreen({
				navigationUI: 'hide'
			}).catch(console.debug)
            console.debug('fullscreen enabled')
        }
    }
    
	const ii = setInterval(fsAction, 300);

	onCleanup(async () => {
		clearInterval(ii);
	});
}
export const WakeLock: Component = () => {
    
	let wakeLock: WakeLockSentinel | undefined | void = undefined;
	const ii = setInterval(async () => {
		if (!wakeLock) {
			wakeLock = await navigator.wakeLock.request("screen").catch(LOG_WAKE_LOCK_ISSUES ? console.debug : () => { });
			console.debug('wakelock enabled')
		}
	}, 300);

	onCleanup(async () => {
		clearInterval(ii);
		if (wakeLock) await wakeLock.release().catch(LOG_WAKE_LOCK_ISSUES ? console.debug : () => { })
		wakeLock = undefined;
		console.debug('wakelock disabled')
    });

    return undefined
}