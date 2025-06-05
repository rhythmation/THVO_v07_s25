import { useEffect, useRef, useState } from 'react';
import { useMachine } from "@xstate/react";
import LevelPlayMachine from "./LevelPlayModule/LevelPlayMachine";
import { getUserNameFromDatabase } from '../firebase/userDatabase';
import { getGameNameByUUID, getLevelNameByUUID, getGameNameByLevelUUID, getCurricularDataByUUID } from '../firebase/database';
import { storage } from '../firebase/init';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const VideoRecorder = ({ phase, curricularID, gameID }) => {
  const [currentPhase, setCurrentPhase] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingPhaseRef = useRef(null);
  const [state, send] = useMachine(LevelPlayMachine);

  // Checking to ensure props were received
  useEffect(() => {
    console.log("VideoRecorder props received:", { phase, curricularID, gameID });
  }, [phase, curricularID, gameID]);

  // Get the camera stream from the existing video element (defined in index.html)
  useEffect(() => {
    const inputVideo = document.getElementsByClassName("input-video")[0];
    if (!inputVideo) {
      console.error("Input video element not found");
      return;
    }
    // Poll until the input video has a stream (assigned by MediaPipe)
    const checkStream = setInterval(() => {
      if (inputVideo.srcObject) {
        clearInterval(checkStream);
        // Clone the stream so our recording is independent of MediaPipe processing
        streamRef.current = inputVideo.srcObject.clone();
        // If a phase is already set, start recording immediately
        if (phase) {
          startRecording(phase);
          setCurrentPhase(phase);
        }
      }
    }, 500);

    return () => {
      clearInterval(checkStream);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // When the phase prop changes, handle recording changes with proper sequencing
  useEffect(() => {
    if (phase !== currentPhase) {
      console.log(`Phase changing from ${currentPhase} to ${phase}`);
      
      const handlePhaseChange = async () => {
        // Step 1: Stop the current recording if one is active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log(`Stopping recording for phase: ${recordingPhaseRef.current}`);
          mediaRecorderRef.current.stop();
          
          // Wait for the recording to fully stop before starting a new one
          // This ensures the onstop handler completes before a new recording starts
          await new Promise(resolve => {
            const checkRecording = setInterval(() => {
              if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                clearInterval(checkRecording);
                resolve();
              }
            }, 100);
          });
        }
        
        // Step 2: Start a new recording if we have a new phase
        if (phase) {
          console.log(`Starting new recording for phase: ${phase}`);
          startRecording(phase); // Pass the current phase
        }
        
        // Step 3: Update the current phase state
        setCurrentPhase(phase);
      };
      
      handlePhaseChange();
    }
  }, [phase, currentPhase]);


  // In the VideoRecorder component, get the game name:
  const getGameDetails = async () => {
    if (gameID) {
      return getGameNameByUUID(gameID);
    } else if (curricularID) {
      // If no game ID but we have level ID, find what game contains this level
      return getGameNameByLevelUUID(curricularID);
    }
    return 'NoGameID';
  };

  // And get the level name:
  const getLevelDetails = async () => {
    if (curricularID) {
      return getLevelNameByUUID(curricularID);
    }
    return 'UnknownLevel';
  };

  // Get game name from gameID
  // const getGameName = async () => {
  //   try {
  //     const gameData = await getCurricularDataByUUID(gameID);
  //     if (gameData) {
  //       // Extract the first key in the returned object
  //       const gameKey = Object.keys(gameData)[0];
  //       return gameData[gameKey].CurricularName; 
  //     }
  //     return 'UnknownGame';
  //   } catch (error) {
  //     console.error('Error getting game name:', error);
  //     return 'UnknownGame';
  //   }
  // };

  // // Get level name from curricularID
  // const getLevelName = async () => {
  //   try {
  //     const levelData = await getCurricularDataByUUID(curricularID);
  //     if (levelData) {
  //       // Extract the first key in the returned object
  //       const levelKey = Object.keys(levelData)[0];
  //       return levelData[levelKey].CurricularName;
  //     }
  //     return 'UnknownLevel';
  //   } catch (error) {
  //     console.error('Error getting level name:', error);
  //     return 'UnknownLevel';
  //   }
  // };

  // Format the event type (Insight, Intuition, etc.)
  const formatEventType = (eventType) => {
    return eventType.charAt(0).toUpperCase() + eventType.slice(1);
  };

  // Upload the video to Firebase Storage
  const uploadVideo = async (blob, filename, recordingPhase) => {
    try {
      console.log(`Uploading video for phase: ${recordingPhase}, filename: ${filename}`);
      const videoRef = ref(storage, `videos/${filename}`);
      await uploadBytes(videoRef, blob);
      const downloadURL = await getDownloadURL(videoRef);
      console.log('Video uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading video:', error);
      return null;
    }
  };

  const startRecording = async (recordingPhase) => {
    recordedChunksRef.current = [];
    // if (!streamRef.current) return;
    
    if (!streamRef.current) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        console.log("Audio tracks is included:", streamRef.current.getAudioTracks().length > 0);
      } catch (error) {
        console.error("Audio device access failed. Only video is recorded", error);
        // If audio access fails, record video only
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
      }
    }

    try {
      // Store the phase at the start of recording - this won't change even if app phase changes
      recordingPhaseRef.current = recordingPhase;
      console.log(`Setting up recording for phase: ${recordingPhase}`);
      
      const options = { mimeType: 'video/mp4; codecs=vp9,opus' };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Use the phase that was active when recording started
      const recordingPhaseValue = recordingPhase;
      
      // Stop the recording, get metadata, and upload the video
      mediaRecorderRef.current.onstop = async () => {
        console.log(`Recording stopped for phase: ${recordingPhaseValue}`);
        if (recordedChunksRef.current.length === 0) {
          console.warn('No recorded chunks available');
          return;
        }
        
        const blob = new Blob(recordedChunksRef.current, { type: mediaRecorderRef.current.mimeType });
        
        try {
          // Get all the necessary data for the filename
          const currentDate = new Date();
          const formattedDate = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1)
            .toString().padStart(2, "0")}${currentDate.getDate().toString().padStart(2, "0")}_${currentDate.getHours().toString().padStart(2, "0")}h${currentDate.getMinutes().toString().padStart(2, "0")}m${currentDate.getSeconds().toString().padStart(2, "0")}s`;
            // .padStart(2, "0")}${currentDate
            // .getDate()
            // .toString()
            // .padStart(2, "0")}${currentDate.getFullYear().toString().slice(-2)}`;
            // .padStart(2, "0")}${currentDate.getDate().toString().padStart(2, "0")}`;
            
          const username = await getUserNameFromDatabase();
          const participantID = username ? username.padStart(3, '0') : '000';
          
          const gameNameResult = await getGameDetails();
          const gameNameFormatted = gameNameResult.replace(/\s+/g, '');

          const levelNameResult = await getLevelDetails();
          
          // Use the phase that was captured when recording started
          const eventType = formatEventType(recordingPhaseValue || 'unknown');
          
          // Create the filename with the correct phase
          const filename = `${formattedDate}_${participantID}_${gameNameFormatted}_${levelNameResult}_${eventType}.mp4`;
          
          console.log('Generated filename:', filename);
          console.log('Using event type:', eventType, 'from recording phase:', recordingPhaseValue);
          
          // Pass the recording phase along with the upload for logging
          await uploadVideo(blob, filename, recordingPhaseValue);
          
        } catch (error) {
          console.error('Error generating filename or uploading video:', error);
          const fallbackFilename = `video_${new Date().getTime()}_${recordingPhaseValue || 'unknown'}.mp4`;
          await uploadVideo(blob, fallbackFilename, recordingPhaseValue || 'unknown');
        }
      };
      
      mediaRecorderRef.current.start();
      console.log(`Recording started for phase: ${recordingPhase}`);
    } catch (e) {
      console.error("Error creating MediaRecorder", e);
    }
  };

  // This component does not render any UI
  return null;
};

export default VideoRecorder;