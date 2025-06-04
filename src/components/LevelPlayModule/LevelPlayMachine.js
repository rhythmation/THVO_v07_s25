import { createMachine } from "xstate";

const LevelPlayMachine =
  createMachine(
    {
      id: "levelPlay",
      initial: "poseMatching",
      states: {
        poseMatching: {
          on: {
            NEXT: "intuition",
          },
        },
        insight: {
          on: {
            NEXT: "levelEnd",
          },
        },
        intuition: {
          on: {
            NEXT: "insight",
          },
        },
        levelEnd: {
          type: "final",
        },
      },
    }
    
  );
export default LevelPlayMachine;
