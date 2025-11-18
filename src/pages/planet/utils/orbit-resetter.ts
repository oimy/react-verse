import type Planet from "../models/planet";
import type Point from "../models/point";
import { PointFactory } from "./point-factory.utils";

export default interface OrbitResetter {
    reset(targetPlanet: Planet, originalPlanet: Planet): void;
    resetMany(targetPlanets: Planet[], originalPlanets: Planet[]): void;
    check(planet: Planet): boolean;
}

export class BoundPositionOrbitResetter implements OrbitResetter {
    upper: Point;
    lower: Point;

    constructor(upper: Point, lower: Point) {
        this.upper = upper;
        this.lower = lower;
    }

    check(planet: Planet): boolean {
        return (
            this.upper.x < planet.position.x ||
            planet.position.x < this.lower.x ||
            this.upper.y < planet.position.y ||
            planet.position.y < this.lower.y
        );
    }

    reset(targetPlanet: Planet, originalPlanet: Planet): void {
        if (this.check(targetPlanet)) {
            targetPlanet.position = PointFactory.copy(originalPlanet.position);
        }
    }

    resetMany(targetPlanets: Planet[], originalPlanets: Planet[]) {
        for (let i = 0; i < targetPlanets.length; i++) {
            if (!this.check(targetPlanets[i])) {
                continue;
            }
            const foundPlanets = originalPlanets.filter((planet) => planet.id === targetPlanets[i].id);
            if (foundPlanets.length == 0) {
                continue;
            }
            targetPlanets[i].position = PointFactory.copy(foundPlanets[0].position);
            targetPlanets[i].velocity = PointFactory.copy(foundPlanets[0].velocity);
        }
    }
}
