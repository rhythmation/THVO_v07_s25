import React, { useEffect, useState } from "react";
import Loader from "./utilities/Loader.js";
import Home from "./Home.js";
import { useMachine } from "@xstate/react";
import { StoryMachine } from "../machines/storyMachine.js";
import { Stage } from "@inlet/react-pixi";
import { yellow } from "../utils/colors";
import { generateRowAndColumnFunctions } from "./utilities/layoutFunction";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import PlayMenu from "./PlayMenu/PlayMenu.js";
import { getUserRoleFromDatabase, getUserNameFromDatabase } from "../firebase/userDatabase";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic/holistic";
import { enrichLandmarks } from "./Pose/landmark_utilities";

const [
  numRows,
  numColumns,
  marginBetweenRows,
  marginBetweenColumns,
  columnGutter,
  rowGutter,
] = [2, 3, 20, 20, 30, 30];

const Story = () => {
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [state, send] = useMachine(StoryMachine);
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [poseData, setPoseData] = useState({});

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

  // Check auth state
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/signin";
      } else {
        setIsAuthenticated(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user name and role after auth
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserData = async () => {
      try {
        const [name, role] = await Promise.all([
          getUserNameFromDatabase(),
          getUserRoleFromDatabase(),
        ]);

        if (name && name !== "USER NOT FOUND") {
          setUserName(name);
        } else {
          console.warn("User name not found.");
        }

        setUserRole(role);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

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
    const holistic = new Holistic({
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

  // Gate for moving to "ready" state
  useEffect(() => {
    if (
      isAuthenticated &&
      userName &&
      userName !== "USER NOT FOUND" &&
      userRole &&
      state.value === "loading"
    ) {
      send("TOGGLE"); // Go to "ready"
    }
  }, [isAuthenticated, userName, userRole, state, send]);

  const loading =
    !isAuthenticated || !userName || userName === "USER NOT FOUND" || !userRole;

  return (
  <>
    {loading ? (
      <Loader />
    ) : (
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
            startCallback={() => send("TOGGLE")}
            logoutCallback={() => firebase.auth().signOut()}
            userName={userName}
          />
        )}

        {state.value === "main" && (
          <PlayMenu
            width={width}
            height={height}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            role={userRole}
            logoutCallback={() => firebase.auth().signOut()}
          />
        )}
      </Stage>
    )}
  </>
);

};

export default Story;
