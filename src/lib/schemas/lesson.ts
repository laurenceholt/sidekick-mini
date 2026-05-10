/**
 * Content schema for sidekick-mini.
 *
 * This mirrors the JSONB shape stored in the Supabase `lessons_content.data` column.
 * When we eventually migrate content to JSON-in-git (à la mathkcs/src/content/scm),
 * these types stay the same — only the loader in `@/lib/content` changes.
 */

export type StepType =
  | "place-point"
  | "move-point"
  | "equation-input"
  | "multiple-choice"
  | "number-line-choice"
  | "thermometer"
  | "thermometer-compare"
  | "elevation"
  | "compare-sign"
  | "inequality-input"
  | "tap-point"
  | "inequality-build"
  | "inequality-write"
  | "coord-plot"
  | "coord-tap"
  | "tile-sort"
  | "bar-leveler"
  | "pick-from-list"
  | "compare-means"
  | "two-chart-choice"
  | "celebrate";

/** Specs reused as props across multiple step types */
export interface DotPlotSpec {
  xMin: number;
  xMax: number;
  step?: number;
  data: number[];
  redValues?: number[];
  highlightValue?: number;
  label?: string;
  legend?: string;
}

export interface HistogramBucketSpec {
  label: string;
  count: number;
}
export interface HistogramSpec {
  buckets: HistogramBucketSpec[];
  bucketsVisible?: number;
  dotsInBars?: boolean;
  arrowAtBucket?: number;
  yLabel?: string;
  xLabel?: string;
  yStep?: number;
}

export interface MultiThermoSpec {
  values: number[];
  min?: number;
  max?: number;
  unit?: string;
}

/** Visual inequality ray: open circle at `start`, line extending to the arrow direction. */
export interface InequalityLineSpec {
  start: number;
  direction: ">" | "<";
}

export interface BaseStep {
  type: StepType;
  instruction?: string;
  hint?: string;
}

export interface PlacePointStep extends BaseStep {
  type: "place-point";
  min: number;
  max: number;
  tickStep?: number;
  /** If set, only ticks at multiples of `labelStep` show numeric labels. Defaults to tickStep. */
  labelStep?: number;
  target?: number;
  condition?: "lessThan" | "greaterThan";
  conditionValue?: number;
  referencePoint?: number;
  highlightValues?: number[];
  staticPoints?: number[];
  tolerance?: number;
}

export interface MultipleChoiceStep extends BaseStep {
  type: "multiple-choice";
  choices: { text: string; correct: boolean; arrow?: "left" | "right" }[];
  showNumberLine?: boolean;
  min?: number;
  max?: number;
  tickStep?: number;
  labelStep?: number;
  staticPoints?: number[];
}

export interface EquationInputStep extends BaseStep {
  type: "equation-input";
  prefix?: string;
  target: number;
  acceptable?: string[];
  showNumberLine?: boolean;
  min?: number;
  max?: number;
  tickStep?: number;
  labelStep?: number;
  staticPoints?: number[];
}

export interface MovePointStep extends BaseStep {
  type: "move-point";
  min: number;
  max: number;
  tickStep?: number;
  labelStep?: number;
  startValue: number;
  target: number;
  moveBy?: number;
  equationLabel?: string;
}

export interface NumberLineChoiceStep extends BaseStep {
  type: "number-line-choice";
  min: number;
  max: number;
  tickStep?: number;
  labelStep?: number;
  points: number[];
  choices: { text: string; correct: boolean }[];
}

export interface ThermometerStep extends BaseStep {
  type: "thermometer";
  min: number;
  max: number;
  tickStep?: number;
  target?: number;
  displayTemp?: number;
  choices?: { text: string; correct: boolean }[];
}

export interface ThermometerCompareStep extends BaseStep {
  type: "thermometer-compare";
  min: number;
  max: number;
  tickStep?: number;
  temperatures: number[];
  choices: { text: string; correct: boolean }[];
}

export interface ElevationStep extends BaseStep {
  type: "elevation";
  min: number;
  max: number;
  tickStep?: number;
  target?: number;
  staticPoints?: number[];
  choices?: { text: string; correct: boolean }[];
}

export interface CompareSignStep extends BaseStep {
  type: "compare-sign";
  left: number | string;
  right: number | string;
  target: ">" | "<";
  showNumberLine?: boolean;
  min?: number;
  max?: number;
  tickStep?: number;
  labelStep?: number;
  staticPoints?: number[];
  image?: string;
  sentence?: string;
}

export interface InequalityInputStep extends BaseStep {
  type: "inequality-input";
  leftValue?: number;
  rightValue?: number;
  sign: ">" | "<";
}

export interface TapPointStep extends BaseStep {
  type: "tap-point";
  min: number;
  max: number;
  tickStep?: number;
  labelStep?: number;
  points: number[];
  targets: number[];
  multi?: boolean;
  inequalityLine?: InequalityLineSpec;
}

export interface InequalityBuildStep extends BaseStep {
  type: "inequality-build";
  min: number;
  max: number;
  tickStep?: number;
  labelStep?: number;
  initialStart?: number;
  initialDirection?: ">" | "<";
  fixedDirection?: ">" | "<";
  targetStart: number;
  targetDirection: ">" | "<";
  unitSuffix?: string;
}

export interface InequalityWriteStep extends BaseStep {
  type: "inequality-write";
  leftVar?: string;
  leftIsInput?: boolean;
  fixedSign?: ">" | "<" | "=";
  includeEquals?: boolean;
  rightValue?: number;
  rightIsInput?: boolean;
  target?: { var?: string; sign: ">" | "<" | "="; value: number };
  solutions?: number[];
  image?: string;
  inequalityLine?: InequalityLineSpec;
}

export interface CoordPlaneSpec {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid?: boolean;
  showBuildings?: boolean;
  showAxes?: boolean;
  showArchery?: boolean;
  points?: { x: number; y: number; label?: string; figure?: boolean }[];
  figure?: { x: number; y: number } | null;
}

export interface CoordPlotStep extends BaseStep {
  type: "coord-plot";
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid?: boolean;
  showBuildings?: boolean;
  showAxes?: boolean;
  showArchery?: boolean;
  points?: { x: number; y: number; label?: string; figure?: boolean }[];
  initialFigure?: { x: number; y: number };
  targetX: number;
  targetY: number;
}

export interface CoordTapStep extends BaseStep {
  type: "coord-tap";
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid?: boolean;
  showAxes?: boolean;
  tapPoints: { x: number; y: number; label?: string }[];
  targetX: number;
  targetY: number;
}

export interface TileSortStep extends BaseStep {
  type: "tile-sort";
  /** Numeric tiles the student drags into buckets. Duplicates allowed. */
  tiles: number[];
  /** Bucket labels of the form "lo-hi" (inclusive). */
  buckets: string[];
}

export interface BarLevelerStep extends BaseStep {
  type: "bar-leveler";
  /** Starting count of filled cells per bar */
  initial: number[];
  /** Height of every bar in cells */
  barHeight: number;
  /** All bars should end at this count */
  target: number;
  /** Hide the left/right arrows (display-only "find the mean" mode) */
  hideArrows?: boolean;
}

export interface PickFromListStep extends BaseStep {
  type: "pick-from-list";
  values: number[];
  target: number;
}

export interface CompareMeansStep extends BaseStep {
  type: "compare-means";
  leftLabel: string;
  rightLabel: string;
  leftTarget: number;
  rightTarget: number;
}

export interface TwoChartChoiceStep extends BaseStep {
  type: "two-chart-choice";
  choices: {
    label?: string;
    correct: boolean;
    dotPlot?: DotPlotSpec;
    histogram?: HistogramSpec;
  }[];
}

export interface CelebrateStep extends BaseStep {
  type: "celebrate";
}

export type Step = BaseStep & Record<string, unknown>;

export interface MiniLesson {
  id: string;
  title: string;
  /** Overrides the array-index based number used in the step-id badge / event log */
  displayNum?: number;
  steps: Step[];
}

export interface Lesson {
  id: string;
  title: string;
  displayNum?: number;
  miniLessons: MiniLesson[];
}

export interface Section {
  id: string;
  title: string;
  displayNum?: number;
  lessons: Lesson[];
}

export interface Module {
  id: string;
  title: string;
  displayNum?: number;
  sections: Section[];
}

export interface StoryPage {
  image: string;
  text: string;
}

export interface Story {
  id: string;
  tag: string;
  offer: string;
  pages: StoryPage[];
}

export interface ContentData {
  version: number;
  modules: Module[];
  stories?: Story[];
}
