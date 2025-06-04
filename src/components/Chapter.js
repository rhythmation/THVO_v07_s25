import CursorMode from "./CursorMode.js";
import Background from "./Background.js";
import Character from "./Character.js";
import TextBox from "./TextBox.js";
import Pose from "./Pose/index.js";
import { useEffect, useState } from "react";
import { useMachine, useSelector, assign } from "@xstate/react";
import ChapterMachine from "../machines/chapterMachine.js";
import { Sprite } from "@inlet/react-pixi";
import Experiment from "./Experiment.js";
import script from "../scripts/chapters.toml";

const characterRenderOrder = {
  aboveground: 1,
  background: 2,
  midground: 3,
  foreground: 4,
};

const defaultFacePositions = {
  circle: [-20, -30],
  equilateralTriangle: [50, 0],
  rectangle: [70, 50],
  scaleneTriangle: [5, 100],
  trapezoid: [70, 50],
  square: [70, 50],
};

const defaultHeights = {
  circle: 0.1,
  equilateralTriangle: 0.2,
  rectangle: 0.5,
  scaleneTriangle: 0.2,
  trapezoid: 0.15,
  square: 0.3,
};

import { pink, blue, green } from "../utils/colors.js";
const colorMap = {
  pink: pink,
  blue: blue,
  green: green,
};

const idToSprite = {
  // "circle": "../assets/circle.png",
  player: new URL("../assets/player_sprite.png", import.meta.url).href,
  equilateralTriangle: new URL(
    "../assets/equilateralTriangle_sprite.png",
    import.meta.url
  ).href,
  circle: new URL("../assets/circle_sprite.png", import.meta.url).href,
  square: new URL("../assets/square_sprite.png", import.meta.url).href,
  trapezoid: new URL("../assets/trapezoid_sprite.png", import.meta.url).href,
  scaleneTriangle: new URL(
    "../assets/scaleneTriangle_sprite.png",
    import.meta.url
  ).href,
  rectangle: new URL("../assets/rectangle_sprite.png", import.meta.url).href,
};

const createScene = (sceneConfig, columnDimensions, rowDimensions) => {
  return sceneConfig
    .sort((a, b) => {
      return (
        characterRenderOrder[a.distance] - characterRenderOrder[b.distance]
      );
    })
    .map((characterConfig, idx) => {
      let placementText = characterConfig.distance
        ? characterConfig.distance
        : "foreground";
      placementText += characterConfig.placement
        ? ` ${characterConfig.placement}`
        : " left";
      return (
        <Character
          type={characterConfig.id}
          color={colorMap[characterConfig.color]}
          placementText={placementText}
          facePosition={
            characterConfig.facePosition ||
            defaultFacePositions[characterConfig.id]
          }
          height={columnDimensions.height * defaultHeights[characterConfig.id]}
          mood={characterConfig.mood}
          rowDimensions={rowDimensions}
          colDimensions={columnDimensions}
          key={characterConfig.id}
        />
      );
    });
};

const selectCurrentText = (state) => state.context.currentText;
const selectCursorMode = (state) => state.context.cursorMode;

const Chapter = (props) => {
  const {
    rowDimensions,
    columnDimensions,
    height,
    width,
    poseData,
    chapterConjecture,
    nextChapterCallback,
    currentConjectureIdx,
  } = props;
  let context;
  if (script[`chapter-${currentConjectureIdx + 1}`]) {
    const { intro, outro, scene } =
      script[`chapter-${currentConjectureIdx + 1}`];
    context = {
      introText: intro ? intro : "",
      outroText: outro ? outro : "",
      scene: scene ? scene : "",
      currentText: null,
      lastText: [],
      cursorMode: true,
    };
  }
  const [characters, setCharacters] = useState(undefined);
  const [displayText, setDisplayText] = useState(null);
  const [speaker, setSpeaker] = useState(null);
  const [currentConjecture, setCurrentConjecture] = useState(chapterConjecture);

  const [state, send, service] = useMachine(ChapterMachine, { context });
  const currentText = useSelector(service, selectCurrentText);
  const cursorMode = useSelector(service, selectCursorMode);

  useEffect(() => {
    setCharacters(
      createScene(state.context.scene, columnDimensions(1), rowDimensions(1))
    );
  }, []);
  useEffect(() => {
    setCurrentConjecture(chapterConjecture);
  }, [chapterConjecture]);

  useEffect(() => {
    let [intro, outro, scene] = [[], [], []];
    if (script[`chapter-${currentConjectureIdx + 1}`]) {
      intro = script[`chapter-${currentConjectureIdx + 1}`].intro
        ? script[`chapter-${currentConjectureIdx + 1}`].intro
        : [];
      outro = script[`chapter-${currentConjectureIdx + 1}`].outro
        ? script[`chapter-${currentConjectureIdx + 1}`].outro
        : [];
      scene = script[`chapter-${currentConjectureIdx + 1}`].outro
        ? script[`chapter-${currentConjectureIdx + 1}`].outro
        : [];
    }
    send({
      type: "RESET_CONTEXT",
      introText: intro,
      outroText: outro,
      scene: scene,
      currentText: null,
      lastText: [],
      cursorMode: true,
    });
  }, [currentConjectureIdx]);

  // Effect to update the current text being displayed
  useEffect(() => {
    const subscription = service.subscribe((state) => {
      if (state.context.currentText) {
        setDisplayText(state.context.currentText.text);
      }
    });

    return subscription.unsubscribe;
  }, [service]);

  useEffect(() => {
    if (characters && currentText) {
      setSpeaker(
        <Sprite
          image={idToSprite[currentText.speaker]}
          x={0}
          y={0}
          anchor={0}
        />
      );
    }
  }, [characters, currentText]);

  return (
    <>
      <Background height={height} width={width} />
      {characters}
      {["intro", "outro", "loadingNextChapter"].includes(state.value) && (
        <Pose poseData={poseData} colAttr={columnDimensions(3)} />
      )}
      {["intro", "outro", "loadingNextChapter"].includes(state.value) &&
        displayText && (
          <TextBox
            text={displayText}
            rowDimensionsCallback={rowDimensions}
            speaker={speaker}
          />
        )}
      {cursorMode &&
        !["experiment", "final", "loadingNextChapter"].includes(
          state.value
        ) && (
          <CursorMode
            poseData={poseData}
            rowDimensions={rowDimensions}
            callback={() => {
              send("NEXT");
            }}
          />
        )}
      {cursorMode && state.value === "loadingNextChapter" && (
        <CursorMode
          poseData={poseData}
          rowDimensions={rowDimensions}
          callback={nextChapterCallback}
        />
      )}
      {state.value === "experiment" && currentConjecture && (
        <Experiment
          columnDimensions={columnDimensions}
          poseData={poseData}
          rowDimensions={rowDimensions}
          onComplete={() => {
            send("ADVANCE");
          }}
          debugMode={false}
          conjectureData={currentConjecture}
          currentConjectureIdx={currentConjectureIdx}
        />
      )}
    </>
  );
};

export default Chapter;
