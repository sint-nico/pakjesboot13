
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ekimpvoesisnllcrwvwn.supabase.co'
const supabaseKey = import.meta.env["VITE_API_KEY"]

export const supabase = createClient(supabaseUrl, supabaseKey)

const BUILD_NUMBER: number = import.meta.env.VITE_BUILD_DATE;
const LIST_GROUP = import.meta.env["VITE_LISTNAME"];
const CACHE_KEY = `coodinates-${LIST_GROUP}`;

type LocationCache = undefined | {
    [BUILD_NUMBER]: Location[] | undefined
}

export async function getLocationsList() {

    const cacheRecord = localStorage.getItem(CACHE_KEY);
    const cachedValue = cacheRecord ? JSON.parse(cacheRecord) as LocationCache : undefined
    if (cachedValue?.[BUILD_NUMBER]) {
        return cachedValue[BUILD_NUMBER]!
    }

    const { data, error } = await supabase
        .from('coordinates')
        .select('*')
        .eq('group', LIST_GROUP)

    if (error) {
        console.error(error)
        localStorage.removeItem(CACHE_KEY)
        return [];
    }

    const result = (data! as Location[])
        .map(loc => ({ ...loc, ...fromGoogle(loc.coords) }))

    localStorage.setItem(CACHE_KEY, JSON.stringify({
        [BUILD_NUMBER]: result
    } as LocationCache))

    return result;
}

export type Location = {
    name: string,
    imageUrl: string,
    coords: string,
    lat: number,
    lng: number,
    final: boolean,
    game: string | undefined
}

function fromGoogle(url: string) {
    const [lat, lng] = url
        .split('/')
        .find(part => part.includes('@'))!
        .replace('@', '')
        .split(',')

    return { lat: +lat, lng: +lng }
}

export function resetCache() {
    localStorage.removeItem(CACHE_KEY)
}

if (import.meta.env.DEV) {
    (window as any).resetCache = resetCache
}