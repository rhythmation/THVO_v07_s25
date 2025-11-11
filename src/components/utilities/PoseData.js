import { useEffect, useState, useRef, useCallback } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic/holistic";
import { enrichLandmarks } from "../Pose/landmark_utilities";

const usePoseData = () => {
  const [poseData, setPoseData] = useState({});
  const [cameraStatus, setCameraStatus] = useState("not-initialized");
  const [microphoneStatus, setMicrophoneStatus] = useState("not-initialized");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const cameraRef = useRef(null);
  const holisticRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const audioContextRef = useRef(null);

  /** Request permissions */
  const initializePermissions = useCallback(async () => {
    try {
      setError(null);
      setCameraStatus("requesting");
      setMicrophoneStatus("requesting");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      setCameraStatus(hasVideo ? "granted" : "error");
      setMicrophoneStatus(hasAudio ? "granted" : "error");

      stream.getTracks().forEach(track => track.stop());

      return hasVideo && hasAudio;
    } catch (err) {
      console.error("Permission error:", err);

      if (err.name === "NotAllowedError") {
        setCameraStatus("denied");
        setMicrophoneStatus("denied");
        setError("Camera and microphone permissions were denied. Please allow access and try again.");
      } else if (err.name === "NotFoundError") {
        setCameraStatus("error");
        setMicrophoneStatus("error");
        setError("Camera or microphone not found on your device.");
      } else {
        setCameraStatus("error");
        setMicrophoneStatus("error");
        setError("Technical error accessing camera/microphone: " + err.message);
      }
      return false;
    }
  }, []);

  /** Initialize microphone for audio processing */
  const initializeMicrophone = useCallback(async () => {
    try {
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (err) { console.warn(err); }
        audioContextRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // For future: Keep this if trying to make an audio node
      //const source = audioContext.createMediaStreamSource(stream);
      
      microphoneStreamRef.current = stream;
      audioContextRef.current = audioContext;
      
      setMicrophoneStatus("initialized");
      return true;
    } catch (err) {
      console.error("Microphone initialization error:", err);
      setMicrophoneStatus("error");
      setError("Failed to initialize microphone: " + err.message);
      return false;
    }
  }, []);

  /** Actually start the camera & holistic processing */
  const initializeCamera = useCallback(async () => {
    const videoElement = document.getElementsByClassName("input-video")[0];

    if (!videoElement) {
      setError("Video element not found");
      return false;
    }

    try {
      if (cameraRef.current?.stop) {
        try { cameraRef.current.stop(); } catch (err) { console.warn(err); }
        cameraRef.current = null;
      }
      if (holisticRef.current?.close) {
        try { holisticRef.current.close(); } catch (err) { console.warn(err); }
        holisticRef.current = null;
      }

      const holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true,
        refineFaceLandmarks: true,
      });

      holistic.onResults((results) => {
        if (isMountedRef.current) {
          setPoseData(enrichLandmarks(results));
        }
      });

      const poseDetectionFrame = async () => {
        if (isMountedRef.current && holistic && videoElement) {
          try {
            await holistic.send({ image: videoElement });
          } catch (err) {
            console.warn("Pose detection error:", err);
          }
        }
      };

      const camera = new Camera(videoElement, {
        onFrame: poseDetectionFrame,
        width: window.innerWidth,
        height: window.innerHeight,
        facingMode: "environment",
      });

      await camera.start();

      cameraRef.current = camera;
      holisticRef.current = holistic;

      setCameraStatus("initialized");
      return true;
    } catch (err) {
      console.error("Camera initialization error:", err);
      setError("Failed to initialize camera: " + err.message);
      setCameraStatus("error");
      return false;
    }
  }, []);

  /** Complete initialization of both camera and microphone */
  const initializeDevices = useCallback(async () => {
    const cameraInit = await initializeCamera();
    const microphoneInit = await initializeMicrophone();
    
    const bothInitialized = cameraInit && microphoneInit;
    setIsInitialized(bothInitialized);
    
    return bothInitialized;
  }, [initializeCamera, initializeMicrophone]);

  /** Retry flow - ensures both camera and microphone are initialized */
  const retryInitialization = useCallback(async () => {
    const permissionsGranted = await initializePermissions();
    if (permissionsGranted) {
      await initializeDevices();
    }
  }, [initializePermissions, initializeDevices]);

  /** Auto-init on mount */
  useEffect(() => {
    const autoInit = async () => {
      const permissionsGranted = await initializePermissions();
      if (permissionsGranted) {
        await initializeDevices();
      }
    };
    autoInit();
  }, [initializePermissions, initializeDevices]);

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Cleanup camera
      try { cameraRef.current?.stop?.(); } catch {}
      cameraRef.current = null;
      
      // Cleanup holistic
      try { holisticRef.current?.close?.(); } catch {}
      holisticRef.current = null;
      
      // Cleanup microphone
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      
      // Cleanup audio context
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    poseData,
    cameraStatus,
    microphoneStatus,
    isInitialized,
    error,
    retryInitialization,
    canPlay: isInitialized && 
             cameraStatus === "initialized" && 
             microphoneStatus === "initialized",
    // Expose microphone stream and audio context for external use like speech recognition
    microphoneStream: microphoneStreamRef.current,
    audioContext: audioContextRef.current,
  };
};

export default usePoseData;