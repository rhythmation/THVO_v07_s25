import { useEffect, useState, useRef } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic/holistic";
import { enrichLandmarks } from "../Pose/landmark_utilities";

const usePoseData = () => {
  const [poseData, setPoseData] = useState({});
  const isMountedRef = useRef(true);

  useEffect(() => {
    const videoElement = document.getElementsByClassName("input-video")[0];

    if (!videoElement) return;

    const holistic = new Holistic({
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
      refineFaceLandmarks: true,
    });

    const poseDetectionFrame = async () => {
      if (isMountedRef.current) {
        await holistic.send({ image: videoElement });
      }
    };

    const camera = new Camera(videoElement, {
      onFrame: poseDetectionFrame,
      width: window.innerWidth,
      height: window.innerHeight,
      facingMode: "environment",
    });

    holistic.onResults((results) => {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setPoseData(enrichLandmarks(results));
      }
    });

    camera.start();

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      
      // Clean up resources
      camera.stop();
      holistic.close && holistic.close();
    };
  }, []);

  // Clean up the ref when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return poseData;
};

export default usePoseData;