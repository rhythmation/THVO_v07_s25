import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  loop = 0, // Number of times to loop (0 = no loop, -1 = infinite)
  steps = 60,
  ease = false,
  onComplete = () => {}
}) => {
  const [currentPose, setCurrentPose] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  
  const startTimeRef = useRef(null);
  const animationIdRef = useRef(null);
  const completedRef = useRef(false);
  const lastPosesRef = useRef(poses);

  // Reset when poses change
  useEffect(() => {
    if (poses !== lastPosesRef.current) {
      lastPosesRef.current = poses;
      completedRef.current = false;
      startTimeRef.current = null;
      setCurrentStep(0);
      setLoopCount(0);
    }
  }, [poses]);

  const updatePoseFromStep = useCallback((step) => {
    if (poses.length === 0) return;
    if (poses.length === 1) {
      setCurrentPose(poses[0]);
      return;
    }

    const totalSteps = steps * (poses.length - 1);
    const clampedStep = Math.max(0, Math.min(totalSteps, step));
    const progress = clampedStep / totalSteps;
    
    const absoluteProgress = progress * (poses.length - 1);
    const currentIndex = Math.min(Math.floor(absoluteProgress), poses.length - 2);
    const nextIndex = Math.min(currentIndex + 1, poses.length - 1);
    const segmentProgress = absoluteProgress - currentIndex;
    
    const finalProgress = ease ? easeInOutCubic(segmentProgress) : segmentProgress;
    const interpolatedPose = interpolatePoseData(
      poses[currentIndex],
      poses[nextIndex],
      finalProgress
    );
    setCurrentPose(interpolatedPose);
  }, [poses, steps, ease]);

  const animate = useCallback((timestamp) => {
    if (poses.length <= 1) return;

    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const totalDuration = duration * (poses.length - 1);
    const totalSteps = steps * (poses.length - 1);
    
    const targetStep = Math.floor((elapsed / totalDuration) * totalSteps);
    
    setCurrentStep(targetStep);

    if (targetStep >= totalSteps) {
      updatePoseFromStep(totalSteps);
      
      if (loop === -1 || loopCount < loop) {
        startTimeRef.current = timestamp;
        setCurrentStep(0);
        setLoopCount(prev => prev + 1);
      } else {
        // Only call onComplete once
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
        return;
      }
    } else {
      updatePoseFromStep(targetStep);
    }

    animationIdRef.current = requestAnimationFrame(animate);
  }, [poses, duration, loop, onComplete, steps, updatePoseFromStep, loopCount, ease]);

  // Start animation
  useEffect(() => {
    if (poses.length > 1) {
      animationIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [animate, poses]);

  // Initialize first pose
  useEffect(() => {
    if (poses.length > 0 && !currentPose) {
      setCurrentPose(poses[0]);
    }
  }, [poses, currentPose]);

  const poseToRender = currentPose || poses[0];

  return (
    <>
      {poseToRender && (
        <Pose
          poseData={poseToRender}
          colAttr={{ width, height, x: 200, y: 100 }}
          similarityScores={null}
          modelBodySegments={null}
        />
      )}
    </>
  );
};

export default Tween;