import { useMachine } from "@xstate/react";
import { useState, useEffect } from "react";
import ExperimentalTask from "../ExperimentalTask";
import LevelPlayMachine from "./LevelPlayMachine";
import ConjecturePoseContainter from "../ConjecturePoseMatch/ConjecturePoseContainer"
import { getConjectureDataByUUID, writeToDatabaseIntuitionStart, writeToDatabaseIntuitionEnd } from "../../firebase/database";

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
    backCallback
  } = props;
  
  const [state, send] = useMachine(LevelPlayMachine);
  const [experimentText, setExperimentText] = useState(
    `Read the following aloud:\n\nFigure it out? \n\n Answer TRUE or FALSE?`
  ); 
  const [conjectureData, setConjectureData] = useState(null);
  const [poses, setPoses] = useState(null);

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
          cursorTimer={debugMode ? 1_000 : 10_000}
        /> )}
        {state.value === "insight" && (
        <ExperimentalTask
          prompt={experimentText}
          columnDimensions={columnDimensions}
          poseData={poseData}
          UUID={UUID}
          rowDimensions={rowDimensions}
          onComplete={onLevelComplete}
          cursorTimer={debugMode ? 1_000 : 30_000}
        />
      )}
    </>
  );
};

export default LevelPlay;
