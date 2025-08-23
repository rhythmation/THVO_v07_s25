import { useMachine } from '@xstate/react';
import React, { useState, useEffect } from 'react';

import VideoRecorder from '../VideoRecorder';
import Chapter from '../Chapter';
import ConjecturePoseContainter from '../ConjecturePoseMatch/ConjecturePoseContainer';
import ExperimentalTask from '../ExperimentalTask';
import Tween from '../Tween';

import LevelPlayMachine from './LevelPlayMachine';
import {
  getConjectureDataByUUID,
  writeToDatabaseIntuitionStart,
  writeToDatabaseIntuitionEnd,
} from '../../firebase/database';

export default function LevelPlay(props) {
  const {
    columnDimensions,
    poseData,
    rowDimensions,
    debugMode,
    onLevelComplete,
    UUID,
    width,
    height,
    backCallback,
    currentConjectureIdx,
    gameID,
    hasShownIntro,
    markIntroShown,
  } = props;

  if (!UUID || currentConjectureIdx === undefined || isNaN(currentConjectureIdx)) {
    console.warn('🚫 Skipping render — invalid UUID or chapter index', {
      UUID,
      currentConjectureIdx,
    });
    return null;
  }

  const [state, send] = useMachine(LevelPlayMachine);
  React.useEffect(() => {
    send("RESET_CONTEXT");
  }, [currentConjectureIdx, send]);
  const [conjectureData, setConjectureData] = useState(null);
  const [poses, setPoses] = useState([]);
  const [tolerances, setTolerances] = useState([]);
  const [expText, setExpText] = useState('');
  const tweenDuration = 2000;
  const tweenLoopCount = 2;

  /* ---------- load conjecture data ---------- */
  useEffect(() => {
    getConjectureDataByUUID(UUID)
      .then((d) => {
        setConjectureData(d);

        const { ['Start Pose']: s, ['Intermediate Pose']: i, ['End Pose']: e } = d[UUID];

        setPoses([
          JSON.parse(s.poseData),
          JSON.parse(i.poseData),
          JSON.parse(e.poseData),
        ]);

        const tolArray = [s, i, e].map((pose) =>
          typeof pose.tolerance === 'string' || typeof pose.tolerance === 'number'
            ? parseInt(pose.tolerance)
            : null
        );
        setTolerances(tolArray);
      })
      .catch(console.error);
  }, [UUID]);

  /* ---------- experimental prompt ---------- */
  useEffect(() => {
    if (!conjectureData) return;
    const desc = conjectureData[UUID]['Text Boxes']['Conjecture Description'];

    if (state.value === 'intuition') {
      setExpText(`Read aloud:\n\n${desc}\n\nSay aloud if it is TRUE or FALSE?`);
      writeToDatabaseIntuitionStart(gameID).catch(console.error);
    } else if (state.value === 'insight') {
      setExpText(`Now explain WHY you think:\n\n${desc}\n\n is TRUE or FALSE?`);
      writeToDatabaseIntuitionEnd(gameID).catch(console.error);
    } else {
      setExpText('');
    }
  }, [state.value, conjectureData, UUID, gameID]);

  /* ---------- tween message (shown inside Tween for 1 s) ---------- */

      useEffect(() => {
        if (state.value !== 'tween') return;

        // create a plain DOM node so React-Pixi never sees it
        const banner = document.createElement('div');
        banner.textContent = 'Try to match these movements with your body';
        Object.assign(banner.style, {
          position: 'fixed',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '32px',
          textShadow: '0 0 4px #000',
          pointerEvents: 'none',
        });
        document.body.appendChild(banner);

        const timer = setTimeout(() => banner.remove(), tweenDuration * (tweenLoopCount+2000));

        return () => {
          clearTimeout(timer);
          banner.remove();
        };
      }, [state.value]);

  return (
    <>
      {/* NOTE: TO OPTIMIZE DATABASE STORAGE AND NOT INCUR ADDITIONAL COSTS, 
          VIDEO RECORDING IS ONLY RETAINED FOR THE STATES MENTIONED BELOW.
          SIMPLY ADD THE STATE NAME TO ENABLE RECORDING FOR THAT PHASE */}
      {(['tween','poseMatching', 'intuition', 'insight'].includes(state.value)) && (
        <VideoRecorder phase={state.value} curricularID={UUID} gameID={gameID} />
      )}

      {/* Intro dialogue */}
      {state.value === 'introDialogue' &&
        !hasShownIntro(currentConjectureIdx) &&
        conjectureData && (
          <Chapter
            key={`intro-${UUID}`}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            width={width}
            height={height}
            chapterConjecture={conjectureData[UUID]}
            currentConjectureIdx={currentConjectureIdx}
            nextChapterCallback={() => {
              markIntroShown(currentConjectureIdx);
              send('NEXT');
            }}
            isOutro={false}
          />
        )}

      {/* Tween animation */}
      {state.value === 'tween' && poses.length > 0 && (
        <Tween
          poses={poses}
          duration={tweenDuration}
          width={width}
          height={height}
          loop={tweenLoopCount}
          ease={true}    
          onComplete={() => send('NEXT')}
        />
      )}

      {/* Pose-matching */}
      {state.value === 'poseMatching' && poses.length > 0 && (
        <ConjecturePoseContainter
          width={width}
          height={height}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          poseData={poseData}
          mainCallback={backCallback}
          UUID={UUID}
          poses={poses}
          tolerances={tolerances}
          onCompleteCallback={() => send('NEXT')}
          gameID={gameID}
        />
      )}

      {/* Intuition / Insight */}
      {state.value === 'intuition' && (
        <ExperimentalTask
          width={width}
          height={height}
          prompt={expText}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          poseData={poseData}
          UUID={UUID}
          onComplete={() => send('NEXT')}
          cursorTimer={debugMode ? 1000 : 10000}
          gameID={gameID}
        />
      )}
      {state.value === 'insight' && (
        <ExperimentalTask
          width={width}
          height={height}
          prompt={expText}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          poseData={poseData}
          UUID={UUID}
          onComplete={() => send('NEXT')}
          cursorTimer={debugMode ? 1000 : 15000}
          gameID={gameID}
        />
      )}
      {/* Uncomment when mcq state is added */}
      {/* {state.value === 'mcq' && (
        <mcq
          width={width}
          height={height}
          question={}
          answerChoices={}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          poseData={poseData}
          UUID={UUID}
          onComplete={() => send('NEXT')}
          pressDelay={3000ms}
          gameID={gameID}
        />
      )} */}

      {/* Outro dialogue */}
      {state.value === 'outroDialogue' && conjectureData && (
        <Chapter
          key={`outro-${UUID}`}
          poseData={poseData}
          columnDimensions={columnDimensions}
          rowDimensions={rowDimensions}
          width={width}
          height={height}
          chapterConjecture={conjectureData[UUID]}
          currentConjectureIdx={currentConjectureIdx}
         nextChapterCallback={() => {
          // tell parent to advance the level...
          onLevelComplete();
        }}          isOutro={true}
        />
      )}
    </>
  );
}
