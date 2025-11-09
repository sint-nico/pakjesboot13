import { Component, createEffect, onCleanup, onMount } from "solid-js";
import Map from '../components/map';
import { getLocationsFromCache } from "../supabase";
import { useLocation } from "../components/location-context";
import { errorRedirect } from "../helpers";
import { FullScreenState, WakeLock } from "../components/screen-control";

export const Scanner: Component = () => {

	// TODO: mini-games

	const locationContext = useLocation();

	onMount(() => {
		if (locationContext.access() === "idle") {
			locationContext.requestAccess();
			createEffect(() => {
				if (locationContext.access() === "requesting") return;
				if (locationContext.access() === "idle") return;
				if (locationContext.access() !== "allowed") return errorRedirect(`location: ${locationContext.access()}`);
			}, [locationContext.access])
			return;
		}
		if (locationContext.access() !== "allowed") return errorRedirect(`location: ${locationContext.access()}`);
	})

	const locations = getLocationsFromCache();
	if (!locations) errorRedirect('no markers loaded');

	return <>
		<h2>Game</h2>
		<Map locations={locations!} />
		<WakeLock />
		<FullScreenState mode="full" />
	</>
}
