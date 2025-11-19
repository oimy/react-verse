import { useActionState } from "react";
import type Planet from "../models/planet";
import type Point from "../models/point";
import { savePlanet } from "../store/planet-store";
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
    savePlanet(planet);
    prev.onCreate(planet);
    return prev;
};

export default function PlanetCreateBox({
    position,
    onCreate,
}: {
    position: Point;
    onCreate: (planet: Planet) => void;
}) {
    const [, formAction] = useActionState<FormProperty, FormData>(handleForm, {
        position,
        onCreate,
    });

    return (
        <form action={formAction}>
            <p>name</p>
            <input name="name" type="text" value="p1" />
            <p>mass</p>
            <input name="mass" type="number" value={1000} />
            <input name="radius" type="number" value={10} />
            <button type="submit">SAVE!</button>
        </form>
    );
}
