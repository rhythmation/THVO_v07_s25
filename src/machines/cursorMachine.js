import { createMachine, assign } from "xstate";

const CursorMachine = createMachine(
  {
    id: "cursor",
    initial: "idle",
    context: {
      callback: () => {
        console.log("Default callback triggered.");
      },
      hovering: false,
      canTransition: true,
      placementCounter: 0,
    },
    states: {
      idle: {
        on: {
          TRIGGER: {
            target: "activated",
            cond: (context) => context.canTransition,
            actions: [
              // Immediately disable further triggers for a short moment
              assign({
                hovering: (context) => !context.hovering,
                placementCounter: (context) => context.placementCounter + 1,
                canTransition: () => false,
              }),
              (context) => {
                if (typeof context.callback === "function") {
                  context.callback();
                } else {
                  console.warn("callback is not a function", context.callback);
                }
              },
            ],
          },
        },
      },
      activated: {
        // Quickly reset to idle and allow new triggers
        after: {
          100: {
            target: "idle",
            actions: assign({
              canTransition: () => true,
            }),
          },
        },
      },
    },
  },
  {
    actions: {
      toggleHovering: assign({
        hovering: (context) => !context.hovering,
      }),
    },
  }
);

export default CursorMachine;
