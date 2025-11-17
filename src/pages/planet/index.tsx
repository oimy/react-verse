import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import CanvasContext from "./contexts/canvas-context";
import PlanetContext from "./contexts/planet-context";
import SpaceContext from "./contexts/space-context";
import type Planet from "./utils/models/planet";
import type Point from "./utils/models/point";
import OrbitEngine from "./utils/orbit-engine";
import { BoundPositionOrbitResetter } from "./utils/orbit-resetter";
import { PlanetFactory } from "./utils/planet-factory.utils";
import { PlanetPositionFactory, PlanetVelocityFactory, PointFactory } from "./utils/point-factory.utils";

const N = 100;

export default function PlanetPage() {
    const planetContext = useContext(PlanetContext);
    const canvasContext = useContext(CanvasContext);
    const spaceContext = useContext(SpaceContext);
    const initialPlanets = PlanetFactory.createMany(
        planetContext.baseMass,
        planetContext.baseRadius,
        PlanetPositionFactory.withBound(
            { x: canvasContext.width, y: canvasContext.height, z: 0 },
            PointFactory.zero()
        ).randomMany(N),
        PlanetVelocityFactory.withVelocity(0.05).randomMany(N)
    ).concat([
        PlanetFactory.create(
            99,
            "MASS",
            100000,
            50,
            { x: canvasContext.width / 2, y: canvasContext.height / 2, z: 0 },
            PointFactory.zero()
        ),
        PlanetFactory.create(
            999,
            "MASS",
            100000,
            20,
            { x: canvasContext.width / 3, y: canvasContext.height / 4, z: 0 },
            PointFactory.zero()
        ),
        PlanetFactory.create(
            9999,
            "MASS",
            100000,
            20,
            { x: canvasContext.width / 4, y: canvasContext.height / 3, z: 0 },
            PointFactory.zero()
        ),
    ]);
    const orbitEngine = useMemo(
        () => new OrbitEngine(spaceContext.gravity, spaceContext.tick),
        [spaceContext.gravity, spaceContext.tick]
    );
    const orbitResetter = useMemo(
        () =>
            new BoundPositionOrbitResetter(
                PointFactory.create(canvasContext.width, canvasContext.height, 0),
                PointFactory.zero()
                // PointFactory.create(canvasContext.width * -1, canvasContext.height * -1, 0)
            ),
        [canvasContext.height, canvasContext.width]
    );
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(null);
    const lastUpdateTimeRef = useRef(0);
    const updateInterval = 30;

    const [planets, setPlanets] = useState<Planet[]>(initialPlanets);
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

            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            // const textYOffset = planet.position.y + planet.radius - 15;
            // ctx.fillText(planet.name, planet.position.x, textYOffset);
        });
    }, [canvasContext.height, canvasContext.width, planets, trajectories]);

    useEffect(() => {
        if (!planets) {
            return;
        }
        drawPlanets();
    }, [drawPlanets, planets]);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (timestamp >= lastUpdateTimeRef.current + updateInterval) {
                const nextPlanets: Planet[] = orbitEngine.createNextPlanets(planets);
                orbitResetter.resetMany(nextPlanets, initialPlanets);
                setTrajectories((prev) => {
                    const newTrajectories = prev.map((t) => {
                        const planet: Planet | undefined = planets.find((p) => p.id === t.id);
                        if (planet) {
                            if (orbitResetter.check(planet)) {
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
                setPlanets(nextPlanets);
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
    }, [initialPlanets, orbitEngine, planets, orbitResetter]);

    return (
        <div>
            <canvas ref={canvasRef} width={canvasContext.width} height={canvasContext.height} />
            {/* <table>
                <tbody>
                    {planets.map((planet) => (
                        <tr>
                            <td>{planet.name}</td>
                            <td>{planet.position.x.toLocaleString()}</td>
                            <td>{planet.position.y.toLocaleString()}</td>
                            <td>{planet.position.z.toLocaleString()}</td>
                            <td>{planet.velocity.x.toLocaleString()}</td>
                            <td>{planet.velocity.y.toLocaleString()}</td>
                            <td>{planet.velocity.z.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table> */}
        </div>
    );
}
