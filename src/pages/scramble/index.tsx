import { useCallback, useEffect, useRef, useState } from "react";

const G = 0.000005;
const DT = 100;
const CANVAS_SIZE = 900;
const TRAIL_LENGTH = 150;
const NUM_PLANETS = 10;
const BASE_RADIUS = 200;

const createManyBodySystem = (num) => {
    const planets = [];
    const initialMass = 50;
    const planetRadius = 7;

    for (let i = 0; i < num; i++) {
        const angle = (i / num) * 2 * Math.PI;
        const distance = BASE_RADIUS + Math.random() * 100 - 25;

        const x = distance * Math.cos(angle);
        const y = distance * Math.sin(angle);

        const z = Math.random() * 50 - 25;

        const V_base = 0.05;
        const vx = -V_base * Math.sin(angle) * (1 + Math.random() * 0.1 - 0.05);
        const vy = V_base * Math.cos(angle) * (1 + Math.random() * 0.1 - 0.05);
        const vz = Math.random() * 0.05 - 0.025;

        planets.push({
            id: i,
            name: `P${i + 1}`,
            mass: initialMass + Math.random() * 20 - 10,
            radius: planetRadius,
            color: `hsl(${(i * 360) / num}, 80%, 60%)`,
            x,
            y,
            z,
            vx,
            vy,
            vz,
        });
    }

    planets.push({
        id: num,
        name: "mass",
        mass: 300000,
        radius: planetRadius,
        color: "orange",
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
    });
    return planets;
};

const initialPlanets = createManyBodySystem(NUM_PLANETS);

const calculateNextPositions = (currentPlanets) => {
    const newPlanets = currentPlanets.map((p) => ({ ...p, ax: 0, ay: 0, az: 0 }));

    for (let i = 0; i < newPlanets.length; i++) {
        for (let j = 0; j < newPlanets.length; j++) {
            if (i === j) continue;

            const p1 = newPlanets[i];
            const p2 = newPlanets[j];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dz = p2.z - p1.z;

            const distanceSq = dx * dx + dy * dy + dz * dz;
            const distance = Math.sqrt(distanceSq);

            if (distance > p1.radius + p2.radius) {
                const accelerationMag = (G * p2.mass) / distanceSq;

                const ax = accelerationMag * (dx / distance);
                const ay = accelerationMag * (dy / distance);
                const az = accelerationMag * (dz / distance);

                p1.ax += ax;
                p1.ay += ay;
                p1.az += az;
            }
        }
    }

    for (const planet of newPlanets) {
        if (
            -2 * CANVAS_SIZE > planet.x ||
            planet.x > CANVAS_SIZE * 3 ||
            -2 * CANVAS_SIZE > planet.y ||
            planet.y > CANVAS_SIZE * 3
        ) {
            const initialPlanet = initialPlanets.filter((p) => p.name == planet.name)[0];
            planet.vx = initialPlanet.vx;
            planet.vy = initialPlanet.vy;
            planet.vz = initialPlanet.vz;
            planet.x = initialPlanet.x;
            planet.y = initialPlanet.y;
            planet.z = initialPlanet.z;
            continue;
        }

        planet.vx += planet.ax * DT;
        planet.vy += planet.ay * DT;
        planet.vz += planet.az * DT;

        planet.x += planet.vx * DT;
        planet.y += planet.vy * DT;
        planet.z += planet.vz * DT;
    }

    return newPlanets;
};

const ManyBodySimulation = () => {
    const [planets, setPlanets] = useState(initialPlanets);
    const [trajectories, setTrajectories] = useState(initialPlanets.map((p) => ({ id: p.id, points: [] })));

    const [zoom, setZoom] = useState(1.0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const mouseDownRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    const PROJECTION_DISTANCE = 500;

    const handleWheel = useCallback((event) => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? 0.95 : 1.05;
        setZoom((prevZoom) => Math.min(Math.max(prevZoom * direction, 0.2), 5.0));
    }, []);

    const handleMouseDown = useCallback((event) => {
        mouseDownRef.current = true;
        lastMousePosRef.current = { x: event.clientX, y: event.clientY };
    }, []);

    const handleMouseUp = useCallback(() => {
        mouseDownRef.current = false;
    }, []);

    const handleMouseMove = useCallback((event) => {
        if (!mouseDownRef.current) return;

        const dx = event.clientX - lastMousePosRef.current.x;
        const dy = event.clientY - lastMousePosRef.current.y;

        setOffset((prevOffset) => ({
            x: prevOffset.x + dx,
            y: prevOffset.y + dy,
        }));

        lastMousePosRef.current = { x: event.clientX, y: event.clientY };
    }, []);

    const projectPoint = useCallback(
        (p, currentZoom, currentOffset) => {
            const factor = PROJECTION_DISTANCE / (PROJECTION_DISTANCE + p.z * currentZoom);

            return {
                x: CANVAS_SIZE / 2 + p.x * currentZoom * factor + currentOffset.x,
                y: CANVAS_SIZE / 2 + p.y * currentZoom * factor + currentOffset.y,
                r: p.radius * Math.min(currentZoom, 2) * factor,
            };
        },
        [PROJECTION_DISTANCE]
    );

    const drawPlanets = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        trajectories.forEach((t) => {
            const planet = planets.find((p) => p.id === t.id);
            if (!planet || t.points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = planet.color + "20";
            ctx.lineWidth = 1;

            const firstPoint = t.points[0];
            const firstProjected = projectPoint(firstPoint, zoom, offset);
            ctx.moveTo(firstProjected.x, firstProjected.y);

            for (let i = 1; i < t.points.length; i++) {
                const point = t.points[i];
                const projected = projectPoint(point, zoom, offset);
                ctx.lineTo(projected.x, projected.y);
            }
            ctx.stroke();
        });

        const sortedPlanets = [...planets].sort((a, b) => a.z * zoom - b.z * zoom);

        sortedPlanets.forEach((p) => {
            ctx.beginPath();

            const projected = projectPoint(p, zoom, offset);

            if (projected.r < 1 || projected.r > 100) return;

            ctx.arc(projected.x, projected.y, projected.r, 0, 2 * Math.PI);
            ctx.fillStyle = p.color;
            ctx.fill();

            ctx.font = "10px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            const textYOffset = p.name === "Center" ? projected.y + projected.r + 15 : projected.y - projected.r - 5;
            ctx.fillText(p.name, projected.x, textYOffset);
        });
    }, [planets, trajectories, zoom, offset, projectPoint]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener("wheel", handleWheel);
            canvas.addEventListener("mousedown", handleMouseDown);
            canvas.addEventListener("mouseup", handleMouseUp);
            canvas.addEventListener("mousemove", handleMouseMove);
        }
        return () => {
            if (canvas) {
                canvas.removeEventListener("wheel", handleWheel);
                canvas.removeEventListener("mousedown", handleMouseDown);
                canvas.removeEventListener("mouseup", handleMouseUp);
                canvas.removeEventListener("mousemove", handleMouseMove);
            }
        };
    }, [handleWheel, handleMouseDown, handleMouseUp, handleMouseMove]);

    useEffect(() => {
        const animate = () => {
            setPlanets((prevPlanets) => calculateNextPositions(prevPlanets));
            setTrajectories((prevTrajectories) => {
                const newTrajectories = prevTrajectories.map((t) => {
                    const planet = planets.find((p) => p.id === t.id);
                    if (planet) {
                        const newPoints = [...t.points, { x: planet.x, y: planet.y, z: planet.z }];
                        if (newPoints.length > TRAIL_LENGTH) {
                            newPoints.shift();
                        }
                        return { ...t, points: newPoints };
                    }
                    return t;
                });
                return newTrajectories;
            });
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [planets]);

    useEffect(() => {
        drawPlanets();
    }, [planets, trajectories, drawPlanets, zoom, offset]);

    return (
        <div style={{ padding: 20 }}>
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                style={{ border: "2px solid white", backgroundColor: "black", touchAction: "none", cursor: "grab" }}
            />
        </div>
    );
};

export default ManyBodySimulation;
