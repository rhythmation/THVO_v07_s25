import { useState, useCallback, useEffect, useRef } from "react";
import { Graphics, Text } from "@inlet/react-pixi";
import CursorMode from "./CursorMode.js";
import Pose from "./Pose/index";
import { white, darkGray, yellow } from "../utils/colors";
import { writeToDatabase } from "../firebase/database.js";

/**
 * A non-blocking error handler for database writes. This is a safe way to log
 * errors without impacting performance.
 */
const handleWriteError = (error) => {
  console.error("Failed to write pose data to the database:", error);
};

const ExperimentalTask = (props) => {
  const {
    prompt,
    poseData,
    UUID,
    columnDimensions,
    onComplete,
    rowDimensions,
    cursorTimer,
    gameID,
  } = props;
  const [showCursor, setShowCursor] = useState(false);
  
  // A ref to hold the timer ID. This is critical for preventing race conditions.
  const cursorTimerRef = useRef(null);

  const drawModalBackground = useCallback((g) => {
    g.beginFill(darkGray, 0.9);
    g.drawRect(0, 0, window.innerWidth, window.innerHeight);
    const col3 = columnDimensions(3);
    g.endFill();
    g.beginFill(yellow, 1);
    g.drawRect(col3.x, col3.y, col3.width, col3.height);
    g.endFill();
  }, [columnDimensions]);

  // --- EFFICIENT DATABASE WRITING ---
  // This useEffect handles writing data to Firebase without causing a performance freeze.
  // The buggy `promiseChecker` logic has been completely removed.
  useEffect(() => {
    const isRecording = true; 
    const frameRate = 12;

    if (isRecording) {
      const intervalId = setInterval(() => {
        if (poseData) {
          // Write data but don't block the main thread. This prevents the freeze.
          writeToDatabase(poseData, UUID, frameRate, gameID).catch(handleWriteError);
        }
      }, 1000 / frameRate);
      // Cleanup function to stop the interval when the component is removed.
      return () => clearInterval(intervalId);
    }
  }, [poseData, UUID, gameID]);

  // --- RACE CONDITION FIX ---
  // This useEffect correctly manages the timer that shows the 'Next' button/cursor.
  useEffect(() => {
    cursorTimerRef.current = setTimeout(() => {
      setShowCursor(true);
    }, cursorTimer || 1000);

    // This cleanup function clears the timer if the component unmounts, preventing bugs.
    return () => {
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
    };
  }, [cursorTimer]);

  /**
   * This function safely handles the completion event. It first clears any
   * pending timers and then calls the original onComplete callback. This
   * prevents both the timer and a user click from firing at the same time.
   */
  const handleOnComplete = useCallback(() => {
    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = null;
    }
    onComplete();
  }, [onComplete]);

  return (
    <>
      <Graphics draw={drawModalBackground} />
      <Text
        text={prompt}
        y={50}
        x={columnDimensions(1).x + columnDimensions(1).margin}
        style={
          new PIXI.TextStyle({
            align: "center",
            fontFamily: "Futura",
            fontSize: "4em",
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
          <CursorMode
            poseData={poseData}
            rowDimensions={rowDimensions}
            callback={handleOnComplete} // Use the safe, wrapped callback
            colAttr={columnDimensions(3)}   // ← NEW
          />
          <Text
            text={"When you're ready to move on, click the 'Next Arrow' to continue"}
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


