import { createMachine, assign } from "xstate";

export const PlayMenuMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgwIGIA5AUQHUAZGgNRoYG0AGAXUVAAcA9rFwAXXIPx8QAD0QBaAGwB2ABwkAjABYVyzjo0AmTsoCcAGhABPBQFZFWkooDMW56eWHVq52dsBff0s0LDxCUnJ8CgAFBgBBAE0uXiQQIRFxSWk5BCU9ElNXWw1lN3ttC2sFIx0SYw9lW1Mtey1lRUDgjBwCYjJ0SgBlGgAVEYBJKgBxQeTpdLEJKVScvMdTY2N2pudbNssbBENFRTr2rUNXI0LTU06QEJ7w-so4gBEAWUm51IXM5dAqxUp2Uai87Vuhi0hQOiA0TQKpk4JkMTVUymcW3ujzCfUi1HoUziHxoPwEwkWWRWCl0JE4t28GOcnFUWlUlUO8lUilsBUUl1syg0zlUGhZymx3VxEQGUUGIwA8gAlBI0N7jRVKslpCn-bI0oVnYUMjQaDymRSw3LOOmKUzsjSs1T01nQrSS0K9GWUJisBjDJgAYRG2r+S31uUU7LqzhO9MdLi0Rit8mF6mOx30QudJz2HqeeNlFCJJIDNGDod14epkedJHRWk4jvczSuKbFtl5GjtlxU3PtDnz0pIojgogJjBYbErGWrgIUSc49abqi27jNyhT7kMiPZJ2agt8HSCDylXpIsDAonE+CgsAoHzi3x48yrVPnuUa62KqLtqia9paFaxynIY5yXEmhg3HcJ44ue6AQKglCPs+KTkrO76yAoX4FD+9j2gB-5WvCpiIsinhohiWKwWezwIUhUTvG8tB0AAqsMWovr8b4AlhCDMhoBTHLsJRsiUpgaMRCK3E27iNKu7T-kO8EQBAVBgAA7qxl4AE4UO8XxUDOlK8TkOinPCai2M4jrNOcQFVAgJFkca8lgVGAQ0Z6zz8AANugVgPk+RlcehJkRvIOGmHhf6EbY7ZQqB9Kgk0LQOKUynPIQGkMGAABuYC+UFqGvhhpnYXsuFGL4LpgfFjnyK0TiuHJXg+H4mV9NluUFUVaoasZeo1o1nA7u0ikYoK4mWg1biCaK6JqI0naNkpXkFqQ3X5YVE4lqSoU6mVEXQkupqss0ppRrszgphipydi4ooivytirp1m2aT1O2+mwZYVgdYaYasUKCZiUHuHa-K7KyKZzfWjqguinZ7CynldN5XWfdtRUjDQ8qDXOfHyCKpEXFGjbXci-KwzZ8OLUjK2o+9JCQGIE4-RwAM8RFtjHCQOjMiyWy2Jwgpbhsu4WnaLQYu0zPZVM6CoGAxUhWhh3hcNUU-m4niNN2hgptyvIWgKQoimK6Ly5pivKxQHN-SGXNHTWO5NkK3Z7KKlxItyKbS81xSig4ZqcM41sabbKssRzBNAwuEmaDyuyTXZ9L+80geOt2SZIlBEdRxQ8rKqq6qanH5VHCYmiuKUoK3K0LIZ44LhBznofh+tw6wKIgg6VYNAQGIfeqxXEXa0Y+H-gyDmcjanB-o0ourkYUISl356+djgyFWAmDjjHU6c+rgOV-IlxLpczJ9lCe72uLO4MlLB6y8e6MbSQW+9TvW-77txL7RPtzGs2hNDWX-LGJEzQeTUwandEgD0LbPVRD4ZmX9Co-z3uOFCatSqaw-JFSq0Uai+DqgbdsIo6j8kUFmR0C8eTug3s8KASswCYL-ixPaY9hpgXUB4aWrJtA+GKCmOyJAbIkQcBdMGzMWHK3Ydg4K3CCETyhPoIw7J7DtlFl2HssY1B-kHEwvoci2G7z-rERIyiiYoJIO0QwppRK+DaKidszlRY6HRLfNkLhmY9z7gPIevc9KcIAdYnIhhjB1B8N2ZsvNRqOlurGBB9gkHchQYYQIJ58CCAgHAaQcFwh4KGgQ00YE6QbGdFCSCUEKHOBtHoc0opTRNntMzSIxTCarDFGYCpXhRpaBqRyBQ25Jb7hlr4NGp4MakFHD3Tp8drSrnrLzfkZpInNk3A1LwvJUSTLFDyLwGw-FXhvHeBZlczQ2ntBJFQ2ghRSMNo5ECZx+TsnpCKEW8Jmb0QIBciMxhBJeBodnGoGxJKOWcjJFElFMQmB+apdSWldL-JrE0XkzomxeBaAJFoUlSIyVcq9dya137Dj8gFVFBDUQ7kGdFdkApuRh1ntURKdRkqNAPOlN+0yP5bV6lSombRlD8x8RmEWUYTApkPAUEUy83ASV5owsl55WaiEFasaE6hii+FXOiXYYF2gph2XUay+sF68wZQXVhGqFBgQaXse1FRUZPM5Pq-m6J7RgX0FGNpxjSD+P7oPYeOlbVHAcaK+pgodDVJKK6kZtp7RL2JavC4aDt7mPVdxF21LynglKHnXVC8boNTTFQzMbQ6G5mVby4cpiFFhvPnWdw3htBTxFFCbRnYk4bH0f2bkjDAhAA */
  initial: "main",
  context: {
    holistic: undefined,
  },
  states: {
    main: {
      on: {
        NEWLEVEL: "newLevel", // move to new level
        PLAY: "play", // move to play
        SETTINGS: "settings", // move to settings
        ADMIN: "admin", // move to admin
        NEWGAME: "newGame", //move to new game
        STORYEDITOR: "storyEditor", //move to story editor
        LEVELSELECT: "levelSelect", //move to edit level
        GAMESELECT: "gameSelect"
      },
    },

    test: {
      on: {
        NEWLEVEL: "newLevel"
      }
    },

    settings: {
      on: {
        MAIN: "main", // move to home
      },
    },

    admin: {
      on: {
        MAIN: "main", // move to home
        ADDNEWUSER: "addNewUser", // move to add new user
      },
    },

    addNewUser: {
      on: {
        ADMIN: "admin", // move to admin
      },
    },

    play: {
      on: {
        MAIN: "main", // move to home
      },
    },

    newLevel: {
      on: {
        MAIN: "main", // move to home
        EDIT: "edit", // move to edit
        NEWGAME: "newGame", // Go back to Game editor after previewing a level
        LEVELSELECT: "levelSelect", // Go back to Game editor after previewing a level from the +Add Conjecture part
        TEST: "test"
      },
    },

    edit: {
      on: {
        NEWLEVEL: "newLevel", // move to new level
      },
    },

    newGame : {
      on: {
        MAIN: "main", // move to home
        LEVELSELECT: "levelSelect", // move to conjecture selector
        NEWLEVEL: "newLevel", // preview a level in the game editor
        STORYEDITOR: "storyEditor", // move to story editor
      },
    },

    storyEditor : {
      on: {
        MAIN: "main", //move to home
        NEWGAME: "newGame" // Go back to Game editor after editing dialogues
      }
    },

    levelSelect: {
      on: {
        NEWLEVEL: "newLevel", // move to new level
        NEWGAME: "newGame", // move to new game
        MAIN: "main", // move to home
      }
    },

    gameSelect: {
      on: {
        NEWGAME: "newGame", // move to new game
        MAIN: "main", // move to home
        PLAY: "play",
      }
    }
  }
});
