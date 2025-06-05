import { useMachine } from "@xstate/react";
import { useState, useEffect } from "react";
import ExperimentalTask from "../ExperimentalTask";
import LevelPlayMachine from "./LevelPlayMachine";
import ConjecturePoseContainter from "../ConjecturePoseMatch/ConjecturePoseContainer"
import VideoRecorder from "../VideoRecorder";
import { getConjectureDataByUUID, writeToDatabaseIntuitionStart, writeToDatabaseIntuitionEnd } from "../../firebase/database";
import Chapter from "../Chapter";



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
  
    useEffect(() => {
      console.log("🎮 LevelPlay state:", state.value); // ← Debug log 3
    }, [state.value]);

    // ✅ Auto-skip introDialogue if it's already been shown
    useEffect(() => {
      if (state.value === "introDialogue" && hasShownIntro(currentConjectureIdx)) {
        console.log("🚪 Auto-skipping introDialogue because it's already shown.");
        send("NEXT");
      }
    }, [state.value, hasShownIntro, currentConjectureIdx]);


  // Get tolerance from the pose data 
  const getTolerance = (poseData) => {
    const tolerance = poseData['tolerance'] || null;
    if (tolerance != null){
      // Stored in database as a num% so replace
      return parseInt(tolerance.replace('%', ''));
    }
    return null;
  }

  useEffect(() => {
    // First action, get database data is there is a UUID and set Conjecture Data
    if(UUID != null){
      const fetchData = async () => {
        try {
          const data = await getConjectureDataByUUID(UUID);
          setConjectureData(data);
          console.log("📦 Loaded Conjecture Data:", data); // ← Debug log 4
        } catch (error) {
          console.error('Error getting data: ', error);
        }
      };
      fetchData();
    }
  }, []);

useEffect(() => {
  if (conjectureData != null) {
    // Database stores the conjecture data as UUID -> Pose Position -> 'poseData'
    const startPose = JSON.parse(conjectureData[UUID]['Start Pose']['poseData']);
    const intermediatePose = JSON.parse(conjectureData[UUID]['Intermediate Pose']['poseData']);
    const endPose = JSON.parse(conjectureData[UUID]['End Pose']['poseData']);
    // Tolerance is stored on UUID -> Pose position
    const startTolerance = getTolerance(conjectureData[UUID]['Start Pose']);
    const intermediateTolerance = getTolerance(conjectureData[UUID]['Intermediate Pose']);
    const endTolerance = getTolerance(conjectureData[UUID]['End Pose']);
    // Set tolerance on the pose objects as PoseMatching accesses the tolerance at a different level
    startPose["tolerance"] = startTolerance;
    intermediatePose["tolerance"] = intermediateTolerance;
    endPose["tolerance"] = endTolerance;

    const arr = [startPose, intermediatePose, endPose];
    setPoses(arr);
  }

}
, [conjectureData]);

  useEffect(() => {
    // Intuition is reading the conjecture
    if (state.value === "intuition") {
      setExperimentText(
        `Read the following ALOUD:\n\n${conjectureData[UUID]['Text Boxes']['Conjecture Description']}\n\n Answer: TRUE or FALSE?`
      );
      writeToDatabaseIntuitionStart();
    // Insight is explaining why
    } else if (state.value === "insight") {
      setExperimentText(
        `Alright! Explain WHY :\n\n${conjectureData[UUID]['Text Boxes']['Conjecture Description']}\n\n is TRUE or FALSE?`
      );
      writeToDatabaseIntuitionEnd();
    }
  }, [state.value]);

  return (
    <>
    <VideoRecorder 
      phase={state.value} 
      // CurricularID and gameID not functional at this moment 
      curricularID={UUID} // This is working correctly now!
      gameID={conjectureData?.[UUID]?.GameID} // This is not working
    />
    
    {/* ✅ Debug: Checking if intro should show */}
    {/*{console.log("👁️ Should render intro?", {
      state: state.value,
      hasShown: hasShownIntro(0)
    })}*/}
    
    {state.value === "introDialogue" &&
      !hasShownIntro(currentConjectureIdx) && // assuming chapter index 0 for now
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
            markIntroShown(currentConjectureIdx); // mark this chapter's intro as shown
            send("NEXT");
          }}
          isOutro={false}
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
            onCompleteCallback={() => {send("NEXT")}}
            poses={poses}
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
        /> )}
        {state.value === "insight" && (
        <ExperimentalTask
          prompt={experimentText}
          columnDimensions={columnDimensions}
          poseData={poseData}
          UUID={UUID}
          rowDimensions={rowDimensions}
          onComplete={() => send("NEXT")}
          cursorTimer={debugMode ? 1000 : 5000} //moved insight phase to 5 seconds for testing
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