import Button from "../Button";
import PlayGameMachine from "./PlayGameMachine";
import { white, red } from "../../utils/colors";
import { useMachine } from "@xstate/react";
import { useEffect, useState } from "react";
import LevelPlay from "../LevelPlayModule/LevelPlay";
import { Curriculum } from "../CurricularModule/CurricularModule";
import usePoseData from "../utilities/PoseData";

const PlayGame = (props) => {
  const [shownIntros, setShownIntros] = useState(new Set());
  const markIntroShown = (chapterIdx) => {
    setShownIntros((prev) => new Set(prev).add(chapterIdx));
  };
  const hasShownIntro = (chapterIdx) => shownIntros.has(chapterIdx);

  const { columnDimensions, rowDimensions, height, width, backCallback, gameUUID} = props;
  const poseData = usePoseData();

  const uuidsList = Curriculum.getCurrentConjectures();

  const [state, send] = useMachine(() => PlayGameMachine(uuidsList));
  const uuidIDX = state.context.uuidIndex;

  return (
    <>
      {state.value === "idle" && uuidIDX < uuidsList.length && (
        <LevelPlay
          key={uuidsList[uuidIDX]['UUID']}
          width={width}
          height={height}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          poseData={poseData}
          mainCallback={backCallback}
          UUID={uuidsList[uuidIDX]['UUID']}
          currentConjectureIdx={uuidIDX}
          onLevelComplete={() => send("LOAD_NEXT")}
          needBack={false}
          hasShownIntro={hasShownIntro}
          markIntroShown={markIntroShown}
          gameID={gameUUID}
        />
      )}

      {state.value === "end" && (
        <Button
          width={width * 0.20}
          x={width * 0.5}
          y={height * 0.5}
          color={red}
          fontSize={width * 0.02}
          fontColor={white}
          text={"Back"}
          fontWeight={800}
          callback={backCallback}
        />
      )}
    </>
  );
};

export default PlayGame;
