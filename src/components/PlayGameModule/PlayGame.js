import Button from "../Button";
import PlayGameMachine from "./PlayGameMachine";
import { useMachine } from "@xstate/react";
import { useEffect, useState } from "react";
import LevelPlay from "../LevelPlayModule/LevelPlay";
import { Curriculum } from "../CurricularModule/CurricularModule";
import usePoseData from "../utilities/PoseData";
import { Text, Container } from "@inlet/react-pixi";
import RectButton from "../RectButton";
import { green, black, white, red } from "../../utils/colors";
import PixiLoader from "../utilities/PixiLoader";

const PlayGame = (props) => {
  const [shownIntros, setShownIntros] = useState(new Set());
  const markIntroShown = (chapterIdx) => {
    setShownIntros((prev) => new Set(prev).add(chapterIdx));
  };
  const hasShownIntro = (chapterIdx) => shownIntros.has(chapterIdx);

  const { columnDimensions, rowDimensions, height, width, backCallback, gameUUID} = props;
  const {poseData, canPlay, error, retryInitialization} = usePoseData();

  const uuidsList = Curriculum.getCurrentConjectures();

  // Edge case handler: if no levels, redirect back
  useEffect(() => {
    if (uuidsList.length === 0) {
      alert("This Game contains no levels that can be played!");
      backCallback?.();
    }
  }, [uuidsList, backCallback]);

  const [state, send] = useMachine(() => PlayGameMachine(uuidsList));
  const uuidIDX = state.context.uuidIndex;

  if (error) {
    // Show error + retry button
    return (
      <Container>
        <Text
          text={error}
          x={width / 2}
          y={height / 2 - 30}
          anchor={0.5}
          style={{
            fill: 0xff5555,
            fontSize: 24,
            fontWeight: "bold",
            fontFamily: "Arial",
            align: "center",
          }}
        />
        <RectButton
          x={width / 2 - 100}
          y={height / 2 + 10}
          width={500}
          height={100}
          color={green}
          alpha={0.8}
          text="Retry"
          fontSize={18}
          fontColor={0xffffff}
          fontWeight="bold"
          callback={retryInitialization}
        />
        <RectButton
          x={width / 2 - 100}
          y={height / 2 + 75}
          width={500}
          height={100}
          color={black}
          alpha={0.8}
          text="Back"
          fontSize={18}
          fontColor={white}
          fontWeight="bold"
          callback={backCallback}
        />
      </Container>
    );
  } else if (!canPlay) {
    // Show initializing / loading message
    return (
      <Container>
        <PixiLoader width={width} height={height} />
        <Text
          text="Trying to initialize devices..."
          x={width / 2}
          y={height / 2 + 100}
          anchor={0.5}
          style={{
            fill: 0xffffff,
            fontSize: 24,
            fontWeight: "bold",
            fontFamily: "Arial",
            align: "center",
          }}
        />
      </Container>
    );
  }

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
