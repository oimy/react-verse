import type Planet from "../../models/planet";
import type Point from "../../models/point";
import { PointFactory } from "../point-factory.utils";

export interface OrbitAccelerator {
    accelerate(planets: Planet[]): Point[];
}

export class SimpleOrbitAccelerator implements OrbitAccelerator {
    gravity: number;

    constructor(gravity: number) {
        this.gravity = gravity;
    }

    accelerate(planets: Planet[]): Point[] {
        const accelerations: Point[] = Array.from<Point>({ length: planets.length }).map(() => PointFactory.zero());

        for (let i = 0; i < planets.length; i++) {
            const targetPlanet = planets[i];
            for (let j = 0; j < planets.length; j++) {
                if (i === j) continue;

                const comparedPlanet = planets[j];

                const dx = comparedPlanet.position.x - targetPlanet.position.x;
                const dy = comparedPlanet.position.y - targetPlanet.position.y;
                const dz = comparedPlanet.position.z - targetPlanet.position.z;

                const distanceSquare = dx * dx + dy * dy + dz * dz;
                const distance = Math.sqrt(distanceSquare);

                if (distance > targetPlanet.radius + comparedPlanet.radius) {
                    const accelerationMagnitude = (this.gravity * comparedPlanet.mass) / distanceSquare;

                    accelerations[i].x += accelerationMagnitude * (dx / distance);
                    accelerations[i].y += accelerationMagnitude * (dy / distance);
                    accelerations[i].z += accelerationMagnitude * (dz / distance);
                }
            }
        }

        return accelerations;
    }
}
