import Background from "../Background";
import { Graphics, Text } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import { orange, black, white, darkGray, yellow, red, blue } from "../../utils/colors";
import Button from "../Button";
import RectButton from "../RectButton";
import { getConjectureDataByUUID } from "../../firebase/database";
import { useCallback } from "react";
import React, { useState, useEffect } from 'react';
import { Container } from "postcss";
import { set } from "firebase/database";
import  PoseMatching  from "../PoseMatching";


const PoseTestMatch = (props) => {
  const { height, width, columnDimensions, conjectureCallback, poseData, gameID} = props;
  const [poses, setPoses] = useState(null);

  // Background for Pose Matching
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

  // Get pose data from local storage
  useEffect(() => {
    startPose = JSON.parse(localStorage.getItem("start.json"))
    intermediatePose = JSON.parse(localStorage.getItem("intermediate.json"))
    endPose = JSON.parse(localStorage.getItem("end.json"))
    // Get Tolerance from local storage
    startTolerance = parseInt(localStorage.getItem("Start Tolerance"))
    intermediateTolerance = parseInt(localStorage.getItem("Intermediate Tolerance"))
    endTolerance = parseInt(localStorage.getItem("End Tolerance"))
    // If the poses are all there, set tolerance and poses variable
    // TODO: Make this more efficient
    if (startPose != null && endPose != null && intermediatePose != null) {
      startPose["tolerance"] = startTolerance || 45
      intermediatePose["tolerance"] = intermediateTolerance || 45;
      endPose["tolerance"] = endTolerance || 45;
      setPoses([startPose, intermediatePose, endPose])
    }
}, []);

return(
  <> 
  {/* If poses is not null then start pose matching to test */}
      {poses != null && (
        <Graphics draw={drawModalBackground} >
        <>
        <PoseMatching
          poseData={poseData}
          posesToMatch={[
            poses,
            poses,
            poses
          ].flat()}
          columnDimensions={columnDimensions}
          onComplete={conjectureCallback}
          gameID={gameID}
        />
        {/* Back Button */}
        <RectButton
          height={height * 0.13}
          width={width * 0.26}
          x={width * 0.15}
          y={height * 0.93}
          color={black}
          fontSize={width * 0.015}
          fontColor={white}
          text={"Back Button"}
          fontWeight={800}
          callback={conjectureCallback}
        />
        </>
        </Graphics>
        
      )}
      {/* Otherwise, prompt to go back and complete all poses */}
      {poses == null &&
      <>
      <Text
        text={`EMPTY POSES\nPlease Complete All Poses`}
        x={width * 0.5}
        y={height * 0.15}
        style={
          new TextStyle({
            align: "center",
            fontSize: 40,
            fontWeight: 800,
            fill: [blue],
            letterSpacing: 0,
          })
        }
        anchor={0.5}
      />
      <Button
        width={width*0.2}
        x={width*0.5}
        y={height*0.5}
        color={red}
        fontSize={width*0.05}
        fontColor={white}
        text={"BACK"}
        fontWeight={800}
        callback={conjectureCallback}
        />
        </>
      }

      

      

  </>
  );



};

export default PoseTestMatch;