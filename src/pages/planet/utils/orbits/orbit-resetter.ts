import type Planet from "../../models/planet";
import { PointFactory } from "../point-factory.utils";
import type OrbitValidator from "./orbit-validator";

export default interface OrbitResetter {
    reset(planets: Planet[]): void;
}

export class SimpleOrbitResetter implements OrbitResetter {
    validator: OrbitValidator;
    originalPlanets: Planet[];

    constructor(validator: OrbitValidator, originalPlanets: Planet[]) {
        this.validator = validator;
        this.originalPlanets = originalPlanets;
    }

    private resetOne(planet: Planet): void {
        if (this.validator.validate(planet)) return;

        const originalPlanet: Planet | undefined = this.originalPlanets.find(
            (originalPlanet) => planet.id === originalPlanet.id
        );
        if (!originalPlanet) return;

        planet.position = PointFactory.copy(originalPlanet.position);
    }

    reset(planets: Planet[]) {
        for (let i = 0; i < planets.length; i++) {
            this.resetOne(planets[i]);
        }
    }
}
