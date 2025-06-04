import { createMachine } from "xstate";

const LevelPlayMachine = createMachine({
  id: "levelPlay",
  initial: "introDialogue",
  states: {
    introDialogue: {
      on: {
        // When the chapter machine signals that the intro is complete,
        // transition from introDialogue to poseMatching.
        INTRO_COMPLETE: "poseMatching",
        NEXT: "poseMatching",
      },
    },
    poseMatching: {
      on: {
        NEXT: "intuition",
      },
    },
    insight: {
      on: {
        NEXT: "outroDialogue",
      },
    },
    intuition: {
      on: {
        NEXT: "insight",
      },
    },
    outroDialogue: {
      on: {
        NEXT: "levelEnd",
      },
    },
    levelEnd: {
      type: "final",
    },
  },
});

export default LevelPlayMachine;
