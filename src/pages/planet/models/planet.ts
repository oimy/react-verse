import type Point from "./point";

export default interface Planet {
    id: number;
    name: string;
    mass: number;
    radius: number;
    position: Point;
    velocity: Point;
}
