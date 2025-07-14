
import ConjecturePoseMatch from './ConjecturePoseMatch';
import Background from "../Background";
import { Graphics } from "@inlet/react-pixi";
import { darkGray, yellow } from "../../utils/colors";
import React, { useCallback, useState, useEffect } from "react";
import { promiseChecker, writeToDatabase } from "../../firebase/database.js";

const ConjecturePoseContainer = (props) => {
    const {
        poses,
        tolerances, 
        needBack,
        height,
        width,
        columnDimensions,
        rowDimensions,
        editCallback,
        mainCallback,
        poseData,
        UUID,
        onCompleteCallback,
        gameID
    } = props;

    const drawModalBackground = useCallback((g) => {
        g.beginFill(darkGray, 0.9);
        g.drawRect(0, 0, window.innerWidth, window.innerHeight);
        g.endFill();
        const col1 = columnDimensions(1);
        g.beginFill(yellow, 1);
        g.drawRect(col1.x, col1.y, col1.width, col1.height);
        const col3 = columnDimensions(3);
        g.drawRect(col3.x, col3.y, col3.width, col3.height);
        g.endFill();
    }, []);

    useEffect(() => {
        // // Defaults recording conditions true and fps = 12.
    
        const isRecording = "true";
        
        if (isRecording === "true") {
          // Get the fps parameter: default 12


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

// Use background and graphics to draw background and then initiate conjecturePoseMatch
    return (
    <>
        <Background height={height * 1.1} width={width} />
        <Graphics draw={drawModalBackground} />
        <ConjecturePoseMatch
            poses={poses}
            tolerances={tolerances}
            height={height}
            width={width}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            editCallback={editCallback}
            mainCallback={mainCallback}
            poseData={poseData}
            UUID={UUID}
            onCompleteCallback={onCompleteCallback}
            needBack={needBack}
            gameID={gameID}
        />
    </>
    );
};

export default ConjecturePoseContainer;