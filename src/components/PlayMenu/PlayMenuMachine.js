import { createMachine, assign } from "xstate";

export const PlayMenuMachine = createMachine({
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
      },
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
    },
  }
});
