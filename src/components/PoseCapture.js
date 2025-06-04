import { yellow, blue, white, darkGray } from "../utils/colors";
import Pose from "./Pose/index";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  PixiComponent,
  Graphics,
  useApp,
  Text,
  Stage,
} from "@inlet/react-pixi";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic/holistic";
import { enrichLandmarks } from "./Pose/landmark_utilities";
import { generateRowAndColumnFunctions } from "./utilities/layoutFunction";
import Background from "./Background";

// NEW COMMENT TEST TEST

const [
  numRows,
  numColumns,
  marginBetweenRows,
  marginBetweenColumns,
  columnGutter,
  rowGutter,
] = [2, 3, 20, 20, 30, 30];

const Button = PixiComponent("Button", {
  create: (props) => {
    const container = new PIXI.Container();
    const graphic = new PIXI.Graphics();
    const text = new PIXI.Text("", {
      fontName: "Futura",
      fontSize: 35,
      fill: "white",
    });
    container.addChild(graphic);
    container.addChild(text);
    graphic.on("pointerup", props.onClick);
    return container;
  },
  didMount: (instance, parent) => {},
  willUnmount: (instance, parent) => {
    // clean up before removal
  },
  applyProps: (instance, oldProps, newProps) => {
    const { colOffset, colAttr, rowAttr, text } = newProps;
    const g = instance.children[0];
    g.clear();
    g.beginFill(blue, 1);
    g.drawRect(
      colAttr.x + colAttr.width / colOffset,
      rowAttr.y + rowAttr.height / 3,
      colAttr.width / 3,
      rowAttr.height / 3
    );
    g.endFill();
    g.interactive = true;
    g.buttonMode = true;
    const textComp = instance.children[1];
    textComp.text = text;
    textComp.x = colAttr.x + colAttr.width / colOffset + 5;
    textComp.y = rowAttr.y + rowAttr.height / 3 + 5;
  },
  config: {
    destroy: true,
    destroyChildren: true,
  },
});

const PoseGrab = (props) => {
  const { columnDimensions, poseData, rowDimensions } = props;
  const [poseToMatch, setPoseToMatch] = useState(null);
  const textRef = useRef();
  const poseRef = useRef();
  const modelRef = useRef();
  const app = useApp();
  const drawModalBackground = useCallback((g) => {
    g.beginFill(darkGray, 0.9);
    g.drawRect(0, 0, window.innerWidth, window.innerHeight);
    const col1 = columnDimensions(1);
    const col3 = columnDimensions(3);
    g.endFill();
    g.beginFill(yellow, 1);
    g.drawRect(col1.x, col1.y, col1.width, col1.height);
    g.drawRect(col3.x, col3.y, col3.width, col3.height);
    g.endFill();
  }, []);

  const captureClick = useCallback((event) => {
    let counter = 3;
    let button = event.currentTarget;
    const timerId = setInterval((event) => {
      button.interactive = false;
      button.buttonMode = false;
      textRef.current.text = `${counter}`;
      counter -= 1;
      if (counter < 0) {
        clearInterval(timerId);
        textRef.current.text = ``;
        setPoseToMatch(poseRef.current.poseData);
        button.interactive = true;
        button.buttonMode = true;
      }
    }, 1000);
  }, []);

  const downloadTextFile = (text, name) => {
    const a = document.createElement("a");
    const type = name.split(".").pop();
    a.href = URL.createObjectURL(
      new Blob([text], { type: `text/${type === "txt" ? "plain" : type}` })
    );
    a.download = name;
    a.click();
  };

  const saveClick = useCallback((event) => {
    const pose = {
      name: "tutorial_pose_1",
      matchingConfig: [
        { segment: "RIGHT_BICEP", data: "poseLandmarks" },
        { segment: "RIGHT_FOREARM", data: "poseLandmarks" },
        { segment: "LEFT_BICEP", data: "poseLandmarks" },
        { segment: "LEFT_FOREARM", data: "poseLandmarks" },
      ],
      landmarks: {
        poseLandmarks: modelRef.current.poseData.poseLandmarks,
        leftHandLandmarks: modelRef.current.poseData.leftHandLandmarks,
        rightHandLandmarks: modelRef.current.poseData.rightHandLandmarks,
        faceLandmarks: modelRef.current.poseData.faceLandmarks,
      },
    };
    downloadTextFile(JSON.stringify(pose), "myObj.json");
  }, []);

  return (
    <>
      <Graphics draw={drawModalBackground} />
      <Button
        colAttr={columnDimensions(2)}
        rowAttr={rowDimensions(2)}
        onClick={captureClick}
        colOffset={10}
        text={"Capture"}
      />
      <Text
        ref={textRef}
        x={columnDimensions(2).x + columnDimensions(2).width / 2}
        y={columnDimensions(2).height / 2}
        style={
          new PIXI.TextStyle({
            align: "center",
            fontFamily: '"Futura", Helvetica, sans-serif',
            fontSize: 50,
            fontWeight: 400,
            fill: [white],
          })
        }
      />
      <Button
        colAttr={columnDimensions(2)}
        rowAttr={rowDimensions(2)}
        onClick={saveClick}
        colOffset={1.75}
        text={"Save"}
      />
      <Pose poseData={poseData} colAttr={columnDimensions(3)} ref={poseRef} />
      {poseToMatch && (
        <Pose
          poseData={poseToMatch}
          colAttr={columnDimensions(1)}
          ref={modelRef}
        />
      )}
    </>
  );
};

const PoseCapture = () => {
  let holistic;
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
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

  useEffect(() => {
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

  return (
    <Stage
      height={height}
      width={width}
      options={{
        antialias: true,
        autoDensity: true,
        backgroundColor: 0xfacf5a,
      }}
    >
      <Background height={height} width={width} />
      <PoseGrab
        columnDimensions={columnDimensions}
        poseData={poseData}
        rowDimensions={rowDimensions}
      />
    </Stage>
  );
};

export default PoseCapture;
