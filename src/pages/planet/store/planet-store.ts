import type Planet from "../models/planet";

type Listener = () => void;
const KEY = "planets";
const listeners = new Set<Listener>();

let cachePlanetsString = "[]";
let cachePlanets: Planet[] = [];

function getSnapshot(): Planet[] {
    const loadedPlanetsString: string | null = localStorage.getItem(KEY);
    if (loadedPlanetsString && cachePlanetsString !== loadedPlanetsString) {
        cachePlanetsString = loadedPlanetsString;
        cachePlanets = JSON.parse(loadedPlanetsString);
    }
    return cachePlanets;
}

function subscribe(callback: Listener): () => void {
    function onStorage(e: StorageEvent) {
        if (e.key === KEY) callback();
    }
    window.addEventListener("storage", onStorage);
    listeners.add(callback);

    return () => {
        window.removeEventListener("storage", onStorage);
        listeners.delete(callback);
    };
}

export async function savePlanet(planet: Planet): Promise<Planet[]> {
    await new Promise((res) => setTimeout(res, 1000));
    cachePlanets.push(planet);
    cachePlanetsString = JSON.stringify(cachePlanets);
    localStorage.setItem(KEY, cachePlanetsString);
    listeners.forEach((callback) => callback());
    return cachePlanets;
}

export const PlanetStore = {
    subscribe,
    getSnapshot,
};
