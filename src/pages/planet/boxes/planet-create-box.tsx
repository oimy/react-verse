import { useActionState, useId, useImperativeHandle, useRef } from "react";
import type Planet from "../models/planet";
import type Point from "../models/point";
import { PlanetVelocityFactory, PointFactory } from "../utils/point-factory.utils";

interface FormProperty {
    position: Point;
    onCreate: (planet: Planet) => void;
}

const handleForm = async (prev: FormProperty, planetForm: FormData): Promise<FormProperty> => {
    const name: string | undefined = planetForm.get("name")?.toString();
    const mass: string | undefined = planetForm.get("mass")?.toString();
    const radius: string | undefined = planetForm.get("radius")?.toString();
    if (!name || !mass || !radius) {
        return prev;
    }

    const planet: Planet = {
        id: new Date().getTime(),
        name,
        mass: parseInt(mass),
        radius: parseInt(radius),
        position: PointFactory.copy(prev.position),
        velocity: PlanetVelocityFactory.withVelocity(0.05).random(),
    };
    prev.onCreate(planet);
    return prev;
};

export default function PlanetCreateBox({
    ref,
    position,
    onCreate,
}: {
    ref: React.Ref<{ randomizeInputs: () => void }>;
    position: Point;
    onCreate: (planet: Planet) => void;
}) {
    const [, formAction] = useActionState<FormProperty, FormData>(handleForm, {
        position,
        onCreate,
    });

    const nameId = useId();
    const massId = useId();
    const radiusId = useId();

    const massRef = useRef<HTMLInputElement>(null);
    const radiusRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(
        ref,
        () => {
            return {
                randomizeInputs() {
                    if (!massRef.current || !radiusRef.current) return;

                    massRef.current.value = Math.max(10, Math.floor(Math.random() * 1001)).toString();
                    radiusRef.current.value = Math.max(5, Math.floor(Math.random() * 21)).toString();
                },
            };
        },
        []
    );

    return (
        <form action={formAction}>
            <label htmlFor={nameId}>Name : </label>
            <input id={nameId} name="name" type="text" value="p1" />
            <label htmlFor={massId}>Mass : </label>
            <input ref={massRef} id={massId} name="mass" type="number" value={1000} />
            <label htmlFor={radiusId}>Radius : </label>
            <input ref={radiusRef} id={radiusId} name="radius" type="number" value={10} />
            <button type="submit">SAVE!</button>
        </form>
    );
}
