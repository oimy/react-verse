import type Point from "./point";

export interface PlanetStyle {
    color: string;
}

export default interface Planet {
    id: number;
    name: string;
    mass: number;
    radius: number;
    style?: PlanetStyle;
    position: Point;
    velocity: Point;
}
