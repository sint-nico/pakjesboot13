
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ekimpvoesisnllcrwvwn.supabase.co'
const supabaseKey = import.meta.env["VITE_API_KEY"]

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getLocationsList() {
    const list = import.meta.env["VITE_LISTNAME"];

    const { data, error } = await supabase
        .from('coordinates')
        .select('*')
        .eq('group', list)

        if (error) {
            console.error(error)
            return [];
        }

    return (data! as Location[])
        .map(loc => ({ ...loc, ...fromGoogle(loc.coords) }) )
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