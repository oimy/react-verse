import type Planet from "../../models/planet";
import type Point from "../../models/point";

export default interface OrbitValidator {
    validate(planet: Planet): boolean;
}

export class PositionOrbitValidator implements OrbitValidator {
    upperPosition: Point;
    lowerPosition: Point;

    constructor(upperPosition: Point, lowerPosition: Point) {
        this.upperPosition = upperPosition;
        this.lowerPosition = lowerPosition;
    }

    validate(planet: Planet): boolean {
        return !(
            this.upperPosition.x < planet.position.x ||
            planet.position.x < this.lowerPosition.x ||
            this.upperPosition.y < planet.position.y ||
            planet.position.y < this.lowerPosition.y
        );
    }
}
