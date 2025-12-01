import { children, Component, createContext, createSignal, onCleanup, ParentComponent, Setter, useContext } from "solid-js";

const LOG_WAKE_LOCK_ISSUES = false;
const LOG_FULL_SCREEN_ISSUES = false;

export type FsState = 'full' | 'normal' | 'inert'
export type FullScreenContext = {
	set: Setter<FsState>
}

const fullScreenContext = createContext<FullScreenContext>({
	set: () => {}
})

export const FullScreenProvider: ParentComponent = (props) => {

	const themeElement = () => document.getElementById('android-theme-color') as HTMLMetaElement;
	const [theme, setTheme] = createSignal(themeElement()?.content)

	const [get, set] = createSignal<FsState>('normal');

    async function fsAction() {
        if (import.meta.env.DEV) return;
		if (get() === 'inert') {
			console.log('fullscreen inert')
			return;
		}
		if (!theme()) setTheme(themeElement()!.content)
        if (get() === 'normal') {
            if (!document.fullscreenElement) return;
			if(theme()) document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content = theme()!;
            await document.exitFullscreen?.().catch(LOG_FULL_SCREEN_ISSUES ? console.debug : () => { });
            console.debug('fullscreen disabled')
        } else {
            if (!!document.fullscreenElement) return;
				themeElement().content = "#000"
			await document.documentElement.requestFullscreen({
				navigationUI: 'hide'
			}).catch((e) => {
				if (LOG_FULL_SCREEN_ISSUES) console.debug(e)
				if(theme()) themeElement().content = theme()
			})
            console.debug('fullscreen enabled')
        }
    }
    
	const ii = setInterval(fsAction, 300);

	onCleanup(async () => {
		clearInterval(ii);
	});

	return <fullScreenContext.Provider value={{ set }}>
		{children(() => props.children)()}
	</fullScreenContext.Provider>
}

export function useFullScreen() { return useContext(fullScreenContext); };

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