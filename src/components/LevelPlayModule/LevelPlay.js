import { useMachine } from "@xstate/react";
import { useState, useEffect } from "react";
import ExperimentalTask from "../ExperimentalTask";
import LevelPlayMachine from "./LevelPlayMachine";
import ConjecturePoseContainter from "../ConjecturePoseMatch/ConjecturePoseContainer"
import VideoRecorder from "../VideoRecorder";
import { getConjectureDataByUUID, writeToDatabaseIntuitionStart, writeToDatabaseIntuitionEnd } from "../../firebase/database";
import Chapter from "../Chapter";
import Tween from "../Tween";

const LevelPlay = (props) => {
  const {
    columnDimensions,
    poseData,
    rowDimensions,
    debugMode,
    onLevelComplete,
    UUID,
    width,
    height,
    backCallback,
    currentConjectureIdx,
    curricularID,
    gameID,
    hasShownIntro,
    markIntroShown,
  } = props;

  if (!UUID || currentConjectureIdx === undefined || isNaN(currentConjectureIdx)) {
    console.warn("🚫 Skipping render — invalid UUID or chapter index", { UUID, currentConjectureIdx });
    return null;
  }

  const [state, send] = useMachine(LevelPlayMachine);
  const [experimentText, setExperimentText] = useState(
    `Read the following aloud:\n\nFigure it out? \n\n Answer TRUE or FALSE?`
  );
  const [conjectureData, setConjectureData] = useState(null);
  const [poses, setPoses] = useState(null);
  const [tweenText, setTweenText] = useState('');
  // const [showTweenText, setShowTweenText] = useState(false); // 👈 REMOVED

  useEffect(() => {
    console.log("🎮 LevelPlay state:", state.value);
  }, [state.value]);

  useEffect(() => {
    if (state.value === "introDialogue" && hasShownIntro(currentConjectureIdx)) {
      console.log("🚪 Auto-skipping introDialogue because it's already shown.");
      send("NEXT");
    }
  }, [state.value, hasShownIntro, currentConjectureIdx]);

  const getTolerance = (poseData) => {
    const tolerance = poseData['tolerance'] || null;
    if (tolerance != null) {
      return parseInt(tolerance.replace('%', ''));
    }
    return null;
  }

  useEffect(() => {
    if (UUID != null) {
      const fetchData = async () => {
        try {
          const data = await getConjectureDataByUUID(UUID);
          setConjectureData(data);
          console.log("📦 Loaded Conjecture Data:", data);
        } catch (error) {
          console.error('Error getting data: ', error);
        }
      };
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (conjectureData != null) {
      const startPose = JSON.parse(conjectureData[UUID]['Start Pose']['poseData']);
      const intermediatePose = JSON.parse(conjectureData[UUID]['Intermediate Pose']['poseData']);
      const endPose = JSON.parse(conjectureData[UUID]['End Pose']['poseData']);
      const startTolerance = getTolerance(conjectureData[UUID]['Start Pose']);
      const intermediateTolerance = getTolerance(conjectureData[UUID]['Intermediate Pose']);
      const endTolerance = getTolerance(conjectureData[UUID]['End Pose']);
      startPose["tolerance"] = startTolerance;
      intermediatePose["tolerance"] = intermediateTolerance;
      endPose["tolerance"] = endTolerance;

      const arr = [startPose, intermediatePose, endPose];
      setPoses(arr);
    }
  }, [conjectureData]);

  useEffect(() => {
    if (state.value === "intuition") {
      setExperimentText(
        `Read the following ALOUD:\n\n${conjectureData[UUID]['Text Boxes']['Conjecture Description']}\n\n Answer: TRUE or FALSE?`
      );
      writeToDatabaseIntuitionStart(gameID);
    } else if (state.value === "insight") {
      setExperimentText(
        `Alright! Explain WHY :\n\n${conjectureData[UUID]['Text Boxes']['Conjecture Description']}\n\n is TRUE or FALSE?`
      );
      writeToDatabaseIntuitionEnd(gameID);
    }
  }, [state.value]);

  useEffect(() => {
    // This now correctly sets the text for the Tween component
    if (state.value === "tween") {
        setTweenText("Watch the character and match the movement!");
    } else {
        // It's good practice to clear it when not in use
        setTweenText('');
    }
  }, [state.value]);


  return (
    <>
      <VideoRecorder
        phase={state.value}
        curricularID={UUID}
        gameID={gameID}
      />

      {state.value === "introDialogue" &&
        !hasShownIntro(currentConjectureIdx) &&
        conjectureData && conjectureData[UUID] && (
          <Chapter
            key={`chapter-${UUID}-intro`}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            height={height}
            width={width}
            chapterConjecture={conjectureData[UUID]}
            currentConjectureIdx={currentConjectureIdx}
            nextChapterCallback={() => {
              markIntroShown(currentConjectureIdx);
              send("NEXT");
            }}
            isOutro={false}
          />
        )}

       

      {state.value === "tween" && poses != null && (
        <Tween
          poses={poses}
          duration={2000}
          width={width}
          height={height}
          loop={3}
          text={tweenText} 
          onComplete={() => send("NEXT")}
        />
      )}
      {state.value === "poseMatching" && poses != null && (
        <>
          <ConjecturePoseContainter
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            poseData={poseData}
            mainCallback={backCallback}
            UUID={UUID}
            onCompleteCallback={() => { send("NEXT") }}
            poses={poses}
            gameID={gameID}
          />
        </>
      )}
      {state.value === "intuition" && (
        <ExperimentalTask
          width={width}
          heigh={height}
          prompt={experimentText}
          columnDimensions={columnDimensions}
          poseData={poseData}
          UUID={UUID}
          rowDimensions={rowDimensions}
          onComplete={() => send("NEXT")}
          cursorTimer={debugMode ? 1000 : 10000}
          gameID={gameID}
        />)}
      {state.value === "insight" && (
        <ExperimentalTask
          prompt={experimentText}
          columnDimensions={columnDimensions}
          poseData={poseData}
          UUID={UUID}
          rowDimensions={rowDimensions}
          onComplete={() => send("NEXT")}
          cursorTimer={debugMode ? 1000 : 5000}
          gameID={gameID}
        />
      )}
      {state.value === "outroDialogue" && conjectureData && conjectureData[UUID] && (
        <Chapter
          key={`chapter-${UUID}-outro`}
          poseData={poseData}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          height={height}
          width={width}
          chapterConjecture={conjectureData[UUID]}
          currentConjectureIdx={currentConjectureIdx}
          nextChapterCallback={onLevelComplete}
          isOutro={true}
        />
      )}
    </>
  );
};

export default LevelPlay;