import { AUTO_INTERVALS } from "./constants";

export type ReadMode = "snap" | "scroll" | "book";
export type AutoInterval = (typeof AUTO_INTERVALS)[number];
