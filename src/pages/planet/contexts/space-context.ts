import { createContext } from "react";

const SpaceContext = createContext({ gravity: 0.000005, tick: 20 });

export default SpaceContext;
