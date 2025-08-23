import ConjecturePoseMatch from './ConjecturePoseMatch';
import Background from "../Background";
import { Graphics } from "@inlet/react-pixi";
import { darkGray, yellow } from "../../utils/colors";
import React, { useCallback, useState, useEffect } from "react";
import { 
  initializeSession, 
  bufferPoseDataWithAutoFlush, 
  startSmartAutoFlush, 
  stopAutoFlush, 
  endSession 
} from "../../firebase/database.js";

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
    }, [columnDimensions]);

    useEffect(() => {
        const isRecording = "true";
        
        if (isRecording === "true") {
          // FRAMERATE CAN BE CHANGED HERE
          const frameRate = 12;

          let autoFlushId;
          
          // Initialize session with static data once
          const setupSession = async () => {
            await initializeSession(gameID, frameRate, UUID);
            
            // Start auto-flush with hybrid strategy - now passes UUID
            autoFlushId = startSmartAutoFlush(gameID, UUID, {
              maxBufferSize: 100,      
              flushIntervalMs: 7500,  
              minBufferSize: 10,       
              frameRate: frameRate    
            });
          };

          // Initialize the session
          setupSession();
          
          // Create interval to buffer pose data (much lighter than before)
          const intervalId = setInterval(() => {
            // Buffer the pose data - now passes UUID and frameRate
            bufferPoseDataWithAutoFlush(poseData, gameID, UUID, frameRate);
          }, 1000 / frameRate);
    
          // Cleanup when component unmounts
          return async () => {
            // Stop the data collection interval
            clearInterval(intervalId);
            
            // Stop auto-flush
            if (autoFlushId) {
              stopAutoFlush(autoFlushId);
            }
            
            // End session - now passes UUID and frameRate
            await endSession(gameID, UUID, frameRate);
          };
        } 
    }, [gameID, UUID]); // Added UUID to dependencies since it's used in setup

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