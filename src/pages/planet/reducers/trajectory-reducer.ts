import type Planet from "../models/planet";
import type Trajectory from "../models/trajectory";
import type OrbitValidator from "../utils/orbits/orbit-validator";
import { PointFactory } from "../utils/point-factory.utils";

type TrajectoryAction =
    | { type: "add"; planet: Planet }
    | { type: "move"; planets: Planet[]; orbitValidator: OrbitValidator };

const trajectoryReducer = (trajectories: Trajectory[], action: TrajectoryAction) => {
    switch (action.type) {
        case "add":
            return [...trajectories, { id: action.planet.id, points: [] }];
        case "move": {
            const movedTrajectories: Trajectory[] = trajectories.map((trajectory) => {
                const planet: Planet | undefined = action.planets.find((planet) => planet.id === trajectory.id);
                if (!planet) {
                    return { id: trajectory.id, points: [] };
                }
                if (!action.orbitValidator.validate(planet)) {
                    return { id: trajectory.id, points: [] };
                }
                const movedPoints = [...trajectory.points, PointFactory.copy(planet.position)];
                if (movedPoints.length > 300) {
                    movedPoints.shift();
                }
                return { id: trajectory.id, points: movedPoints };
            });
            return movedTrajectories;
        }
        default:
            return trajectories;
    }
};

export default trajectoryReducer;
