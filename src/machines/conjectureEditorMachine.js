import { createMachine, assign } from "xstate";

export const ConjectureEditorMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgHsAHAF1zP3QGIB5ABQBUBJJgOQGEBtAAwBdRKAplYuGnTEgAHogC0AdgDMAVhIBGAJzrB+ldoBMADnUAaEAE9EalWZLHt6jYLMndAFjWCNAL4B1mhYeISklDL0zOxc3AAiQqJIIBJS0XKKCCYaJiTe3tquKioe2gBsutrWdgi6FSS5Kj56ZhVmphVqQSEYOATE5NS0+ABGsZw8AILJcunSo1nKaibaJJ0V5SZF3Wa1iNqFJBUtzWreZmqrur0goQMRw9ETrFN8c6kLmanZSuYkXQmfzqNTtCoaDTGfa2exqXQkPy6DTeUpmXTw3SCCp3B7hIZRUavOI8JIieaSRayX6IXL5QrFUplTbVA45FGA-zXQSCFQmeEVfm4-r4yIjOiYSbxWbkr6Un6gP5uEiCS4WLw7IF8tnebGI4HA7SqwWOQLBe4iwZi6KSt7xABCn3E8qWNIQ-ycJj52ncgjWGlWXhhdSDiMM5g0HQczO8wrCVueo1tJMSTrSLupitpeQKRR9hj0mh5FTZGmKOhamh81SKXjjjwJ4vwEClMzT31dWfZ9O87kFHiqaiO3jZ2lWJChGk6R1cYK2PXNeIThLoLbtPEdsudGU7Cmz+R87hUAcPY5UJdhOTMTg0uiuqN83X89dFidXrY+W-TO8ze+7TQaQU8l1KExzUHUOjDL0BSHVwURfZcm0YdduE3FJtypfBlndVZ1iHLZAMcIFBHAy9XARbxuhac8zBIwQwKCc18DICA4DkJcIgpH8sLdVQrh0fQkVKUwLFIuonGPFpKN1QxIUqBc+njJ4V3oLjMOw1QTEaWTj28IFikjEcyL9HRBS2doUVcMx4MXS1lKbMY1IVP8lCHNQmlKejTFyAyVDZXJvE5AM-F5fkGiOBD7JtJzdz+LReQ6SNb1MLEzEuDQ2QFFVdWIvwrmxM1FIba1RggGLf2yLTBEBNKxzWEjezBUtrInHx+UqB8jTMRiAiAA */
  initial: "optiona",
  context: {
    holistic: undefined,
  },
  states: {
    optiona: {
      on: {
          OPTIONC: "optionc",
          OPTIOND: "optiond",
          OPTIONB: "optionb"
      },
    },
    optionb: {
        on: {
            OPTIONA: "optiona",
            OPTIONC: "optionc",
            OPTIOND: "optiond",
        },
    },
    optionc: {
        on: {
            OPTIONA: "optiona",
            OPTIONB: "optionb",
            OPTIOND: "optiond",
        },
    },
    optiond: {
        on: {
            OPTIONA: "optiona",
            OPTIONB: "optionb",
            OPTIONC: "optionc",
        },
    },
  },
});
