export type StegvisPuzzle = {
  id: string;
  start: string;
  target: string;
  title: string;
  minimumSteps?: number;
  sampleSolution?: string[];
};

export const stegvisPuzzles: StegvisPuzzle[] = [
  {
    id: "hand-land",
    start: "hand",
    target: "land",
    title: "Hand till land",
    minimumSteps: 2,
    sampleSolution: ["hand", "band", "land"],
  },
  {
    id: "band-sand",
    start: "band",
    target: "sand",
    title: "Band till sand",
    minimumSteps: 1,
    sampleSolution: ["band", "sand"],
  },
  {
    id: "korn-port",
    start: "korn",
    target: "port",
    title: "Korn till port",
    minimumSteps: 3,
    sampleSolution: ["korn", "kort", "fort", "port"],
  },
  {
    id: "makt-mars",
    start: "makt",
    target: "mars",
    title: "Makt till mars",
    minimumSteps: 3,
    sampleSolution: ["makt", "maka", "mara", "mars"],
  },
  {
    id: "kall-varm",
    start: "kall",
    target: "varm",
    title: "Kall till varm",
    minimumSteps: 4,
    sampleSolution: ["kall", "hall", "halm", "harm", "varm"],
  },
  {
    id: "dans-fort",
    start: "dans",
    target: "fort",
    title: "Dans till fort",
    minimumSteps: 4,
    sampleSolution: ["dans", "fans", "fars", "fart", "fort"],
  },
  {
    id: "horn-port",
    start: "horn",
    target: "port",
    title: "Horn till port",
    minimumSteps: 4,
    sampleSolution: ["horn", "korn", "kort", "fort", "port"],
  },
  {
    id: "skal-skam",
    start: "skal",
    target: "skam",
    title: "Skal till skam",
    minimumSteps: 1,
    sampleSolution: ["skal", "skam"],
  },
];
