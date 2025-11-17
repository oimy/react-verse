import type Planet from "./models/planet";
import type Point from "./models/point";
import { PointFactory } from "./point-factory.utils";

export default class OrbitEngine {
    gravity: number;
    tick: number;

    constructor(gravity: number, tick: number) {
        this.gravity = gravity;
        this.tick = tick;
    }

    createNextPlanets(planets: Planet[]): Planet[] {
        const newPlanets = Array.from(planets);
        const accelerations: Point[] = Array.from<Point>({ length: newPlanets.length }).map(() => PointFactory.zero());

        for (let i = 0; i < newPlanets.length; i++) {
            for (let j = 0; j < newPlanets.length; j++) {
                if (i === j) {
                    continue;
                }

                const p1 = newPlanets[i];
                const p2 = newPlanets[j];

                const dx = p2.position.x - p1.position.x;
                const dy = p2.position.y - p1.position.y;
                const dz = p2.position.z - p1.position.z;

                const distanceSquare = dx * dx + dy * dy + dz * dz;
                const distance = Math.sqrt(distanceSquare);

                if (distance > p1.radius + p2.radius) {
                    const accelerationMagnitude = (this.gravity * p2.mass) / distanceSquare;

                    accelerations[i].x += accelerationMagnitude * (dx / distance);
                    accelerations[i].y += accelerationMagnitude * (dy / distance);
                    accelerations[i].z += accelerationMagnitude * (dz / distance);
                }
            }
        }

        for (let i = 0; i < newPlanets.length; i++) {
            newPlanets[i].velocity.x += accelerations[i].x * this.tick;
            newPlanets[i].velocity.y += accelerations[i].y * this.tick;
            newPlanets[i].velocity.z += accelerations[i].z * this.tick;

            newPlanets[i].position.x += newPlanets[i].velocity.x * this.tick;
            newPlanets[i].position.y += newPlanets[i].velocity.y * this.tick;
            newPlanets[i].position.z += newPlanets[i].velocity.z * this.tick;
        }

        return newPlanets;
    }
}
