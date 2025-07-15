import ErrorBoundary from "./utilities/ErrorBoundary.js";
import Pose from "./Pose/index.js";
import { useState, useEffect } from "react";
import { useMachine } from "@xstate/react";
import TutorialMachine from "../machines/tutorialMachine";
import { Text, Container } from "@inlet/react-pixi";
import { blue } from "../utils/colors";
import { TextStyle } from "@pixi/text";
import cursorPoseData from "../models/rawPoses/cursorPose.json";
import tutorialPoseData from "../models/rawPoses/tutorialPoses.json";
import { enrichLandmarks } from "./Pose/landmark_utilities";
import { calculateFaceDepth } from "./Pose/landmark_utilities"; // new
import {
  matchSegmentToLandmarks,
  segmentSimilarity,
} from "./Pose/pose_drawing_utilities";
import CursorMode from "./CursorMode.js";

const Tutorial = (props) => {
  const [state, send] = useMachine(TutorialMachine);
  const { text } = state.context;
  const modelColumn = props.columnDimensions(1);
  const col2Dim = props.columnDimensions(2);
  const playerColumn = props.columnDimensions(3);
  const [poses, setPoses] = useState([]);
  const [currentPose, setCurrentPose] = useState({});
  const [poseMatchData, setPoseMatchData] = useState({});
  const [poseSimilarity, setPoseSimilarity] = useState([]);

  // on mount, create an array of the poses that will be used in the tutorial

  // This detects when the user is too close and trips a warning
  useEffect(() => {

    setPoses([...tutorialPoseData.poses, cursorPoseData]);
  }, []);
  useEffect(() => {
    if (props.poseData && props.poseData.poseLandmarks) {
      const depth = calculateFaceDepth(props.poseData.poseLandmarks);
      // console.log lets you see the depth in youre browsers console; ctrl + shift + i
      // console.log(depth)
      if (depth < -4) { // You can change the negative integer lower for closer range
        console.warn("Warning: You are too close to the camera!");
      }
    }
  }, [props.poseData]);

  // monitor the state value -- when you get to a running state, update the current
  // pose for the model to emulate. If there are no more poses to emulate,
  // update the current pose with nothing
  useEffect(() => {
    if (state.matches("running")) {
      if (poses.length > 0) {
        const currentPoseData = poses.shift();
        const matchData = currentPoseData.matchingConfig.map((config) => {
          return {
            ...config,
            landmarks: matchSegmentToLandmarks(
              config,
              currentPoseData.landmarks,
              modelColumn
            ),
          };
        });
        setCurrentPose(enrichLandmarks(currentPoseData.landmarks));
        setPoseMatchData(matchData);
        setPoses(poses);
      } else {
        setPoses([]);
        setPoseMatchData({});
        setCurrentPose({});
      }
    }
    if (state.matches("final")) {
      props.onComplete();
    }
  }, [state.value]);
  
  // if there is a pose to match, calculate the similarity between the player's current
  // pose and the model pose (foreach segment to be matched). Set the similarity scores
  // into a variable to be monitored
  useEffect(() => {
    if (!state.matches("transition")) {
      if (
        poseMatchData &&
        Object.keys(poseMatchData).length > 0 &&
        props.poseData.poseLandmarks
      ) {
        // extract segment from the larger player pose dataset
        const convertedLandmarks = poseMatchData.map((segmentSet) => {
          return {
            segment: segmentSet.segment,
            landmarks: matchSegmentToLandmarks(
              segmentSet,
              props.poseData,
              playerColumn
            ),
          };
        });
        // then compare similarity between modelSet and playerSet
        const similarityScores = poseMatchData.map((segmentSet) => {
          const playerSet = convertedLandmarks.filter(
            (convertedLandmarks) =>
              convertedLandmarks.segment === segmentSet.segment
          )[0].landmarks;
          const modelSet = segmentSet.landmarks;
          const similarityScore = segmentSimilarity(playerSet, modelSet);
          // collect similarity score for comparison in this component
          // collect segment name to use similarity score for visual feedback (color)
          // in player pose
          return { segment: segmentSet.segment, similarityScore };
        });
        setPoseSimilarity(similarityScores);
      } else {
        setPoseSimilarity([{ similarityScore: 0 }]);
      }
    }
  }, [props.poseData]);

  // Every time the pose is updated, check to see whether the player's pose is above
  // the threshold for similarity to the model pose. If it is, then transition to the
  // next state. If not, stay in the same state
  useEffect(() => {
    const similarityThreshold = 45;
    const similarityScore = poseSimilarity.reduce(
      (previousValue, currentValue) => {
        // all segments need to be over the threshold -- will only return true if
        // all are over threshold
        return (
          previousValue && currentValue.similarityScore > similarityThreshold
        );
      },
      true
    );
    if (similarityScore) {
      // move to next state and reset pose similarity
      send("NEXT");
      setPoseSimilarity([{ similarityScore: 0 }]);
    }
  }, [poseSimilarity]);

  return (
    <Container>
      <ErrorBoundary>
        <Pose poseData={currentPose} colAttr={modelColumn} />
        <Text
          text={text}
          y={col2Dim.y + col2Dim.height / 4}
          x={col2Dim.x}
          style={
            new TextStyle({
              align: "center",
              fontFamily: "Futura",
              fontSize: "5em",
              fontWeight: 800,
              fill: [blue],
              wordWrap: true,
              wordWrapWidth: col2Dim.width,
            })
          }
        />
        <Pose
          poseData={props.poseData}
          colAttr={playerColumn}
          similarityScores={poseSimilarity}
        />
        {state.context.currentStepIndex === 6 && (
          <CursorMode
            poseData={props.poseData}
            rowDimensions={props.rowDimensions}
            callback={() => send("NEXT")}
            colAttr={playerColumn}       
          />
        )}
      </ErrorBoundary>
    </Container>
  );
};

export default Tutorial;
