import type Planet from "../../models/planet";
import type Point from "../../models/point";

export interface OrbitProcessor {
    process(planets: Planet[], accelerations: Point[]): void;
}

export class SimpleOrbitProcessor implements OrbitProcessor {
    tick: number;

    constructor(tick: number) {
        this.tick = tick;
    }
    process(planets: Planet[], accelerations: Point[]): void {
        if (planets.length !== accelerations.length) {
            throw Error("planets and accelerations lengths are not equal");
        }

        for (let i = 0; i < planets.length; i++) {
            planets[i].velocity.x += accelerations[i].x * this.tick;
            planets[i].velocity.y += accelerations[i].y * this.tick;
            planets[i].velocity.z += accelerations[i].z * this.tick;

            planets[i].position.x += planets[i].velocity.x * this.tick;
            planets[i].position.y += planets[i].velocity.y * this.tick;
            planets[i].position.z += planets[i].velocity.z * this.tick;
        }
    }
}
