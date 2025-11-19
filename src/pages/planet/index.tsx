import { useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import PlanetCreateBox from "./boxes/planet-create-box";
import CanvasContext from "./contexts/canvas-context";
import SpaceContext from "./contexts/space-context";
import type Planet from "./models/planet";
import type Point from "./models/point";
import { PlanetStore } from "./store/planet-store";
import { SimpleOrbitAccelerator } from "./utils/orbits/orbit-accelerator";
import OrbitEngine from "./utils/orbits/orbit-engine";
import { SimpleOrbitProcessor } from "./utils/orbits/orbit-processor";
import { SimpleOrbitResetter } from "./utils/orbits/orbit-resetter";
import type OrbitValidator from "./utils/orbits/orbit-validator";
import { PositionOrbitValidator } from "./utils/orbits/orbit-validator";
import { PointFactory } from "./utils/point-factory.utils";

export default function PlanetPage() {
    const canvasContext = useContext(CanvasContext);
    const spaceContext = useContext(SpaceContext);
    const initialPlanets = useSyncExternalStore(PlanetStore.subscribe, PlanetStore.getSnapshot);
    const orbitValidator: OrbitValidator = useMemo(
        () =>
            new PositionOrbitValidator(
                PointFactory.create(canvasContext.width * 2, canvasContext.height * 2, 0),
                PointFactory.create(canvasContext.width * -1, canvasContext.height * -1, 0)
            ),
        [canvasContext.height, canvasContext.width]
    );
    const orbitEngine: OrbitEngine = useMemo(() => {
        const orbitAccelerator = new SimpleOrbitAccelerator(spaceContext.gravity);
        const orbitProcessor = new SimpleOrbitProcessor(spaceContext.tick);
        const orbitResetter = new SimpleOrbitResetter(orbitValidator, initialPlanets);
        return new OrbitEngine(orbitAccelerator, orbitProcessor, orbitResetter);
    }, [initialPlanets, orbitValidator, spaceContext.gravity, spaceContext.tick]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(null);
    const lastUpdateTimeRef = useRef(0);
    const updateInterval = useRef(30);

    const [planets, setPlanets] = useState<Planet[]>(initialPlanets);
    const planetsRef = useRef(planets);
    const [trajectories, setTrajectories] = useState<{ id: number; points: Point[] }[]>(
        initialPlanets.map((p) => ({ id: p.id, points: [] }))
    );

    const drawPlanets = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasContext.width, canvasContext.height);
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, canvasContext.width, canvasContext.height);

        trajectories.forEach((t) => {
            const planet = planets.find((p) => p.id === t.id);
            if (!planet || t.points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 2;

            const firstPoint: Point = t.points[0];
            ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < t.points.length; i++) {
                if (
                    Math.abs(t.points[i].x - t.points[i - 1].x) > 100 ||
                    Math.abs(t.points[i].y - t.points[i - 1].y) > 100
                ) {
                    ctx.moveTo(t.points[i].x, t.points[i].y);
                }
                const point: Point = t.points[i];
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        });

        const sortedPlanets = [...planets].sort((p1, p2) => p1.position.z - p2.position.z);
        sortedPlanets.forEach((planet) => {
            ctx.beginPath();

            ctx.arc(
                planet.position.x,
                planet.position.y,
                Math.max((planet.radius * (planet.position.z + 100)) / 100, 2),
                0,
                2 * Math.PI
            );
            ctx.fillStyle = "lightgray";
            ctx.fill();
        });
    }, [canvasContext.height, canvasContext.width, planets, trajectories]);

    useEffect(() => {
        drawPlanets();
    }, [drawPlanets]);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (timestamp >= lastUpdateTimeRef.current + updateInterval.current) {
                const nextPlanets: Planet[] = orbitEngine.createNextPlanets(planetsRef.current);
                setTrajectories((prev) => {
                    const newTrajectories = prev.map((t) => {
                        const planet: Planet | undefined = nextPlanets.find((p) => p.id === t.id);
                        if (planet) {
                            if (!orbitValidator.validate(planet)) {
                                return { id: t.id, points: [] };
                            }
                            const newPoints = [...t.points, PointFactory.copy(planet.position)];
                            if (newPoints.length > 300) {
                                newPoints.shift();
                            }
                            return { id: t.id, points: newPoints };
                        }
                        return { id: t.id, points: [] };
                    });
                    return newTrajectories;
                });
                lastUpdateTimeRef.current = timestamp;
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [initialPlanets, orbitEngine, orbitValidator]);

    return (
        <div>
            <canvas ref={canvasRef} width={canvasContext.width} height={canvasContext.height} />
            <PlanetCreateBox
                position={{ x: 500, y: 500, z: 0 }}
                onCreate={(planet: Planet) => {
                    setPlanets((prev) => [...prev, planet]);
                    setTrajectories((prev) => [...prev, { id: planet.id, points: [] }]);
                }}
            />
        </div>
    );
}
