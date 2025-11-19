import type Planet from "../../models/planet";
import type Point from "../../models/point";
import type { OrbitAccelerator } from "./orbit-accelerator";
import type { OrbitProcessor } from "./orbit-processor";
import type OrbitResetter from "./orbit-resetter";

export default class OrbitEngine {
    accelerator: OrbitAccelerator;
    processor: OrbitProcessor;
    resetter: OrbitResetter;

    constructor(accelerator: OrbitAccelerator, processor: OrbitProcessor, resetter: OrbitResetter) {
        this.accelerator = accelerator;
        this.processor = processor;
        this.resetter = resetter;
    }

    createNextPlanets(planets: Planet[]): Planet[] {
        const nextPlanets: Planet[] = Array.from(planets);
        const accelerations: Point[] = this.accelerator.accelerate(nextPlanets);
        this.processor.process(nextPlanets, accelerations);
        this.resetter.reset(nextPlanets);

        return nextPlanets;
    }
}
