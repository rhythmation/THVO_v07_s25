import {
  matchSegmentToLandmarks,
  segmentSimilarity,
} from "./Pose/pose_drawing_utilities";
import { enrichLandmarks } from "./Pose/landmark_utilities";
import ErrorBoundary from "./utilities/ErrorBoundary.js";
import Pose from "./Pose/index.js";
import { useState, useEffect, useMemo } from "react";
import { Text, Container } from "@inlet/react-pixi";
import { white } from "../utils/colors";
import { writeToDatabasePoseMatch, writeToDatabasePoseStart, } from "../firebase/database.js";
import { uniqueId } from "xstate/lib/utils.js";

let poseNumber = 1;

const PoseMatching = (props) => {
  const { posesToMatch, columnDimensions, onComplete, UUID } = props;
  
  const poseNumberStr = "Pose";
  const context = posesToMatch.map((x) => {    
    return { text: "Match the pose on the left!" };
  });
  const [text, setText] = useState("Match the pose on the left!");
  const modelColumn = columnDimensions(1);
  const col2Dim = columnDimensions(2);
  const playerColumn = columnDimensions(3);
  const [poses, setPoses] = useState([]);
  const [transition, setTransition] = useState(false);
  const [firstPose, setFirstPose] = useState(true);
  const [currentPose, setCurrentPose] = useState({});
  const [poseMatchData, setPoseMatchData] = useState({});
  const [poseSimilarity, setPoseSimilarity] = useState([]);
  const textColor = white;
  const matchConfig = [
    {"segment": "RIGHT_BICEP", "data": "poseLandmarks"}, 
    {"segment": "RIGHT_FOREARM", "data": "poseLandmarks"},
    {"segment": "LEFT_BICEP", "data": "poseLandmarks"}, 
    {"segment": "LEFT_FOREARM", "data": "poseLandmarks"}
  ]
  // on mount, create an array of the poses that will be used in the tutorial
  useEffect(() => {
    setPoses(posesToMatch);
    setCurrentPose(posesToMatch[0]);
  }, []);

  // monitor the state value -- when you get to a running state, update the current
  // pose for the model to emulate. If there are no more poses to emulate,
  // update the current pose with nothing
  useEffect(() => {
    if (poses.length > 0 && !transition) {
      writeToDatabasePoseStart(poseNumberStr + " " + poseNumber, UUID);
      if (firstPose) {
        setFirstPose(false);
      }
      const currentPoseData = poses.shift();
      const matchData = matchConfig.map((config) => {
        return {
          ...config,
          landmarks: matchSegmentToLandmarks(
            config,
            currentPoseData,
            modelColumn
          ),
        };
      });
      setCurrentPose(enrichLandmarks(currentPoseData));
      setPoseMatchData(matchData);
      setPoses(poses);
    }
  }, [poses, transition]);

  // if there is a pose to match, calculate the similarity between the player's current
  // pose and the model pose (foreach segment to be matched). Set the similarity scores
  // into a variable to be monitored
  useEffect(() => {
    if (!transition) {
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
    if (!firstPose) {
      let similarityThreshold = 45;
      // if there is a tolerance for the pose, use that as the threshold
      if (currentPose.tolerance != null && !isNaN(currentPose.tolerance)) {
        similarityThreshold = currentPose.tolerance;
      }
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
        // write the match to the database
        writeToDatabasePoseMatch(poseNumberStr + " " + poseNumber);
        poseNumber++;
        // move to next state and reset pose similarity
        if (poses.length === 0 && !firstPose) {
          poseNumber = 1;
          setTransition(true);
          setPoseSimilarity([{ similarityScore: 0 }]);
          setText("Great!");
          setTimeout(() => {
            console.log("moved to next step");
            setTransition(false);
            onComplete();
          }, 1000);
        }
        else {
          setTransition(true);
          setPoseSimilarity([{ similarityScore: 0 }]);
          setText("Great!");
          setTimeout(() => {
            setText("Match the pose on the left!");
            setTransition(false);
        }, 1000);
        }
      }
    }
  }, [poseSimilarity]);

  return (
    <Container>
      <ErrorBoundary>
        <Pose poseData={currentPose} colAttr={modelColumn} />
        <Text
          text={text}
          y={col2Dim.height / 2}
          x={col2Dim.x + col2Dim.margin}
          style={
            new PIXI.TextStyle({
              align: "center",
              fontFamily: "Futura",
              fontSize: "4em",
              fontWeight: 800,
              fill: [textColor],
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
      </ErrorBoundary>
    </Container>
  );
};

export default PoseMatching;
