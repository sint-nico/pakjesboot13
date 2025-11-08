import packageJson from "../package.json" assert { type: "json" }

export function errorRedirect() {
    location.replace(import.meta.env.DEV 
        ? new URL(import.meta.env.BASE_URL, window.location.origin).href 
        : packageJson.homepage
    );
}