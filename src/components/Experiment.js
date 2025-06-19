import { useMachine } from "@xstate/react";
import ExperimentMachine from "../machines/experimentMachine";
import { Graphics } from "@inlet/react-pixi";
import { useCallback, useState, useEffect } from "react";
import { darkGray, yellow } from "../utils/colors";
import PoseMatching from "./PoseMatching";
import VideoPlayer from "./VideoPlayer";
import ExperimentalTask from "./ExperimentalTask";
import { getPoseData } from "../models/conjectures";

const Experiment = (props) => {
  const {
    columnDimensions,
    poseData,
    rowDimensions,
    onComplete,
    debugMode,
    conjectureData,
    currentConjectureIdx,
    gameID
  } = props;
  const [state, send, service] = useMachine(ExperimentMachine);
  const [experimentText, setExperimentText] = useState(
    `Read the following aloud:\n\n${conjectureData.conjecture} \n\n Answer TRUE or FALSE?`
  );
  const [conjecturePoses, setConjecturePoses] = useState("");
  useEffect(() => {
    setConjecturePoses(getPoseData(conjectureData.poseDataFileName));
  }, [conjectureData.poseDataFileName]);

  const drawModalBackground = useCallback((g) => {
    g.beginFill(darkGray, 0.9);
    g.drawRect(0, 0, window.innerWidth, window.innerHeight);
    g.endFill();
    const col1 = columnDimensions(1);
    g.beginFill(yellow, 1);
    g.drawRect(col1.x, col1.y, col1.width, col1.height);
    const col3 = columnDimensions(3);
    g.drawRect(col3.x, col3.y, col3.width, col3.height);
    g.endFill();
  }, []);

  useEffect(() => {
    if (state.value === "intuition") {
      setExperimentText(
        `Read the following ALOUD:\n\n${conjectureData.conjecture} \n\n Answer: TRUE or FALSE?`
      );
    } else if (state.value === "insight") {
      setExperimentText(
        `Alright! Explain WHY :\n\n ${conjectureData.conjecture.toLowerCase()} \n\n is TRUE or FALSE?`
      );
    }
  }, [state.value]);

  const handleUserKeyPress = useCallback((event) => {
    const { _, keyCode } = event;
    // keyCode 78 is n
    if (keyCode === 78) {
      send("NEXT");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleUserKeyPress);
    return () => {
      window.removeEventListener("keydown", handleUserKeyPress);
    };
  }, [handleUserKeyPress]);

  return (
    <>
      {state.value === "videoPlaying" && (
        <VideoPlayer
          onComplete={() => send("NEXT")}
          columnDimensions={columnDimensions}
          videoPath={conjectureData.videoPath}
        />
      )}
      {state.value === "poseMatching" && (
        <>
          <Graphics draw={drawModalBackground} />
          <PoseMatching
            poseData={poseData}
            posesToMatch={[
              conjecturePoses.poses,
              conjecturePoses.poses,
              conjecturePoses.poses,
            ].flat()}
            columnDimensions={columnDimensions}
            onComplete={() => send("NEXT")}
          />
        </>
      )}
      {state.value === "intuition" && (
        <ExperimentalTask
          prompt={experimentText}
          columnDimensions={columnDimensions}
          poseData={poseData}
          rowDimensions={rowDimensions}
          onComplete={() => send("NEXT")}
          cursorTimer={debugMode ? 1_000 : 10_000}
          currentConjectureIdx={currentConjectureIdx}
          gameID={gameID}
        />
      )}
      {state.value === "insight" && (
        <ExperimentalTask
          prompt={experimentText}
          columnDimensions={columnDimensions}
          poseData={poseData}
          rowDimensions={rowDimensions}
          onComplete={onComplete}
          cursorTimer={debugMode ? 1_000 : 30_000}
          currentConjectureIdx={currentConjectureIdx}
          gameID={gameID}
        />
      )}
    </>
  );
};

export default Experiment;
