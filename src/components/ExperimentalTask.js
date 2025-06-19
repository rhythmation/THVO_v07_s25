import { useState, useCallback, useEffect } from "react";
import { Graphics, Text, useApp } from "@inlet/react-pixi";
import CursorMode from "./CursorMode.js";
import Pose from "./Pose/index";
import { white, darkGray, yellow, red } from "../utils/colors";
import { promiseChecker, writeToDatabase } from "../firebase/database.js";
import Button from "./Button.js";

const ExperimentalTask = (props) => {
  const {
    width,
    height,
    prompt,
    poseData,
    UUID,
    columnDimensions,
    onComplete,
    rowDimensions,
    cursorTimer,
    gameID
  } = props;
  const [showCursor, setShowCursor] = useState(false);

  const drawModalBackground = useCallback((g) => {
    g.beginFill(darkGray, 0.9);
    g.drawRect(0, 0, window.innerWidth, window.innerHeight);
    const col3 = columnDimensions(3);
    g.endFill();
    g.beginFill(yellow, 1);
    g.drawRect(col3.x, col3.y, col3.width, col3.height);
    g.endFill();
  });

  // Database Write Functionality
  // This code runs when the user is participating in a conjecture and recording is enabled.
  // The following code runs once when the component mounts.
  useEffect(() => {
    // Defaults recording conditions true and fps = 12.
    const isRecording = "true";
    
    if (isRecording === "true") {
      // Get the fps: default to 12



      //FRAMERATE CAN BE CHANGED HERE
      const frameRate = 12;




      // Empty array to hold promise objects assures that all the promises get settled on component unmount.
      let promises = [];

      // This creates an interval for the writing to the database every n times a second,
      // where n is a variable framerate.
      const intervalId = setInterval(() => {
        // Call the writeToDatabase function with the current poseData, conjecture index,
        // and fps parameter. Push the resulting promise object to the promises array.
        promises.push(
          writeToDatabase(poseData, UUID, frameRate, gameID)
        );
        // Call the promiseChecker function to detect any data loss in the promises array
        // and trigger an alert if necessary.
        promiseChecker(frameRate, promises);
    }, 1000 / frameRate);

      // The code below runs when the component unmounts.
    return async () => {
        // Stop the interval when the component unmounts.
      clearInterval(intervalId);

        // Wait until all promises are settled so we don't lose data.
      await Promise.allSettled(promises);
    };
  } 
}, []);

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setShowCursor(true);
      },
      cursorTimer ? cursorTimer : 1000
    );
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Graphics draw={drawModalBackground} />
      <Text
        text={prompt}
        y={columnDimensions(1).y + columnDimensions(1).height / 4}
        x={columnDimensions(1).x + columnDimensions(1).margin}
        style={
          new PIXI.TextStyle({
            align: "center",
            fontFamily: "Futura",
            fontSize: "5em",
            fontWeight: 800,
            fill: [white],
            wordWrap: true,
            wordWrapWidth: columnDimensions(2).width * 2,
          })
        }
      />
      <Pose poseData={poseData} colAttr={columnDimensions(3)} />
      {showCursor && ( 
        <>
          {/* <Button
          width={width * 0.20}
          x={width * 0.9}
          y={height * 0.9}
          color={red}
          fontSize={width * 0.02}
          fontColor={white}
          text={"NEXT"}
          fontWeight={800}
          callback={onComplete}
      /> */}
      {/* This results in a big slow down, TODO need to fix */}
          <CursorMode
            poseData={poseData}
            rowDimensions={rowDimensions}
            callback={onComplete}
          />
          <Text
            text={"When you're ready to move on, click 'Next' to continue"}
            y={columnDimensions(1).y + 7 * (columnDimensions(1).height / 8)}
            x={columnDimensions(1).x + columnDimensions(1).margin}
            style={
              new PIXI.TextStyle({
                align: "center",
                fontFamily: "Futura",
                fontSize: "3.5em",
                fontWeight: 800,
                fill: [white],
                wordWrap: true,
                wordWrapWidth: columnDimensions(1).width * 2,
              })
            } 
          />
        </>
      )}
    </>
  );
};

export default ExperimentalTask;
