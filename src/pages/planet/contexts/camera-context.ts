import { createContext } from "react";

const CameraContext = createContext({ zoom: 0, offset: { x: 0, y: 0 } });

export default CameraContext;
