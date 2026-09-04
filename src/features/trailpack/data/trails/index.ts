import jennyLake from "./jenny-lake-loop.json";
import taggartLake from "./taggart-lake.json";
import stringLake from "./string-lake-loop.json";
import colterBay from "./colter-bay-lakeshore-trail.json";
import twoOcean from "./two-ocean-lake-loop.json";
import lunchTreeHill from "./lunch-tree-hill.json";
import christianPond from "./christian-pond-loop.json";
import lakeCreekWoodland from "./lake-creek-woodland-loop.json";
import phelpsLake from "./phelps-lake-loop.json";
import type { TrailDefinition } from "../../lib/trail-definition";

/** One registration per approved trail. The offline catalog check validates JSON. */
export const TRAIL_DEFINITIONS = [
  jennyLake, taggartLake, stringLake, colterBay, twoOcean, lunchTreeHill, christianPond,
  lakeCreekWoodland, phelpsLake,
] as unknown as readonly TrailDefinition[];
