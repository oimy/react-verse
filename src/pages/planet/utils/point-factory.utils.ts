import type Point from "../models/point";

export class PointFactory {
    static zero(): Point {
        return {
            x: 0,
            y: 0,
            z: 0,
        };
    }

    static create(x: number, y: number, z: number): Point {
        return { x, y, z };
    }

    static copy(point: Point) {
        return { x: point.x, y: point.y, z: point.z };
    }
}

export class PlanetPositionFactory {
    upper: Point;
    lower: Point;

    private constructor(upper: Point, lower: Point) {
        this.upper = upper;
        this.lower = lower;
    }

    static withBound(upper: Point, lower: Point): PlanetPositionFactory {
        if (upper.x < lower.x || upper.y < lower.y || upper.z < lower.z) {
            throw new Error("bound error");
        }
        return new PlanetPositionFactory(upper, lower);
    }

    random(): Point {
        return {
            x: Math.random() * (this.upper.x - this.lower.x) + this.lower.x,
            y: Math.random() * (this.upper.y - this.lower.y) + this.lower.y,
            z: Math.random() * (this.upper.z - this.lower.z) + this.lower.z,
        };
    }

    randomMany(count: number): Point[] {
        return Array.from({ length: count }, () => this.random());
    }

    randomByRadius(radius: number, scaleZ: number): Point {
        const angle = Math.random() * 2 * Math.PI;
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
            z: Math.random() * scaleZ,
        };
    }
}

export class PlanetVelocityFactory {
    velocity: number;

    constructor(baseVelocity: number) {
        this.velocity = baseVelocity;
    }

    static withVelocity(velocity: number): PlanetVelocityFactory {
        if (-100 > velocity || velocity > 100) {
            throw new Error("expect a safe velocity");
        }
        return new PlanetVelocityFactory(velocity);
    }

    random(): Point {
        const angle = Math.random() * 2 * Math.PI;
        return {
            x: -this.velocity * Math.sin(angle) * (1 + Math.random() * 0.1 - 0.05),
            y: this.velocity * Math.cos(angle) * (1 + Math.random() * 0.1 - 0.05),
            z: Math.random() * 0.05 - 0.025,
        };
    }

    randomMany(count: number): Point[] {
        return Array.from({ length: count }, () => this.random());
    }
}
