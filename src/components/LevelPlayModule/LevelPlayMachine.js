import { createMachine } from "xstate";

const LevelPlayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBswDczIArIIYE8A6ASwDsAXAJwHsARY3ZaqAVzAGIBJAOQBUAlAPIB9AMKCAslgAyAUV6yA2gAYAuolAAHarGLli1UhpAAPRAEYAnAGZCAdgBsAFgAcygKzmATO8vKvTgA0IPgWvoTm1k4OXpYukdEO7nYAvinBqBjYeERkVHQMTKwc3LIAGrwq6kgg2rr6hsZmCAHmhMrmLnbeLgGudpZewaEIkYQxDpHKDg4ufjGp6SCZmDgEhHVgErjkAMYAFmRQ7KUVVcZ1egZGNc1uyoSWdk7mdnNOfnZeDsOIc4Q+ZQdawudwOazPWZpDLoVY5EikXRQfbkE7lSpqC46K6NW4WQGED4zcFdPzudxDEJ-SwA9xAyKg8GQlzQ5aw7LrPIsHGkNFnTE1S4NG6gZrmDp2QhgsF2aYzXy+X4If6A4GMiGJVkrDlEagsfL0RjMNh8jHVLTY4VNCwOabjOZ+D5xW0uIJU5U01UMsEamZpJakagQODGbVrEYW+rXa0IAC033akyB0y8rzmLh+7tjdlsXRBzicL2UlncIK17PDCINhWNYCxUdxosQqceIMs7YhvXF5jdI3FXkIGbsYI+jmT7nLWUrm22e0OpCg9Z5McmnqZyghsVlYKVKrpQK6A3cTmsXhZSzD8LISJRS6teNG5nM7nacXc8VBhcmu89++Uh5LE9rEnOFOQobl70jZcHz8WxZW+Sxn26b5QR-WlkwA49rGAi8K3hPVqyNYo72jB9IhzdpXQWIEHGeV00NVf87CPICQJ1QhtVkUgIBIxtTAsYdJQ+E9S1tbwc17P4XHaZMn3lUtvkWNIgA */
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
