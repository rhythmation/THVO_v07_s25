import { writeToDatabasePoseAuth } from "../../firebase/database";

// Blocking capture if landmarks are missing or invalid
function isPoseValid(poseData, state) {
   const requiredLandmarkKeys = [
      'poseLandmarks',
      'leftHandLandmarks',
      'rightHandLandmarks',
      'faceLandmarks',
   ];

   const VISIBILITY_THRESHOLD = 0.1;
   const VALID_RATIO_THRESHOLD = 0.77;  // Need to experiment for different use cases

   for (const key of requiredLandmarkKeys) {
      const group = poseData[key];

      if (!Array.isArray(group) || group.length === 0) {
         alert(`❌ Cannot capture. Missing ${key} in the ${state} pose.`);
         return false;
      }

      let validCount = 0;

      for (const kpt of group) {
         if (
            kpt &&
            typeof kpt.x === 'number' &&
            typeof kpt.y === 'number' &&
            (typeof kpt.visibility !== 'number' || kpt.visibility >= VISIBILITY_THRESHOLD)
         ) {
            validCount++;
         }
      }

      const ratio = validCount / group.length;

      if (ratio < VALID_RATIO_THRESHOLD) {
         alert(`❌ Cannot capture. Too many invalid ${key} landmarks in the ${state} pose.\n(${Math.round(ratio * 100)}% valid)`);
         return false;
      }
   }

   return true;
}

// Function will capture current pose on screen and depending on which box is selected,
// store it in a JSON file with the appropriate name. This function uses localStorage
// to temporarily save the poses, only when the uses 'Save' will the poses be pushed.
export function capturePose(poseData, state) {
   if (!isPoseValid(poseData, state)) {
      return false; // Block saving invalid poses
   }

   const poseJson = JSON.stringify(poseData);

   if (state === 'start') {
      localStorage.setItem('start.json', poseJson);
   } else if (state === 'intermediate') {
      localStorage.setItem('intermediate.json', poseJson);
   } else if (state === 'end') {
      localStorage.setItem('end.json', poseJson);
   }
   return true;
}

// Saves all active poses in localStorage to Firebase and resets localStorage.
export function saveConjecture() {
   // If 'start.json' exists in localStorage, retrieve data and push to Firebase.
   if (localStorage.getItem('start.json') !== null) {
      const startPose = localStorage.getItem('start.json');
      if (localStorage.getItem('Start Tolerance') !== null) {
         writeToDatabasePoseAuth(startPose, 'StartPose', localStorage.getItem('Start Tolerance'));
      }
   }

   // If 'intermediate.json' exists in localStorage, retrieve data and push to Firebase.
   if (localStorage.getItem('intermediate.json') !== null) {
      const intermediatePose = localStorage.getItem('intermediate.json');
      if (localStorage.getItem('Intermediate Tolerance') !== null) {
         writeToDatabasePoseAuth(intermediatePose, 'IntermediatePose', localStorage.getItem('Intermediate Tolerance'));
      }
   }

   // If 'end.json' exists in localStorage, retrieve data and push to Firebase.
   if (localStorage.getItem('end.json') !== null) {
      const endPose = localStorage.getItem('end.json');
      if (localStorage.getItem('End Tolerance') !== null) {
         writeToDatabasePoseAuth(endPose, 'EndPose', localStorage.getItem('End Tolerance'));
      }
   }
}

// removes all poses stored in localStorage.
export function resetConjecture() {
   localStorage.removeItem('start.json');
   localStorage.removeItem('Start Tolerance');
   localStorage.removeItem('intermediate.json');
   localStorage.removeItem('Intermediate Tolerance');
   localStorage.removeItem('end.json');
   localStorage.removeItem('End Tolerance');
}
