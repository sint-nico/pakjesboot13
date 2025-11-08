import packageJson from "../package.json" assert { type: "json" }

export function errorRedirect(reason: string) {
    alert(reason);
    if (import.meta.env.DEV) debugger;
    console.warn('Unwanted state detected', reason)
    location.replace(import.meta.env.DEV 
        ? new URL(import.meta.env.BASE_URL, window.location.origin).href 
        : packageJson.homepage
    );
}