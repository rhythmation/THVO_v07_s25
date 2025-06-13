import React, { useState, useEffect, useCallback } from 'react';
import { Stage } from '@inlet/react-pixi';
import Pose from './Pose';

const interpolateLandmark = (start, end, progress) => {
  if (!start || !end) return null;
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
    z: start.z + (end.z - start.z) * progress,
    visibility: start.visibility,
  };
};

const interpolatePoseData = (startPose, endPose, progress) => {
  if (!startPose || !endPose) return null;

  const result = {
    faceLandmarks: [],
    image: startPose.image,
    leftHandLandmarks: [],
    multiFaceGeometry: [],
    poseLandmarks: [],
    rightHandLandmarks: [],
    segmentationMask: [],
    za: [],
  };

  if (startPose.poseLandmarks && endPose.poseLandmarks) {
    result.poseLandmarks = startPose.poseLandmarks.map((landmark, i) =>
      interpolateLandmark(landmark, endPose.poseLandmarks[i], progress)
    );
  }

  if (startPose.rightHandLandmarks && endPose.rightHandLandmarks) {
    result.rightHandLandmarks = startPose.rightHandLandmarks.map((landmark, i) =>
      interpolateLandmark(landmark, endPose.rightHandLandmarks[i], progress)
    );
  }

  if (startPose.leftHandLandmarks && endPose.leftHandLandmarks) {
    result.leftHandLandmarks = startPose.leftHandLandmarks.map((landmark, i) =>
      interpolateLandmark(landmark, endPose.leftHandLandmarks[i], progress)
    );
  }

  if (startPose.faceLandmarks && endPose.faceLandmarks) {
    result.faceLandmarks = startPose.faceLandmarks.map((landmark, i) =>
      interpolateLandmark(landmark, endPose.faceLandmarks[i], progress)
    );
  }

  return result;
};

const easeInOutCubic = t =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const Tween = ({
  poses = [],
  duration = 2000,
  width = 800,
  height = 600,
  loop = false,
  onComplete = () => {}
}) => {
  const [currentPose, setCurrentPose] = useState(null);
  const [startTime, setStartTime] = useState(null);
  console.log("Tween component rendered with poses:", poses);

  const animate = useCallback(
    (timestamp) => {
        if (!startTime) {
        setStartTime(timestamp);
        requestAnimationFrame(animate);
        return;
        }

        const elapsed = timestamp - startTime;
        const totalDuration = duration * (poses.length - 1);
        let progress = elapsed / totalDuration;

        const absoluteProgress = progress * (poses.length - 1);
        const currentIndex = Math.min(Math.floor(absoluteProgress), poses.length - 2);
        const nextIndex = Math.min(currentIndex + 1, poses.length - 1);
        const segmentProgress = absoluteProgress - currentIndex;

        if (progress >= 1) {
        if (loop) {
            setStartTime(timestamp);
        } else {
            setCurrentPose(poses[poses.length - 1]);
            onComplete();
            return;
        }
        } else {
        const easedProgress = easeInOutCubic(segmentProgress);
        const interpolatedPose = interpolatePoseData(
            poses[currentIndex],
            poses[nextIndex],
            easedProgress
        );
        setCurrentPose(interpolatedPose);
        }

        // Always keep animating unless return above
        requestAnimationFrame(animate);
    },
    [poses, duration, loop, startTime, onComplete]
    );

  useEffect(() => {
    if (poses.length > 1) {
      setStartTime(null);
      requestAnimationFrame(animate);
    }
  }, [animate, poses]);

  const poseToRender = currentPose || poses[0];

  return (
    <Stage width={width} height={height} options={{ backgroundColor: 0x000000 }}>
      {poseToRender && (
        <Pose
          poseData={poseToRender}
          colAttr={{ width, height, x: 0, y: 0 }}
          similarityScores={null}
          modelBodySegments={null}
        />
      )}
    </Stage>
  );
};

export default Tween;