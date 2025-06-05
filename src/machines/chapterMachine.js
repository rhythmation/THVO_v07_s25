import { createMachine, assign } from "xstate";

const chapterMachine = createMachine(
  {
    initial: "intro",
    context: {
      introText: [],
      outroText: [],
      scene: [],
      currentText: {},
      lastText: [],
      cursorMode: false,
      isOutro: false,
      onIntroComplete: () => {},
      onOutroComplete: () => {},
    },
    states: {
      idle: {
        after: {
          1000: [
            {
              target: "outro",
              cond: (context) => context.isOutro,
            },
            {
              target: "intro",
            },
          ],
        },
      },
      intro: {
        entry: ["introDialogueStep"],
        initial: "reading",
        states: {
          reading: {
            after: {
              1500: {
                target: "ready",
                actions: assign({ cursorMode: true })
              }
            }
          },
          ready: {}
        },
        on: {
          NEXT: [
            {
              target: "intro",
              cond: "continueIntro",
              actions: assign({ cursorMode: false })
            },
            {
              target: "done",
              cond: (context) => context.introText.length === 0,
              actions: "triggerOnIntroComplete",
            },
          ],
          RESET_CONTEXT: {
            target: "idle",
            actions: "resetContext",
          },
        },
      },
      introReading: {
        after: {
          3000: {
            target: "intro",
          },
        },
      },
      experiment: {
        on: {
          ADVANCE: {
            target: "outro",
          },
        },
      },
      outro: {
        entry: "outroDialogStep",
        initial: "reading",
        states: {
          reading: {
            after: {
              1500: {
                target: "ready",
                actions: assign({ cursorMode: true })
              }
            }
          },
          ready: {}
        },
        on: {
          NEXT: [
            {
              target: "outro",
              cond: "continueOutro",
              actions: assign({ cursorMode: false })
            },
            {
              target: "done",
              cond: (context) => context.outroText.length === 0,
              actions: "triggerOnOutroComplete",
            },
          ],
          RESET_CONTEXT: {
            target: "idle",
            actions: "resetContext",
          },
        },
      },
      loadingNextChapter: {
        on: {
          RESET_CONTEXT: {
            target: "idle",
            actions: "resetContext",
          },
        },
      },
      done: {
        type: "final",
      },
    },
    on: {
      RESET_CONTEXT: {
        target: "idle",
        actions: "resetContext",
      },
    },
  },
  {
    guards: {
      continueIntro: (context) => context.introText.length > 0,
      continueOutro: (context) => context.outroText.length > 0,
    },
    actions: {
      resetContext: assign({
        introText: (_, event) => event.introText,
        outroText: (_, event) => event.outroText,
        scene: (_, event) => event.scene,
        currentText: (_, event) => event.isOutro ? event.outroText[0] || null : event.introText[0] || null,
        lastText: () => [],
        cursorMode: () => false,
        isOutro: (_, event) => event.isOutro,
      }),
      introDialogueStep: assign({
        currentText: (context) => context.introText[0] || {},
        introText: (context) => context.introText.length > 0 ? context.introText.slice(1) : [],
        lastText: (context) => context.introText.length > 0 ? [...context.lastText, context.currentText] : [],
      }),
      toggleCursorMode: assign({
        cursorMode: (context) => !context.cursorMode,
      }),
      outroDialogStep: assign({     
        currentText: (context) => context.outroText[0] || {},
        outroText: (context) => context.outroText.length > 0 ? context.outroText.slice(1) : [],
        lastText: (context) => context.outroText.length > 0 ? [...context.lastText, context.currentText] : [],
      }),
      triggerOnIntroComplete: (context) => context.onIntroComplete(),
      triggerOnOutroComplete: (context) => context.onOutroComplete?.(),
    },
  }
);

export default chapterMachine;
