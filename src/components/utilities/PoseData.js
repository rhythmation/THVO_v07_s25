import { useEffect, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic/holistic";
import { enrichLandmarks } from "../Pose/landmark_utilities";

const usePoseData = () => {
  const [poseData, setPoseData] = useState({});

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
      await holistic.send({ image: videoElement });
    };

    const camera = new Camera(videoElement, {
      onFrame: poseDetectionFrame,
      width: window.innerWidth,
      height: window.innerHeight,
      facingMode: "environment",
    });

    holistic.onResults((results) => {
      setPoseData(enrichLandmarks(results));
    });

    camera.start();

    return () => {
      camera.stop();
      holistic.close && holistic.close();
    };
  }, []);

  return poseData;
};

export default usePoseData;
