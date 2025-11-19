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

export function savePlanet(planet: Planet): void {
    cachePlanets.push(planet);
    cachePlanetsString = JSON.stringify(cachePlanets);
    localStorage.setItem(KEY, cachePlanetsString);
    listeners.forEach((callback) => callback());
}

export const PlanetStore = {
    subscribe,
    getSnapshot,
};
