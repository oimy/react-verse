import type Point from "./point";

export default interface Trajectory {
    id: number;
    points: Point[];
}
