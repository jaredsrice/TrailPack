import grandViewPoint from "./grand-view-point.json";
import grandViewPointJacksonLodge from "./grand-view-point-jackson-lodge.json";
import emmaMatildaLakeLoop from "./emma-matilda-lake-loop.json";
import twoOceanEmmaMatildaLoop from "./two-ocean-emma-matilda-loop.json";
import signalMountain from "./signal-mountain.json";
import hollyLake from "./holly-lake.json";
import paintbrushCascadeLoop from "./paintbrush-cascade-loop.json";
import moosePonds from "./moose-ponds.json";
import moosePondsLoop from "./moose-ponds-loop.json";
import hiddenFalls from "./hidden-falls.json";
import hiddenFallsShuttle from "./hidden-falls-shuttle.json";
import inspirationPoint from "./inspiration-point.json";
import inspirationPointShuttle from "./inspiration-point-shuttle.json";
import cascadeCanyonForks from "./cascade-canyon-forks.json";
import cascadeCanyonForksShuttle from "./cascade-canyon-forks-shuttle.json";
import lakeSolitude from "./lake-solitude.json";
import lakeSolitudeShuttle from "./lake-solitude-shuttle.json";
import hurricanePass from "./hurricane-pass.json";
import hurricanePassShuttle from "./hurricane-pass-shuttle.json";
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
import graniteCanyonValleyTrail from "./granite-canyon-valley-trail.json";
import graniteCanyonRendezvous from "./granite-canyon-rendezvous.json";
import marionLake from "./marion-lake.json";
import marionLakeRendezvous from "./marion-lake-rendezvous.json";
import openCanyon from "./open-canyon.json";
import openCanyonRendezvous from "./open-canyon-rendezvous.json";
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
  inspirationPointShuttle,
  lakeCreekWoodland, phelpsLake, heronPondSwanLake, hermitagePoint,
  leighLake, bearpawTrapper,
  taggartBeaverCreek, taggartBradleyLake,
  grandViewPoint,
  grandViewPointJacksonLodge,
  emmaMatildaLakeLoop,
  twoOceanEmmaMatildaLoop,
  signalMountain,
  hollyLake,
  paintbrushCascadeLoop,
  moosePonds,
  moosePondsLoop,
  hiddenFalls,
  hiddenFallsShuttle,
  inspirationPoint,
  cascadeCanyonForks,
  cascadeCanyonForksShuttle,
  lakeSolitude,
  lakeSolitudeShuttle,
  hurricanePass,
  hurricanePassShuttle,
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
  graniteCanyonValleyTrail,
  graniteCanyonRendezvous,
  marionLake,
  marionLakeRendezvous,
  openCanyon,
  openCanyonRendezvous,
] as unknown as readonly TrailDefinition[];
