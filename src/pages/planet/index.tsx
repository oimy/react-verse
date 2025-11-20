import {
    useCallback,
    useContext,
    useDebugValue,
    useDeferredValue,
    useEffect,
    useEffectEvent,
    useInsertionEffect,
    useLayoutEffect,
    useMemo,
    useOptimistic,
    useReducer,
    useRef,
    useSyncExternalStore,
    useTransition,
} from "react";
import PlanetCreateBox from "./boxes/planet-create-box";
import CanvasContext from "./contexts/canvas-context";
import SpaceContext from "./contexts/space-context";
import { SimpleCanvasDownloader, type CanvasDownloader } from "./downloaders/canvas-downloader";
import type Planet from "./models/planet";
import type Point from "./models/point";
import planetReducer from "./reducers/planet-reducer";
import trajectoryReducer from "./reducers/trajectory-reducer";
import { PlanetStore, savePlanet } from "./store/planet-store";
import { SimpleOrbitAccelerator } from "./utils/orbits/orbit-accelerator";
import OrbitEngine from "./utils/orbits/orbit-engine";
import { SimpleOrbitProcessor } from "./utils/orbits/orbit-processor";
import { SimpleOrbitResetter } from "./utils/orbits/orbit-resetter";
import type OrbitValidator from "./utils/orbits/orbit-validator";
import { PositionOrbitValidator } from "./utils/orbits/orbit-validator";
import { PlanetFactory } from "./utils/planet-factory.utils";
import { PointFactory } from "./utils/point-factory.utils";

export default function PlanetPage() {
    // const window
    const canvasContext = useContext(CanvasContext);
    const spaceContext = useContext(SpaceContext);
    const initialPlanets = useSyncExternalStore(PlanetStore.subscribe, PlanetStore.getSnapshot);
    const orbitValidator: OrbitValidator = useMemo(
        () =>
            new PositionOrbitValidator(
                PointFactory.create(canvasContext.width, canvasContext.height, 100),
                PointFactory.create(0, 0, -100)
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
    const canvasDownloader: CanvasDownloader = useMemo(() => new SimpleCanvasDownloader(canvasRef), []);

    const animationFrameRef = useRef<number>(null);
    const lastUpdateTimeRef = useRef(0);
    const updateInterval = useRef(50);

    const [planets, dispatchPlanets] = useReducer(planetReducer, PlanetFactory.copyAll(initialPlanets));
    const planetsRef = useRef(planets);
    const [trajectories, dispatchTrajectories] = useReducer(
        trajectoryReducer,
        initialPlanets.map((p) => ({ id: p.id, points: [] }))
    );
    const deferredTrajectories = useDeferredValue(trajectories);

    const drawTrajectories = useEffectEvent((context: CanvasRenderingContext2D) => {
        deferredTrajectories.forEach((trajectory) => {
            if (trajectory.points.length < 2) return;

            context.beginPath();
            context.strokeStyle = "gray";
            context.lineWidth = 2;

            const firstPoint: Point = trajectory.points[0];
            context.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < trajectory.points.length; i++) {
                if (
                    Math.abs(trajectory.points[i].x - trajectory.points[i - 1].x) > 100 ||
                    Math.abs(trajectory.points[i].y - trajectory.points[i - 1].y) > 100
                ) {
                    context.moveTo(trajectory.points[i].x, trajectory.points[i].y);
                }
                const point: Point = trajectory.points[i];
                context.lineTo(point.x, point.y);
            }
            context.stroke();
        });
    });

    const drawPlanets = useCallback(
        (context: CanvasRenderingContext2D) => {
            const sortedPlanets = [...planets].sort((p1, p2) => p1.position.z - p2.position.z);
            sortedPlanets.forEach((planet) => {
                context.beginPath();

                context.arc(
                    planet.position.x,
                    planet.position.y,
                    Math.max((planet.radius * (planet.position.z + 100)) / 100, 2),
                    0,
                    2 * Math.PI
                );
                context.fillStyle = "lightgray";
                context.fill();
            });
        },
        [planets]
    );

    useLayoutEffect(() => {
        const canvas: HTMLCanvasElement | null = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
        if (!context) return;
        context.clearRect(0, 0, canvasContext.width, canvasContext.height);

        drawTrajectories(context);
        drawPlanets(context);
    }, [canvasContext.height, canvasContext.width, drawPlanets]);

    useInsertionEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = "#222222";
        }
    }, []);

    const runFrame = useEffectEvent(() => {
        const nextPlanets: Planet[] = orbitEngine.createNextPlanets(planetsRef.current);
        dispatchPlanets({ type: "reset", planets: nextPlanets });
        dispatchTrajectories({ type: "move", planets: nextPlanets, orbitValidator: orbitValidator });
    });

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (timestamp >= lastUpdateTimeRef.current + updateInterval.current) {
                runFrame();
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
    }, [orbitEngine, orbitValidator]);

    const createRef = useRef<{ randomizeInputs: () => void }>(null);
    useDebugValue(planets.length);

    const [, startTransition] = useTransition();

    const [optimisticDownloadMessage, addOptimisticDownloadMessage] = useOptimistic("Capture");
    const handleDownload = () => {
        addOptimisticDownloadMessage("Capturing...");
        startTransition(async () => {
            await canvasDownloader.download();
            addOptimisticDownloadMessage("Done!");

            await new Promise((r) => setTimeout(r, 1000));
            addOptimisticDownloadMessage("Capture");
        });
    };

    return (
        <div>
            <canvas ref={canvasRef} width={canvasContext.width} height={canvasContext.height} />
            <button onClick={handleDownload}>{optimisticDownloadMessage}</button>
            <PlanetCreateBox
                ref={createRef}
                position={{ x: 700, y: 500, z: 0 }}
                onCreate={(planet: Planet) => {
                    dispatchPlanets({ type: "add", planet });
                    dispatchTrajectories({ type: "add", planet });
                    planetsRef.current.push(PlanetFactory.copy(planet));
                    savePlanet(planet);
                }}
            />
            <button
                onClick={() => {
                    if (!createRef.current) return;
                    createRef.current.randomizeInputs();
                }}
            >
                randomize!
            </button>
        </div>
    );
}
