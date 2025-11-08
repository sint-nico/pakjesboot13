import { Accessor, createContext, createSignal, onCleanup, onMount, ParentProps, useContext } from "solid-js";

export type Coordinates = Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'accuracy' | 'altitude' | 'toJSON'>
type AccessState = 'idle' | 'requesting' | 'allowed' | 'denied' | 'unsupported';
export type LocationContext = {
    location: Accessor<Coordinates>
    requestAccess(): void;
    access: Accessor<AccessState>
}

const permissionEvent = (ev: Event) => ev as Event & { currentTarget: PermissionStatus } 

function getLocationPermissions() {
  if (!navigator.permissions) return Promise.resolve(undefined)
  return navigator.permissions.query({ name: 'geolocation' });
}

const locationContext = createContext<LocationContext>({
  access: () => "geolocation" in navigator
      ? 'idle'
      : 'unsupported' as AccessState,
  location: () => ({ latitude: 0, longitude: 0, accuracy: -1, altitude: 0, toJSON() {
    return 'NO_DATA'
  }, } as Coordinates),
  requestAccess(): void { throw new Error('Context not initialized') }
})

export function LocationProvider(props: ParentProps) {
  let watchId: number | undefined = undefined;
  const abortController = new AbortController();

  const [location, setLocation] = createSignal(locationContext.defaultValue.location());
  const [access, setAccess] = createSignal<AccessState>(locationContext.defaultValue.access());
  const [listeningRequested, setListeningRequested] = createSignal(false);

  function startListening() {
    try {
      watchId = navigator.geolocation.watchPosition((pos) => {
        if (abortController.signal.aborted) return;
        const { accuracy, altitude, latitude, longitude } = pos.coords
        setAccess('allowed');
        const coords = { accuracy, altitude, latitude, longitude }
        setLocation({ ...coords, toJSON() {
          return access() !== 'allowed' 
            ? locationContext.defaultValue.location().toJSON() 
            : JSON.stringify(coords, undefined, 2)
        } });
      }, async (err) => {
        if (err.code === err.POSITION_UNAVAILABLE) return setAccess('unsupported')
        if (err.code === err.TIMEOUT) return;
        if (err.code === err.PERMISSION_DENIED) {
          const permissions = await getLocationPermissions()
          return setAccess(permissions?.state === 'prompt'
            ? 'idle' : 'denied')
        }
      }, { enableHighAccuracy: true })
    }
    catch(err) {
      console.error('An unhandled error occurred while requesting location data', err)
      setAccess('idle');
    }

    abortController.signal.addEventListener('abort', () => stopListening(), { once: true })
  }

  function stopListening() {
      if (!watchId) return;
      navigator.geolocation.clearWatch(watchId);
      watchId = undefined;
  }

  onCleanup(() => abortController.abort('cleanup'));
  onMount(async () => {
    if (locationContext.defaultValue.access() === 'unsupported') return;

    const permissions = await getLocationPermissions()
    if (permissions === undefined) return;

    function setPermissions(state: PermissionState, initial: boolean = false) {
      switch(state) {
        case "denied": {
          if (!initial) stopListening();
          return setAccess('denied')
        }
        case "granted": {
          if (!initial) startListening();
          return setAccess(listeningRequested() ? 'allowed' : 'idle')
        }
        case "prompt": {
          if (!initial) stopListening();
          return setAccess('idle')
        }
      }
    }

    setPermissions(permissions.state, true);

    permissions.addEventListener(
      'change',
      (ev) => {
        if (access() === "denied" && permissionEvent(ev).currentTarget.state !== 'denied') 
          return setPermissions('prompt')

        if (!listeningRequested()) return;

        setPermissions(permissionEvent(ev).currentTarget.state)
      },
      { signal: abortController.signal }
    )
  })
 
  function requestAccess() {
    setListeningRequested(true)
    if (!!watchId) return;
    setAccess('requesting');
    startListening();
  }

  return (
    <locationContext.Provider value={{
      location,
      requestAccess,
      access
    }}>
      {props.children}
    </locationContext.Provider>
  );
}

export function useLocation() { return useContext(locationContext); }