import { useEffect, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic/holistic";
import Loader from "./utilities/Loader.js";
import Game from "./Game.js";
import Home from "./Home.js";
import { useMachine } from "@xstate/react";
import { StoryMachine } from "../machines/storyMachine.js";
import { Stage } from "@inlet/react-pixi";
import { yellow } from "../utils/colors";
import { generateRowAndColumnFunctions } from "./utilities/layoutFunction";
import { enrichLandmarks } from "./Pose/landmark_utilities";
import firebase from "firebase/compat";
import "firebase/compat/auth";
import PoseAuthoring from "./PoseAuth/PoseAuthoring.js";
import ConjectureModule from "./ConjectureModule/ConjectureModule.js";
import CurricularModule from "./CurricularModule/CurricularModule.js";
import ConjectureSelectorModule from "./ConjectureSelector/ConjectureSelectorModule.js";
import UserManagementModule from "./AdminHomeModule/UserManagementModule.js";
import NewUserModule from "./AdminHomeModule/NewUserModule.js";
import ConjecturePoseContainer from "./ConjecturePoseMatch/ConjecturePoseContainer.js";
import PlayMenu from "./PlayMenu/PlayMenu.js";
import Background from "./Background.js";
import { getUserRoleFromDatabase } from "../firebase/userDatabase.js";
import PoseTest from "./ConjectureModule/PoseTest.js";

const [
  numRows,
  numColumns,
  marginBetweenRows,
  marginBetweenColumns,
  columnGutter,
  rowGutter,
] = [2, 3, 20, 20, 30, 30];

const Story = () => {
  let holistic;
  // HACK: I should figure out a way to use xstate to migrate from loading to ready
  //  but b/c the async/await nature of the callbacks with Holistic, I'm leaving this hack in for now.
  const [loading, setLoading] = useState(true);
  const [poseData, setPoseData] = useState({});
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [state, send] = useMachine(StoryMachine);

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/signin";
    }
  });

  let [rowDimensions, columnDimensions] = generateRowAndColumnFunctions(
    width,
    height,
    numRows,
    numColumns,
    marginBetweenRows,
    marginBetweenColumns,
    columnGutter,
    rowGutter
  );

  useEffect(() => {
    window.addEventListener("resize", () => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
      [rowDimensions, columnDimensions] = generateRowAndColumnFunctions(
        width,
        height,
        numRows,
        numColumns,
        marginBetweenRows,
        marginBetweenColumns,
        columnGutter,
        rowGutter
      );
    });
    holistic = new Holistic({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      },
    });
    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: true,
      refineFaceLandmarks: true,
    });
    async function poseDetectionFrame() {
      await holistic.send({ image: videoElement });
      if (loading) {
        setLoading(false);
      }
    }

    const videoElement = document.getElementsByClassName("input-video")[0];
    let camera = new Camera(videoElement, {
      onFrame: poseDetectionFrame,
      width: window.innerWidth,
      height: window.innerHeight,
      facingMode: "environment",
    });
    camera.start();
    const updatePoseResults = (newResults) => {
      setPoseData(enrichLandmarks(newResults));
    };
    holistic.onResults(updatePoseResults);
  }, []);

  return (
    <>
      {loading && <Loader />}
      <Stage
        height={height}
        width={width}
        options={{
          antialias: true,
          autoDensity: true,
          backgroundColor: yellow,
        }}
      >
        {state.value === "ready" && (
          <Home
            width={width}
            height={height}
            startCallback={() => send("TOGGLE")}  // goes to the game
            conjectureCallback={() => {
              send("CONJECT");}
              }  // goes to the Conjecture Module
            logoutCallback={() => firebase.auth().signOut()} // logs the user out
            poseCallback={() => send("POSE")} // goes to the Pose tester
            curricularCallback={() => send("CURRICULAR")}
            testCallback={() => {
              send("TEST");}
              } // goes to the Test Module
            UserManagementCallback={() => {
              send("userManagementSettings");
              console.log("User Management");}
              } // goes to userManagement
          />
        )}
        {state.value === "curricular" && (
          <CurricularModule
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={() => send("CONJECT")}  // goes to the Conjecture Module
            mainCallback={() => send("HOME")} // goes to Home
            conjectureSelectCallback={() => send("CONJECTURESELECT")}
          />
        )}
        {state.value === "conjectureSelect" && (
          <ConjectureSelectorModule
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={() => send("CONJECT")}  // goes to the Conjecture Module
            curricularCallback={() => send("CURRICULAR")}
          />
        )}
        {state.value === "pose" && (
          <ConjecturePoseContainer
          
            height={height}
            width={width}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            editCallback={() => send("AUTHOR")} // goes to the Pose Sequence Editor
            mainCallback={() => send("HOME")} // goes to Home
            poseData={poseData}
            UUID={"b56e115e-2efa-40e0-9c37-72b079907653"}
          />
        )
        }
        
        {state.value === "conjecture" && (
          <ConjectureModule
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            editCallback={() => send("AUTHOR")} // goes to the Pose Sequence Editor
            mainCallback={() => send("HOME")} // goes to Home
            testCallback={() => send("TEST")} // goes to test
          />
        )}
        {state.value === "edit" && (
          <PoseAuthoring
            width={width}
            height={height}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={() => send("CONJECT")}  // goes to the Conjecture Module
          />
        )}
        {state.value === "test" && (
          <PoseTest
            width={width}
            height={height}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={() => send("CONJECT")}
          />
        )}
        
        {/* // {state.value === "play" && (
        //   <Background height={height} width={width} />
        //   // <PlayMenu
        //   //   width={width}
        //   //   height={height}
        //   //   columnDimensions={columnDimensions}
        //   //   rowDimensions={rowDimensions}
        //   //   poseData={poseData}
        //   // />
        // )} */}
        {state.value === "main" && (
          <PlayMenu
            width={width}
            height={height}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
          />
          // <Game
          //   poseData={poseData}
          //   columnDimensions={columnDimensions}
          //   rowDimensions={rowDimensions}
          //   height={height}
          //   width={width}
          // />
        )}



      {state.value === "ADDNEWUSER" && (
          <NewUserModule
            width={width}
            height={height}
            UserManagementCallback={() => {
              send("userManagementSettings");
              console.log("User Management");}
              }// goes to user management
        />
        )}

        {state.value === "userManagementSettings" && (
          <UserManagementModule
            width={width}
            height={height}
            mainCallback={() => send("HOME")} // goes to Home
            addNewUserCallback={() => send("ADDNEWUSER")} // goes to add new user section
        />
        )}



      </Stage>
    </>
  );
};

export default Story;