import grandViewPoint from "./grand-view-point.json";
import emmaMatildaLakeLoop from "./emma-matilda-lake-loop.json";
import twoOceanEmmaMatildaLoop from "./two-ocean-emma-matilda-loop.json";
import signalMountain from "./signal-mountain.json";
import hollyLake from "./holly-lake.json";
import paintbrushCascadeLoop from "./paintbrush-cascade-loop.json";
import moosePonds from "./moose-ponds.json";
import hiddenFalls from "./hidden-falls.json";
import inspirationPoint from "./inspiration-point.json";
import cascadeCanyonForks from "./cascade-canyon-forks.json";
import lakeSolitude from "./lake-solitude.json";
import hurricanePass from "./hurricane-pass.json";
import surpriseAmphitheaterLakes from "./surprise-amphitheater-lakes.json";
import garnetCanyon from "./garnet-canyon.json";
import murieRanch from "./murie-ranch.json";
import aspenBoulderRidgeLoop from "./aspen-boulder-ridge-loop.json";
import phelpsLakeOverlook from "./phelps-lake-overlook.json";
import phelpsLakeDeathCanyon from "./phelps-lake-death-canyon.json";
import deathCanyonJunction from "./death-canyon-junction.json";
import staticPeakDivide from "./static-peak-divide.json";
import valleyTrailPhelpsOverlook from "./valley-trail-phelps-overlook.json";
import graniteCanyon from "./granite-canyon.json";
import marionLake from "./marion-lake.json";
import openCanyon from "./open-canyon.json";
import jennyLake from "./jenny-lake-loop.json";
import taggartLake from "./taggart-lake.json";
import stringLake from "./string-lake-loop.json";
import colterBay from "./colter-bay-lakeshore-trail.json";
import twoOcean from "./two-ocean-lake-loop.json";
import lunchTreeHill from "./lunch-tree-hill.json";
import christianPond from "./christian-pond-loop.json";
import lakeCreekWoodland from "./lake-creek-woodland-loop.json";
import phelpsLake from "./phelps-lake-loop.json";
import heronPondSwanLake from "./heron-pond-swan-lake-loop.json";
import hermitagePoint from "./hermitage-point.json";
import leighLake from "./leigh-lake.json";
import bearpawTrapper from "./bearpaw-trapper-lakes.json";
import taggartBeaverCreek from "./taggart-beaver-creek-loop.json";
import taggartBradleyLake from "./taggart-bradley-lake-loop.json";
import type { TrailDefinition } from "../../lib/trail-definition";

/** One registration per approved trail. The offline catalog check validates JSON. */
export const TRAIL_DEFINITIONS = [
  jennyLake, taggartLake, stringLake, colterBay, twoOcean, lunchTreeHill, christianPond,
  lakeCreekWoodland, phelpsLake, heronPondSwanLake, hermitagePoint,
  leighLake, bearpawTrapper,
  taggartBeaverCreek, taggartBradleyLake,
  grandViewPoint,
  emmaMatildaLakeLoop,
  twoOceanEmmaMatildaLoop,
  signalMountain,
  hollyLake,
  paintbrushCascadeLoop,
  moosePonds,
  hiddenFalls,
  inspirationPoint,
  cascadeCanyonForks,
  lakeSolitude,
  hurricanePass,
  surpriseAmphitheaterLakes,
  garnetCanyon,
  murieRanch,
  aspenBoulderRidgeLoop,
  phelpsLakeOverlook,
  phelpsLakeDeathCanyon,
  deathCanyonJunction,
  staticPeakDivide,
  valleyTrailPhelpsOverlook,
  graniteCanyon,
  marionLake,
  openCanyon,
] as unknown as readonly TrailDefinition[];
