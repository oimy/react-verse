import type Planet from "../models/planet";
import type Point from "../models/point";
import { PointFactory } from "./point-factory.utils";

export class PlanetFactory {
    static create(id: number, name: string, mass: number, radius: number, position: Point, velocity: Point): Planet {
        return {
            id,
            name,
            mass,
            radius,
            position,
            velocity,
        };
    }

    static createMany(mass: number, radius: number, positions: Point[], velocities: Point[]): Planet[] {
        if (positions.length !== velocities.length) {
            throw Error("positions and velocities lengths are not equal");
        }

        const planets: Planet[] = [];
        for (let id = 0; id < positions.length; id++) {
            const planet = this.create(id, `P${id}`, mass, radius, positions[id], velocities[id]);
            planets.push(planet);
        }

        return planets;
    }

    static copy(planet: Planet): Planet {
        return {
            ...planet,
            position: PointFactory.copy(planet.position),
            velocity: PointFactory.copy(planet.velocity),
        };
    }

    static copyAll(planets: Planet[]): Planet[] {
        return planets.map(this.copy);
    }
}
