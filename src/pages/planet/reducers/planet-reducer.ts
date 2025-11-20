import type Planet from "../models/planet";

export type PlanetAction =
    | { type: "add"; planet: Planet }
    | { type: "remove"; id: number }
    | { type: "reset"; planets: Planet[] };

const planetReducer = (state: Planet[], action: PlanetAction): Planet[] => {
    switch (action.type) {
        case "add":
            return [...state, action.planet];
        case "remove":
            return state.filter((p) => p.id !== action.id);
        case "reset":
            return action.planets;
        default:
            return state;
    }
};

export default planetReducer;
