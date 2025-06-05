import CursorMode from "./CursorMode.js";
import Background from "./Background.js";
import Character from "./Character.js";
import TextBox from "./TextBox.js";
import Pose from "./Pose/index.js";
import { useEffect, useState } from "react";
import { useMachine, useSelector, assign } from "@xstate/react";
import chapterMachine from "../machines/chapterMachine.js";
import { Sprite } from "@inlet/react-pixi";
import Experiment from "./Experiment.js";
import script from "../scripts/chapters.toml";
import { Curriculum } from "./CurricularModule/CurricularModule";
import { loadGameDialoguesFromFirebase } from "../firebase/database.js";

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

export const idToSprite = {
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
  console.log("sceneConfig received in createScene:", sceneConfig);
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
      console.log("character config", characterConfig);
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
    isOutro,
  } = props;

  const [characters, setCharacters] = useState(undefined);
  const [displayText, setDisplayText] = useState(null);
  const [speaker, setSpeaker] = useState(null);
  const [currentConjecture, setCurrentConjecture] = useState(chapterConjecture);
  const [isLoading, setIsLoading] = useState(true);

  const [hasCompleted, setHasCompleted] = useState(false);

  const handleAdvance = () => {
    send("NEXT");
  };

  const [dialogueData, setDialogueData] = useState({ intro: [], outro: [], scene: [] });
  const [hasRun, setHasRun] = useState(false);
  const [previousChapter, setPreviousChapter] = useState(null);

  // Initialize context
  const context = {
    introText: dialogueData.intro || [],
    outroText: dialogueData.outro || [],
    scene: dialogueData.scene || [],
    currentText: props.isOutro
      ? (dialogueData.outro && dialogueData.outro[0]) || null
      : (dialogueData.intro && dialogueData.intro[0]) || null,
    lastText: [],
    cursorMode: true,
    onIntroComplete: () => {
      if (!hasRun) {
        setHasRun(true);
        // Clear dialogues immediately before GameMachine updates
        setDialogueData({ intro: [], outro: [], scene: [] });
        nextChapterCallback();
      }
    },
    onOutroComplete: () => {
      if (!hasRun) {
        setHasRun(true);
        // Clear dialogues immediately before GameMachine updates
        setDialogueData({ intro: [], outro: [], scene: [] });
        nextChapterCallback();
      }
    },
  };

  // Reset state when chapter changes
  useEffect(() => {
    if (previousChapter !== currentConjectureIdx) {
      console.log('=== CHAPTER CHANGE ===');
      console.log('Previous:', previousChapter);
      console.log('Current:', currentConjectureIdx);
      console.log('isOutro:', isOutro);
      console.log('Current dialogueData:', dialogueData);
      setHasRun(false);
      // Clear any existing dialogues
      setDialogueData({ intro: [], outro: [], scene: [] });
      // Reset state machine
      send({
        type: "RESET_CONTEXT",
        introText: [],
        outroText: [],
        scene: [],
        currentText: null,
        lastText: [],
        cursorMode: true,
        isOutro: isOutro,
      });
      setPreviousChapter(currentConjectureIdx);
    }
  }, [currentConjectureIdx, isOutro]);

  const [state, send, service] = useMachine(chapterMachine, {
    context,
    initialState: isOutro ? "outro" : "intro",
  }, (state) => {
    if (state.matches("done") && !hasRun) {
      setHasRun(true);
    }
  });

  const currentText = useSelector(service, selectCurrentText);
  const cursorMode = useSelector(service, selectCursorMode);

  // Load dialogues from Firebase - but only if we haven't loaded them yet
  useEffect(() => {
    if (previousChapter === currentConjectureIdx && !hasRun) {
      const loadDialogues = async () => {
        console.log('=== LOADING DIALOGUES ===');
        console.log('Chapter:', currentConjectureIdx + 1);
        console.log('isOutro:', isOutro);
        console.log('hasRun:', hasRun);
        setIsLoading(true);
        const gameId = Curriculum.getCurrentUUID();
        
        if (!gameId) {
          console.warn("No valid game ID found. Cannot load dialogues.");
          setIsLoading(false);
          return;
        }

        try {
          const rawDialogues = await loadGameDialoguesFromFirebase(gameId);
          const allDialogues = Object.values(rawDialogues || {});
          
          if (allDialogues && allDialogues.length > 0) {
            const currentChapterName = `chapter-${currentConjectureIdx + 1}`;
            console.log('=== FILTERING DIALOGUES ===');
            console.log('Looking for chapter:', currentChapterName);
            
            const chapterDialogues = allDialogues.filter(
              dialogue => dialogue.chapter === currentChapterName
            );
            console.log('Found dialogues:', chapterDialogues);

            const intros = chapterDialogues
              .filter(dialogue => dialogue.type === "Intro")
              .map(dialogue => ({ 
                text: dialogue.text, 
                speaker: dialogue.character || "player"
              }));
            console.log('Filtered intros:', intros);
              
            const outros = chapterDialogues
              .filter(dialogue => dialogue.type === "Outro")
              .map(dialogue => ({
                text: dialogue.text, 
                speaker: dialogue.character || "player"
              }));
            console.log('Filtered outros:', outros);

            const scene = [];
            if (script[currentChapterName] && script[currentChapterName].scene) {
              scene.push(...script[currentChapterName].scene);
            }

            console.log('=== UPDATING STATE ===');
            console.log('Setting dialogueData for chapter:', currentConjectureIdx + 1);
            setDialogueData({
              intro: intros,
              outro: outros,
              scene: scene
            });

            console.log('Sending RESET_CONTEXT to state machine');
            send({
              type: "RESET_CONTEXT",
              introText: intros,
              outroText: outros,
              scene: scene,
              currentText: isOutro ? outros[0] : intros[0],
              lastText: [],
              cursorMode: true,
              isOutro: isOutro,
            });
          }
        } catch (error) {
          console.error("Error loading dialogues:", error);
        } finally {
          setIsLoading(false);
          console.log('=== LOADING COMPLETE ===');
        }
      };

      loadDialogues();
    }
  }, [currentConjectureIdx, isOutro, previousChapter, hasRun]);

  // Add effect to monitor state changes
  useEffect(() => {
    console.log('=== STATE UPDATE ===');
    console.log('Current state:', state.value);
    console.log('Current text:', state.context.currentText);
    console.log('isOutro:', isOutro);
    console.log('hasRun:', hasRun);
  }, [state, isOutro, hasRun]);

  useEffect(() => {
    if (dialogueData.scene && !isLoading) {
      console.log("Loading...");
      setCharacters(
        createScene(state.context.scene, columnDimensions(1), rowDimensions(1)),
      );
    }
  }, [dialogueData, isLoading]);

  useEffect(() => {
    setCurrentConjecture(chapterConjecture);
  }, [chapterConjecture]);

  // Effect to update the current text being displayed
  useEffect(() => {
    const subscription = service.subscribe((state) => {
      if (state.context.currentText) {
        // console.log("THERE CURRENTLY IS TEXT YES IT EXISTS!");
        setDisplayText(state.context.currentText.text);
      }
    });

    return subscription.unsubscribe;
  }, [service]);

  useEffect(() => {
    if (characters && currentText) {
      // console.log("There are characters and current text is set.");
      // console.log("Characters", characters);
      // console.log("Current Text", currentText);
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

  // Show loading state
  if (isLoading) {
    return (
      <>
        <Background height={height} width={width} />
        <TextBox
          text="Loading chapter data..."
          rowDimensionsCallback={rowDimensions}
        />
      </>
    );
  }

  // Rest of the component remains the same
  return (
    <>
      <Background height={height} width={width} />
      {characters}
      <TextBox
        text={displayText}
        rowDimensionsCallback={rowDimensions}
        speaker={speaker}
        onCompleteCallback={handleAdvance}
        onClickCallback={handleAdvance}
        isLoading={isLoading}
      />
      {(state.value === "intro" || state.value.intro || state.value === "outro" || state.value.outro || state.value === "loadingNextChapter") && (
        <Pose poseData={poseData} colAttr={columnDimensions(3)} />
      )}
      {cursorMode && (
        <CursorMode 
          rowDimensions={rowDimensions} 
          poseData={poseData} 
          callback={handleAdvance}
        />
      )}
    </>
  );
};

export default Chapter;