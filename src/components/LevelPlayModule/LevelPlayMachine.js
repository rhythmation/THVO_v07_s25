import { createMachine } from "xstate";

const LevelPlayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBswDczIArIIYE8A6ASwDsAXAJwHsARY3ZaqAVzAGIBJAOQBUAlAPIB9AMKCAslgAyAUV6yA2gAYAuolAAHarGLli1UhpAAPRAEYAnAGZCAdgBsAFgAcygKzmATO8vKvTgA0IPgWvoTm1k4OXpYukdEO7nYAvinBqBjYeERkVHQMTKwc3LIAGrwq6kgg2rr6hsZmCAHmhMrmLnbeLgGudpZewaEIkYQxDpHKDg4ufjGp6SCZmDgEhHVgErjkAMYAFmRQ7KUVVcZ1egZGNc1uyoSWdk7mdnNOfnZeDsOIc4Q+ZQdawudwOazPWZpDLoVY5EikXRQfbkE7lSpqC46K6NW4WQGED4zcFdPzudxDEJ-SwA9xAyKg8GQlzQ5aw7LrPIsHGkNFnTE1S4NG6gZrmDp2QhgsF2aYzXy+X4If6A4GMiGJVkrDlEagsfL0RjMNh8jHVLTY4VNCwOabjOZ+D5xW0uIJU5U01UMsEamZa9lrIjkADuYDAvNOZqx9Wu1oQFIc9nMMSJTjTSWsSpVToclmT1kG7lcaSWpGoEDgxm1gejPLjAFpvu1JkDpl5XnMXD93fW7LYuiC3sprNZpso5v6soGEQbCsawLWrXiWm0bA6bG92x03SNxV5CF27GCPo5W+5J3D1pttntDqQoIvY8vwW07JvyckvF5rOSs566UCXQDEWI4XjqCJIiij64qKFjmOY7jtHE7jxKC6bmH+tKtkBlggdYYHTlydaCpaT6wQgfi2LK3x5sk3izO4mGquOb64U4oFLNW8J6rORrFNBIqmBYEK2OO0ReLK0zPK6TEASxwHsfhnEBvC2qyKQEACXGrzJISljse41i2t4fY7n8LjtK28HyoZ3yLDCU7wiGYaCUKZFCQgTgBAeyh9lY1jfK6uZmR6AI5nm4KFtEJYpEAA */
  id: "levelPlay",
  initial: "introDialogue",
  on: {
    RESET_CONTEXT: "introDialogue"
  },
  states: {
    introDialogue: {
      on: {
        // When the chapter machine signals that the intro is complete,
        // transition from introDialogue to poseMatching.
        NEXT: "tween"
      },
    },

    poseMatching: {
      on: {
        NEXT: "intuition"
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
      on: {
        // allow an explicit reset
        RESET_CONTEXT: "introDialogue"
      }
    },

    tween: {
      on: {
        NEXT: "poseMatching"
      }
    }
  },
});

export default LevelPlayMachine;
