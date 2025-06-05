import Tutorial from "./Tutorial.js";
import { Container } from "@inlet/react-pixi";
import Chapter from "./Chapter.js";
import { useState, useEffect } from "react";
import { conjectures } from "../models/conjectures.js";
import Latin from "./utilities/latin_square";
import { useMachine, useSelector } from "@xstate/react";
// import { useSelector } from "@xstate";
import GameMachine from "../machines/gameMachine.js";
import Intervention from "./Intervention.js";

const reorder = (array, indices) => {
  return indices.map((idx) => array[idx - 1]);
};

const context = {
  

  context: {
    conjectures: [0, 1, 2, 3, 4, 5, 6, 7],
    currentConjectureIdx: 0,
    conjectureIdxToIntervention: 4,
  },
};
const selectCurrentConjectureIdx = (state) =>
  state.context.currentConjectureIdx;

const Game = (props) => {

  const { columnDimensions, rowDimensions, poseData, height, width } = props;
  const [chapterConjecture, setChapterConjecture] = useState([]);

  const [renderDialogue, setRenderDialogue] = useState(true);
  const [performTutorial, setPerformTutorial] = useState(false);
  // const [performTutorial, setPerformTutorial] = useState(false);
  const [allConjectures, setAllConjectures] = useState([]);
  const [state, send, service] = useMachine(GameMachine, context);
  const currentConjectureIdx = useSelector(service, selectCurrentConjectureIdx);

  useEffect(() => {
    const numConjectures = conjectures.length;
    const latinSquare = new Latin(numConjectures);
    const queryParams = new URLSearchParams(window.location.search);
    let condition = 0;
    if (queryParams.has("condition")) {
      condition = parseInt(queryParams.get("condition"));
    }
    const conjectureOrder =
      condition < numConjectures
        ? latinSquare.square[condition]
        : latinSquare.square[0];
    let orderedConjectures = reorder(conjectures, conjectureOrder);
    if (queryParams.has("conjecture")) {
      const conjectureStart = parseInt(queryParams.get("conjecture"));
      setPerformTutorial(false);
      send({
        type: "SET_CURRENT_CONJECTURE",
        currentConjectureIdx: conjectureStart - 1,
      });
    }
    setAllConjectures(orderedConjectures);
  }, []);

  useEffect(() => {
    setChapterConjecture(allConjectures[currentConjectureIdx]);
    // since allConjectures is also set asyncronously, monitor
    // allConjectures and currentConjectureIdx to update chapterConjecture
  }, [allConjectures, currentConjectureIdx]);

  return (
    <Container>
      {renderDialogue && (
        <Chapter
          poseData={poseData}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          height={height}
          width={width}
          chapterConjecture={chapterConjecture}
          currentConjectureIdx={currentConjectureIdx}
          nextChapterCallback={() => {
            setRenderDialogue(false); // hide this scene after it's done
            send("NEXT"); // continue the game
          }}
        />
      )}
      {!renderDialogue && performTutorial && (
        <Tutorial
          poseData={poseData}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          onComplete={() => {
            setPerformTutorial(false);
            send("NEXT");
          }}
        />
      )}
      {!renderDialogue && !performTutorial && state.value === "chapter" && (
        <Chapter
          poseData={poseData}
          columnDimensions={props.columnDimensions}
          rowDimensions={props.rowDimensions}
          height={height}
          width={width}
          chapterConjecture={chapterConjecture}
          currentConjectureIdx={state.context.currentConjectureIdx}
          nextChapterCallback={() => send("NEXT")}
        />
      )}
      {!renderDialogue && !performTutorial && state.value === "intervention" && (
        <Intervention triggerNextChapter={() => send("NEXT")} />
      )}
    </Container>
  );
};

export default Game;
