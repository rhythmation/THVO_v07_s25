// Firebase Init
import { ref, push, getDatabase, set, query, equalTo, get, orderByChild, orderByKey, onValue, child, startAt, endAt, remove, update } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { Curriculum } from "../components/CurricularModule/CurricularModule";
import { parse } from "querystring-es3";

import { convertJsonToCsv, } from "../firebase/jsonTOcsv.js";

// Import the uuid library
const { v4: uuidv4 } = require('uuid');

const db = getDatabase();

// Get the Firebase authentication instance
const auth = getAuth();

// Declare variables that change on user change -> these represent paths in the Firebase
let userId;
let userEmail;
let userName;
let userRole;
let date;
let readableDate;
let loginTime;

// --- Device identity (minimal) ---
let deviceId, deviceNickname, deviceSlug;
const sanitize = (s) => (s || "").toString().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64);

const ensureDeviceIdentity = () => {
  let id = localStorage.getItem("thvo_device_id");
  if (!id) {
    id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : uuidv4();
    localStorage.setItem("thvo_device_id", id);
  }
  let nick = localStorage.getItem("thvo_device_nickname");
  if (!nick || !nick.trim()) {
    const plat = navigator?.userAgentData?.platform || navigator?.platform || "device";
    nick = sanitize(plat);
    localStorage.setItem("thvo_device_nickname", nick);
  }
  deviceId = id;
  deviceNickname = nick;
  deviceSlug = sanitize(`${nick}-${id.substring(0, 8)}`);
};

// Declare variables that change on game state change
let eventType;
let gameId;
let conjectureId;

// Listen for changes to the authentication state
// and update the userId variable accordingly
onAuthStateChanged(auth, (user) => {
  userId = user.uid;
  userEmail = user.email;
  userName = userEmail.split('@')[0];
  date = new Date();
  loginTime = date.toUTCString();
  readableDate = formatDate(date);

  // NEW: ensure we have a stable per-device identity
  ensureDeviceIdentity();
});

// Function to Format date into readable format
// Function to add leading 0s to numbers to keep format
const padTo2Digits = (num) => {
  return num.toString().padStart(2, '0');
};

// Function to format date to YYYY-MM-DD (So it can be ordered easier)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = padTo2Digits(date.getMonth() + 1); // +1 because months are 0-indexed
  const day = padTo2Digits(date.getDate());

  return `${year}-${month}-${day}`;
};

// Define data keys for the text inputs of conjectures
export const keysToPush = [
  "Conjecture Name",
  "Author Name",
  "PIN",
  "Conjecture Keywords",
  "Conjecture Description",
  "Multiple Choice 1",
  "Multiple Choice 2",
  "Multiple Choice 3",
  "Multiple Choice 4",
  "Correct Answer",
];

// text boxes for the curricular editor
export const curricularTextBoxes = [ 
  "CurricularName", // if these are renamed, keep the order the same
  "CurricularAuthor", 
  "CurricularKeywords",
  "CurricularPIN",
]

// Frame buffer to store poses before batch writing
let frameBuffer = [];
let sessionInitialized = false;
let flushPromises = []; // Track batch write promises for promise checking
let lastEventType = null; // Track last known event type for change detection

// Initialize session with static data (call once per session)
export const initializeSession = async (gameId, frameRate, UUID) => {
  if (sessionInitialized) return; // Prevent duplicate initialization
  
  const dateObj = new Date();
  const timestampGMT = dateObj.toUTCString();
  
  if (eventType !== null) {
    const sessionRef = ref(db, `_PoseData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${UUID}`);
    
    // All static data
    const sessionData = {
      userId,
      userName,
      deviceId,
      deviceNickname,
      frameRate,
      loginTime,
      sessionStartTime: timestampGMT,
    };
    
    // Store session metadata once
    await set(sessionRef, sessionData);
    sessionInitialized = true;
    lastEventType = null; // Start with null so first event gets detected
    console.log('Session initialized with static data');
  }
};

// Buffer frame data (called every frame)
export const bufferPoseData = async (poseData, gameId, UUID, frameRate = 12) => {
  if (eventType === null) return;
  
  // Check for event type change and flush if needed
  if (eventType !== lastEventType && frameBuffer.length > 0) {
    console.log(`Event type changed from ${lastEventType} to ${eventType}, flushing buffer`);
    await flushFrameBuffer(gameId, UUID, frameRate);
  }
  
  const frameData = {
    pose: JSON.stringify(poseData),
    timestamp: new Date().toUTCString(),
  };
  
  frameBuffer.push(frameData);
};

// Batch write all buffered frames (call periodically)
export const flushFrameBuffer = async (gameId, UUID, frameRate = 12) => {
  if (frameBuffer.length === 0 || eventType === null) return;
  
  // Ensure session is initialized before writing frames
  if (!sessionInitialized) {
    console.warn('Session not initialized. Call initializeSession() first.');
    return;
  }
  
  try {
    const framesRef = ref(db, `_PoseData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${UUID}/frames/${eventType}`);
    
    // Create batch update object
    const updates = {};
    
    // Use padded timestamp to ensure chronological ordering in Firebase
    const batchTimestamp = Date.now();
    const paddedBatchId = batchTimestamp.toString().padStart(15, '0'); // Pad to 15 digits for proper sorting
    
    frameBuffer.forEach((frame, index) => {
      // Create keys that will sort chronologically: batch_000001692123456789_frame_00001
      const paddedIndex = index.toString().padStart(5, '0');
      updates[`batch_${paddedBatchId}_frame_${paddedIndex}`] = frame;
    });
    
    // Write all frames at once and track the promise
    const flushPromise = update(framesRef, updates);
    flushPromises.push(flushPromise);
    
    // Run promise checker to detect data loss
    promiseChecker(frameRate, flushPromises);
    
    await flushPromise;
    
    console.log(`Flushed ${frameBuffer.length} frames to database`);
    
    // Clear the buffer and update last known event type
    frameBuffer = [];
    lastEventType = eventType;
    
    return true;
  } catch (error) {
    console.error('Error flushing frame buffer:', error);
    return false;
  }
};

// Check for event type change and flush if needed
const checkEventTypeChange = async (gameId, UUID, frameRate = 12) => {
  if (eventType !== lastEventType && frameBuffer.length > 0) {
    console.log(`Event type changed from ${lastEventType} to ${eventType}, flushing buffer`);
    await flushFrameBuffer(gameId, UUID, frameRate);
    return true;
  }
  return false;
};

// Get current buffer size (useful for monitoring)
export const getBufferSize = () => frameBuffer.length;

// Force flush and reset session (call on session end)
export const endSession = async (gameId, UUID, frameRate = 12) => {
  // Flush any remaining frames
  await flushFrameBuffer(gameId, UUID, frameRate);
  
  // Wait for all pending flush promises to settle (like original implementation)
  await Promise.allSettled(flushPromises);
  
  // Reset session state
  sessionInitialized = false;
  frameBuffer = [];
  flushPromises = []; // Clear promise tracking
  lastEventType = null; // Reset event type tracking
  
  console.log('Session ended and cleaned up');
};

// Hybrid flush strategy
let MAX_BUFFER_SIZE = 50; // Make it mutable so it can be updated by options

export const bufferPoseDataWithAutoFlush = async (poseData, gameId, UUID, frameRate = 12) => {
  if (eventType === null) return;
  
  // Check for event type change first and flush if needed
  await checkEventTypeChange(gameId, UUID, frameRate);
  
  // Add to buffer
  bufferPoseData(poseData);
  
  // Immediate flush if buffer is getting too big (uses MAX_BUFFER_SIZE)
  if (frameBuffer.length >= MAX_BUFFER_SIZE) {
    console.log('Buffer size limit reached, flushing immediately');
    await flushFrameBuffer(gameId, UUID, frameRate);
  }
};

// Enhanced buffer function that checks for event changes
export const bufferPoseDataWithEventCheck = async (poseData, gameId, UUID, frameRate = 12) => {
  if (eventType === null) return;
  
  // Check for event type change and flush if needed
  const flushedDueToEventChange = await checkEventTypeChange(gameId, UUID, frameRate);
  
  // Add to buffer after potential flush
  bufferPoseData(poseData);
  
  return flushedDueToEventChange;
};

// Start hybrid auto-flush (time-based + size-based + event-change-based)
export const startSmartAutoFlush = (gameId, UUID, options = {}) => {
  const { 
    maxBufferSize = 100,     // This sets MAX_BUFFER_SIZE for immediate flushes
    flushIntervalMs = 8000,
    minBufferSize = 5,      // Don't flush tiny batches too often
    frameRate = 12          // Pass frameRate for promise checker
  } = options;
  
  // Update the global MAX_BUFFER_SIZE based on options
  MAX_BUFFER_SIZE = maxBufferSize;
  
  return setInterval(async () => {
    // Check for event type change first
    const flushedDueToEventChange = await checkEventTypeChange(gameId, UUID, frameRate);
    
    // Only do time-based flush if we didn't just flush due to event change
    if (!flushedDueToEventChange && frameBuffer.length >= minBufferSize) {
      console.log(`Auto-flushing ${frameBuffer.length} frames`);
      await flushFrameBuffer(gameId, UUID, frameRate);
    }
  }, flushIntervalMs);
};

export const stopAutoFlush = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

// Utility function to manually trigger event change check
export const forceEventTypeCheck = async (gameId, UUID, frameRate = 12) => {
  return await checkEventTypeChange(gameId, UUID, frameRate);
};

export const loadGameDialoguesFromFirebase = async (gameId) => {
  if (!gameId) {
    alert("No gameId provided!");
    return [];
  }
  const dbRef = ref(db, `Game/${gameId}/Dialogues`);
  const snapshot = await get(dbRef);
  return snapshot.exists() ? snapshot.val() : [];
};


export const writeToDatabasePoseAuth = async (poseData, state, tolerance) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();

  // Create a reference to the Firebase Realtime Database
  const dbRef = ref(db, "/PoseAuthoring");

  // Create an object to send to the database
  // This object includes the userId, poseData, conjectureId, frameRate, and timestamp
  const dataToSend = {
    userId,
    poseData,
    timestamp,
    state,
    tolerance,
  };

  // Push the data to the database using the dbRef reference
  const promise = push(dbRef, dataToSend);

  // Return the promise that push() returns
  return promise;
};

export const writeToDatabaseConjecture = async (existingUUID) => {
  try {
    const dateObj = new Date();
    const timestamp = dateObj.toISOString();
    const conjectureID = existingUUID ?? uuidv4();

    const dataToPush = {};

    const isAnyKeyNullOrUndefined = keysToPush.some((key) => {
      const value = localStorage.getItem(key);
      return value === null || value === undefined || value.trim() === '';
    });

    if (isAnyKeyNullOrUndefined) {
      alert("One or more text values are empty. Cannot publish conjecture to database.");
      return false;
    }

    const startJson = localStorage.getItem('start.json');
    const intermediateJson = localStorage.getItem('intermediate.json');
    const endJson = localStorage.getItem('end.json');

    if (!startJson || !intermediateJson || !endJson) {
      alert("One or more poses are missing. Cannot publish conjecture to database.");
      return false;
    }

    // Create pose objects
    const startPoseData = await createPoseObjects(startJson, 'StartPose', localStorage.getItem('Start Tolerance'));
    const intermediatePoseData = await createPoseObjects(intermediateJson, 'IntermediatePose', localStorage.getItem('Intermediate Tolerance'));
    const endPoseData = await createPoseObjects(endJson, 'EndPose', localStorage.getItem('End Tolerance'));

    // Populate dataToPush with text boxes
    await Promise.all(keysToPush.map(async (key) => {
      const value = localStorage.getItem(key);
      if (value && value.trim() !== '') {
        Object.assign(dataToPush, await createTextObjects(key, value));
      }
    }));

    // Prepare search words
    const searchWordsToPush = {
      "Author Name": dataToPush["Author Name"],
      "Conjecture Description": dataToPush["Conjecture Description"],
      "Conjecture Keywords": dataToPush["Conjecture Keywords"],
      "Conjecture Name": dataToPush["Conjecture Name"]
    };

    const concatenatedSearchWords = Object.values(searchWordsToPush).join(" ").toLowerCase();
    const wordsArray = concatenatedSearchWords.split(" ");
    const searchWordsToPushToDatabase = {};

    wordsArray.forEach(word => {
      const cleanWord = word.replace(/[.#$/\[\]/]/g, '');
      if (cleanWord) searchWordsToPushToDatabase[cleanWord] = cleanWord;
    });

    // Firebase path
    const conjecturePath = `Level/${conjectureID}`;

    // Push to Firebase
    const promises = [
      set(ref(db, `${conjecturePath}/Time`), timestamp),
      set(ref(db, `${conjecturePath}/AuthorID`), userId),
      set(ref(db, `${conjecturePath}/UUID`), conjectureID),
      set(ref(db, `${conjecturePath}/PIN`), localStorage.getItem("PIN")),
      set(ref(db, `${conjecturePath}/Start Pose`), startPoseData),
      set(ref(db, `${conjecturePath}/Intermediate Pose`), intermediatePoseData),
      set(ref(db, `${conjecturePath}/End Pose`), endPoseData),
      set(ref(db, `${conjecturePath}/Text Boxes`), dataToPush),
      set(ref(db, `${conjecturePath}/Search Words`), searchWordsToPushToDatabase),
      set(ref(db, `${conjecturePath}/Name`), dataToPush["Conjecture Name"]),
      set(ref(db, `${conjecturePath}/Start Tolerance`), localStorage.getItem('Start Tolerance')),
      set(ref(db, `${conjecturePath}/Intermediate Tolerance`), localStorage.getItem('Intermediate Tolerance')),
      set(ref(db, `${conjecturePath}/End Tolerance`), localStorage.getItem('End Tolerance')),
      set(ref(db, `${conjecturePath}/isFinal`), true)
    ];

    await Promise.all(promises);
    alert("Conjecture successfully published to database.");
    return true;

  } catch (error) {
    console.error("Error writing conjecture to database:", error);
    alert("An unexpected error occurred. Could not publish conjecture.");
    return false;
  }
};


// save a draft of the current conjecture so it can be published later
export const writeToDatabaseConjectureDraft = async (existingUUID) => {
  try {
    const dateObj = new Date();
    const timestamp = dateObj.toISOString();
    const conjectureID = existingUUID ?? uuidv4();

    const dataToPush = {};
    let noName = false;

    // Process text box values
    await Promise.all(keysToPush.map(async (key) => {
      const value = localStorage.getItem(key);

      // If the value is undefined or empty, save it as "undefined" and flag noName if needed
      const sanitizedValue = value === undefined || value === null || value.trim() === '' ? "undefined" : value;

      Object.assign(dataToPush, await createTextObjects(key, sanitizedValue));

      if (key === "Conjecture Name" && sanitizedValue === "undefined") {
        noName = true;
      }
    }));

    if (noName) {
      alert("Please name your level before saving a draft.");
      return false;
    }

    // Prepare search words
    const searchWordsToPush = {
      "Author Name": dataToPush["Author Name"],
      "Conjecture Description": dataToPush["Conjecture Description"],
      "Conjecture Keywords": dataToPush["Conjecture Keywords"],
      "Conjecture Name": dataToPush["Conjecture Name"]
    };

    const concatenatedSearchWords = Object.values(searchWordsToPush).join(" ").toLowerCase();
    const wordsArray = concatenatedSearchWords.split(" ");
    const searchWordsToPushToDatabase = {};

    wordsArray.forEach(word => {
      const cleanWord = word.replace(/[.#$/\[\]/]/g, '');
      if (cleanWord) searchWordsToPushToDatabase[cleanWord] = cleanWord;
    });

    // Create pose data
    const startJson = localStorage.getItem('start.json');
    const intermediateJson = localStorage.getItem('intermediate.json');
    const endJson = localStorage.getItem('end.json');

    const startPoseData = await createPoseObjects(startJson, 'StartPose', localStorage.getItem('Start Tolerance'));
    const intermediatePoseData = await createPoseObjects(intermediateJson, 'IntermediatePose', localStorage.getItem('Intermediate Tolerance'));
    const endPoseData = await createPoseObjects(endJson, 'EndPose', localStorage.getItem('End Tolerance'));

    // Firebase path
    const conjecturePath = `Level/${conjectureID}`;

    const promises = [
      set(ref(db, `${conjecturePath}/Time`), timestamp),
      set(ref(db, `${conjecturePath}/Start Pose`), startPoseData),
      set(ref(db, `${conjecturePath}/Intermediate Pose`), intermediatePoseData),
      set(ref(db, `${conjecturePath}/End Pose`), endPoseData),
      set(ref(db, `${conjecturePath}/Text Boxes`), dataToPush),
      set(ref(db, `${conjecturePath}/Search Words`), searchWordsToPushToDatabase),
      set(ref(db, `${conjecturePath}/UUID`), conjectureID),
      set(ref(db, `${conjecturePath}/Start Tolerance`), localStorage.getItem('Start Tolerance')),
      set(ref(db, `${conjecturePath}/Intermediate Tolerance`), localStorage.getItem('Intermediate Tolerance')),
      set(ref(db, `${conjecturePath}/End Tolerance`), localStorage.getItem('End Tolerance')),
      set(ref(db, `${conjecturePath}/isFinal`), false)
    ];

    await Promise.all(promises);
    alert("Draft saved.");
    return true;

  } catch (error) {
    console.error("Error saving draft:", error);
    alert("An unexpected error occurred. Draft not saved.");
    return false;
  }
};



export const deleteFromDatabaseConjecture = async (existingUUID) => {
  if (!existingUUID) {
    return alert("No level ID provided for deletion.");
  }
  
  try {
    // First, remove the level from any curricular games that reference it
    await removeLevelFromCurricularGames(existingUUID);
    
    // Then, remove the level itself from the database
    const conjecturePath = `Level/${existingUUID}`;
    const dbRef = ref(db, conjecturePath);
    
    // Remove the entire level from database
    await remove(dbRef);

    return alert("Level deleted successfully and removed from all games.");
  } catch (error) {
    console.error('Error deleting level:', error);
    return alert("Error deleting level. Please try again.");
  }
};

// Helper function to remove a level from all curricular games that reference it
const removeLevelFromCurricularGames = async (levelUUID) => {
  try {
    // Get all games from the database
    const gamesRef = ref(db, 'Game');
    const gamesSnapshot = await get(gamesRef);
    
    if (!gamesSnapshot.exists()) {
      console.log("No games found in database");
      return;
    }
    
    const games = gamesSnapshot.val();
    const updatePromises = [];
    
    // Iterate through all games to find ones that reference the level
    for (const gameKey in games) {
      const game = games[gameKey];
      
      // Check if this game has ConjectureUUIDs and if it contains the level we're deleting
      if (game.ConjectureUUIDs && Array.isArray(game.ConjectureUUIDs)) {
        const levelIndex = game.ConjectureUUIDs.indexOf(levelUUID);
        
        if (levelIndex !== -1) {
          // Remove the level UUID from the array
          const updatedConjectureUUIDs = game.ConjectureUUIDs.filter(uuid => uuid !== levelUUID);
          
          // Update the game in the database
          const gameRef = ref(db, `Game/${gameKey}/ConjectureUUIDs`);
          updatePromises.push(set(gameRef, updatedConjectureUUIDs));
          
          console.log(`Removed level ${levelUUID} from game ${game.CurricularName || gameKey}`);
        }
      }
    }
    
    // Execute all updates
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`Level ${levelUUID} removed from ${updatePromises.length} games`);
    } else {
      console.log(`Level ${levelUUID} was not referenced in any games`);
    }
    
  } catch (error) {
    console.error('Error removing level from curricular games:', error);
    throw error;
  }
};


// Helper function to create pose objects for the writeToDatabaseConjecture function 
const createPoseObjects = async (poseData, state, tolerance) => {
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();

  const dataToSend = {
    userId,
    poseData,
    timestamp,
    state,
    tolerance,
  };

  // Returns pose data
  return dataToSend;
}

// Helper function to create text objects for the writeToDatabaseConjecture function 
const createTextObjects = async (key, value) => {
  const dataToSend = {
    [key]: value,
  };

  // Returns text data 
  return dataToSend;
}

// Set the initial time of the last alert to the current time
let lastAlertTime = Date.now();

// Define a function to check the status of a set of promises
export const promiseChecker = async (frameRate, promises) => {
  // Set the data loss threshold and check interval in seconds
  const dataLossThresholdInSeconds = 2;
  const checkIntervalInSeconds = 10;

  // Calculate the number of frame packages and the data loss threshold in frames
  const totalFramePackages = checkIntervalInSeconds * frameRate;
  const dataLossThreshold = dataLossThresholdInSeconds * frameRate;

  // Calculate the starting index for the promises to check
  const startIndex = Math.max(promises.length - totalFramePackages - 1, 0);

  // Get the promises to check
  const promisesToCheck = promises.slice(startIndex);

  // Count the number of rejected promises
  const totalRejections = await countRejectedPromises(promisesToCheck);

  // If the number of rejected promises is greater than the data loss threshold, alert the user
  if (totalRejections > dataLossThreshold) {
    // Get the current time
    const currentTime = Date.now();

    // Check if enough time has passed since the last alert
    if (currentTime - lastAlertTime > checkIntervalInSeconds * 1000) {
      // Alert the user
      alert(
        "The program is not sending enough data to the database. Please check the internet connection/connection speed to make sure that it can support data collection for this experiment."
      );

      // Update the last alert time
      lastAlertTime = currentTime;
    }
  } else {
    // If there is no data loss, log a message to the console
    console.log("No data loss detected");
  }
};

// Define a function to count the number of rejected promises
const countRejectedPromises = async (promises) => {
  let rejectedCount = 0;

  // Use Promise.allSettled to check the status of each promise
  await Promise.allSettled(
    promises.map((promise) => {
      return promise
        .then(() => {
          // If the promise is resolved, do nothing
        })
        .catch(() => {
          // If the promise is rejected, increment the rejected count
          rejectedCount++;
        });
    })
  );

  // Return the total number of rejected promises
  return rejectedCount;
};

  /**
   * @function handleSave
   * @description Saves the current game as a draft or publishes it.
   * It performs a check to ensure the game name is unique before saving.
   * @param {string|null} UUID - The unique identifier for the game. If null, a new UUID will be generated.
   * @param {boolean} isFinal - True to publish, false to save as a draft.
   * @returns {Promise<boolean>} - Returns true if the save was successful, false otherwise.
   * Files using this function: CurricularModule.js
   * TODO: Add a last edited by field
   */
  export const saveGame = async (UUID = null, isFinal = false) => {
    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to save a game.");
      return false;
    }

    const gameName = localStorage.getItem('CurricularName');
    const currentUUID = UUID || uuidv4();

    if (!gameName || gameName.trim() === "") {
      alert("Please enter a game name before saving.");
      return false;
    }

    const gameNameKey = gameName.trim();

    // --- START: UNIQUE NAME VALIDATION ---
    const gameNamesRef = ref(db, `gameNames/${gameNameKey}`);
    const snapshot = await get(gameNamesRef);

    if (snapshot.exists() && snapshot.val() !== currentUUID) {
      alert("This game name is already taken. Please choose a different name.");
      return false;
    }
    // --- END: UNIQUE NAME VALIDATION ---

    // --- START: VALIDATION FOR PUBLISHING ---
    if (isFinal) {
      const missingFields = curricularTextBoxes.filter((key) => {
        const val = localStorage.getItem(key);
        return val == null || val.trim() === "";
      });

      if (missingFields.length > 0) {
        alert("One or more text fields are empty. Please fill out all required fields before publishing.");
        return false;
      }

      const conjectures = Curriculum.getCurrentConjectures();
      if (!conjectures || conjectures.length === 0) {
        alert("Please add at least one level (conjecture) to your game before publishing.");
        return false;
      }
    }
    // --- END: VALIDATION FOR PUBLISHING ---

    // Proceed with saving the game
    try {
      const conjectureUUIDs = Curriculum.getCurrentConjectures().map(c => c.UUID);
      const existingDialogues = await loadGameDialoguesFromFirebase(currentUUID) || [];
      const userId = user.uid;
      const userName = user.email.split('@')[0];

      const gameData = {
        CurricularName: gameName,
        CurricularAuthor: localStorage.getItem('CurricularAuthor') || "Unknown",
        CurricularKeywords: localStorage.getItem('CurricularKeywords') || "",
        CurricularPIN: localStorage.getItem('CurricularPIN') || "",
        ConjectureUUIDs: conjectureUUIDs,
        isFinal: isFinal,
        UUID: currentUUID,
        Time: new Date().toISOString(),
        Author: userName,
        AuthorID: userId,
        Dialogues: existingDialogues
      };

      const updates = {};
      updates[`/Game/${currentUUID}`] = gameData;
      updates[`/gameNames/${gameNameKey}`] = currentUUID;

      await update(ref(db), updates);

      alert(`Game ${isFinal ? "published" : "saved as draft"} successfully!`);
      Curriculum.setCurrentUUID(currentUUID);
      return true;

    } catch (error) {
      console.error("Error saving game:", error);
      alert("An error occurred while saving the game. Please see the console for details.");
      return false;
    }
};

export const deleteFromDatabaseCurricular = async (UUID) => {
  if (!UUID) {
    return alert("No game ID provided for deletion.");
  }

  try {
    const CurricularPath = `Game/${UUID}`;
    const dbRef = ref(db, CurricularPath);
    
    // Remove the entire game from database
    await remove(dbRef);
    
    return alert("Game deleted successfully.");
  } catch (error) {
    console.error('Error deleting game:', error);
    return alert("Error deleting game. Please try again.");
  }
};


// save dialogues to firebase
export const saveNarrativeDraftToFirebase = async (UUID, dialogues) => {
  const timestamp = new Date().toISOString();
  const gameId = UUID ?? uuidv4(); // Use provided UUID or create new one
  const dbRef = ref(db, `Game/${gameId}/Dialogues`);

  const promises = [
    set(ref(db, `Game/${gameId}/Dialogues`), dialogues),
    set(ref(db, `Game/${gameId}/LastSaved`), timestamp),
    set(ref(db, `Game/${gameId}/UUID`), gameId),
    //set(ref(db, `Game/${gameId}/isFinal`), false),   DONT MODIFY THE ORIGINAL VALUE
    // Optional: auto-set author again for traceability
    set(ref(db, `Game/${gameId}/AuthorID`), userId),
    set(ref(db, `Game/${gameId}/Author`), userName),
  ];

  await Promise.all(promises);
};


// Define a function to retrieve a conjecture based on UUID
export const getConjectureDataByUUID = async (conjectureID) => {
  try {
    // ref the realtime db
    const dbRef = ref(db, 'Level');
    // query to find data with the UUID
    const q = query(dbRef, orderByChild('UUID'), equalTo(conjectureID));
    
    // Execute the query
    const querySnapshot = await get(q);

    // check the snapshot
    if (querySnapshot.exists()) {
      const data = querySnapshot.val();
      return data; // return the data if its good
    } else {
      return null; // This will happen if data not found
    }
  } catch (error) {
    throw error; // this is an actual bad thing
  }
};

// Define a function to retrieve a conjecture based on UUID
export const getCurricularDataByUUID = async (curricularID) => {
  try {
    // ref the realtime db
    const dbRef = ref(db, 'Game');
    // query to find data with the UUID
    const q = query(dbRef, orderByChild('UUID'), equalTo(curricularID));
    
    // Execute the query
    const querySnapshot = await get(q);

    // check the snapshot
    if (querySnapshot.exists()) {
      const data = querySnapshot.val();
      return data; // return the data if its good
    } else {
      return null; // This will happen if data not found
    }
  } catch (error) {
    throw error; // this is an actual bad thing
  }
};

// Define a function to retrieve an array of conjectures based on AuthorID
export const getConjectureDataByAuthorID = async (authorID) => {
  try {
    // ref the realtime db
    const dbRef = ref(db, 'Level');
    // query to find data with the AuthorID
    const q = query(dbRef, orderByChild('AuthorID'), equalTo(authorID));
    
    // Execute the query
    const querySnapshot = await get(q);

    // check the snapshot
    if (querySnapshot.exists()) {
      // get all the conjectures in an array
      const conjectures = [];
      querySnapshot.forEach((conjectureSnapshot) => {
        conjectures.push(conjectureSnapshot.val());
      });
      return conjectures; // return the data if its good
    } else {
      return null; // This will happen if data not found
    }
  } catch (error) {
    throw error; // this is an actual bad thing
  }
};

// Define a function to retrieve an array of conjectures based on PIN
export const getConjectureDataByPIN = async (PIN) => {
  try {
    // ref the realtime db
    const dbRef = ref(db, 'Level');
    // query to find data with the PIN
    const q = query(dbRef, orderByChild('PIN'), equalTo(PIN));
    
    // Execute the query
    const querySnapshot = await get(q);

    // check the snapshot
    if (querySnapshot.exists()) {
      // get all the conjectures in an array
      const conjectures = [];
      querySnapshot.forEach((conjectureSnapshot) => {
        conjectures.push(conjectureSnapshot.val());
      });
      return conjectures; // return the data if its good
    } else {
      return null; // This will happen if data not found
    }
  } catch (error) {
    throw error; // this is an actual bad thing
  }
};

// get a list of all the levels
export const getConjectureList = async (final) => {
  try {
    // ref the realtime db
    const dbRef = ref(db, 'Level');

    // query to find data
    let q;
    if (final){ //return only the final (complete) conjectures
      q = query(dbRef, orderByChild('isFinal'), equalTo(final));
    }
    else{ // return both final conjectures (complete) and drafts of conjectures (incomplete)
      q = query(dbRef, orderByChild('isFinal'));
    }
    
    // Execute the query
    const querySnapshot = await get(q);

    // check the snapshot
    if (querySnapshot.exists()) {
      // get all the conjectures in an array
      const conjectures = [];
      querySnapshot.forEach((conjectureSnapshot) => {
        conjectures.push(conjectureSnapshot.val());
      });
      return conjectures; // return the data if its good
    } else {
      return null; // This will happen if data not found
    }
  } catch (error) {
    throw error; // this is an actual bad thing
  }
};


// get a list of all the games
export const getCurricularList = async (final) => {
  try {
    // ref the realtime db
    const dbRef = ref(db, 'Game');

    // query to find data
    let q;
    if (final){ //return only the final (complete) conjectures
      q = query(dbRef, orderByChild('isFinal'), equalTo(final));
    }
    else{ // return both final conjectures (complete) and drafts of conjectures (incomplete)
      q = query(dbRef, orderByChild('isFinal'));
    }
    
    // Execute the query
    const querySnapshot = await get(q);

    // check the snapshot
    if (querySnapshot.exists()) {
      // get all the conjectures in an array
      const curricular = [];
      querySnapshot.forEach((curricularSnapshot) => {
        curricular.push(curricularSnapshot.val());
      });
      return curricular; // return the data if its good
    } else {
      return null; // This will happen if data not found
    }
  } catch (error) {
    throw error; 
  }
};

export const searchConjecturesByWord = async (searchWord) => {
  try {
    // Reference the realtime db
    const dbRef = ref(db, 'Level');

    // Query to find data
    const q = query(dbRef, orderByChild('Search Words'));

    // Execute the query
    const querySnapshot = await get(q);

    // Array to store matching conjectures
    const matchingConjectures = [];

    // This takes forever..............
    const normalizedSearchWord = searchWord?.toLowerCase?.() || "";
    const isCleared = normalizedSearchWord.trim() === ""; // Treat "" or all-spaces as cleared

    querySnapshot.forEach((snapshot) => {
      const searchData = snapshot.val();
      const searchWords = searchData?.['Search Words'];

      if (isCleared) {
        // If cleared or empty, show all
        matchingConjectures.push(searchData);
      } else if (searchWords) {
        // Case-insensitive check against searchWords keys
        for (const word of Object.keys(searchWords)) {
          if (word.toLowerCase() === normalizedSearchWord) {
            matchingConjectures.push(searchData);
            break; // stop checking more keys
          }
        }
      }
    });

    // Return the list of matching conjectures
    return matchingConjectures;
  } catch (error) {
    console.error('Error searching conjectures:', error);
    // Handle error appropriately
    return []; // Return an empty array in case of error
  }
};


// Write a new game select into database under gameid>>date>>studentid>>sessionid
export const writeToDatabaseNewSession = async (CurrId, CurrName, role) => {
  // Create a new date object to get a timestamp and readable timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();
 
  // Change game ID appropriately
  gameId = CurrName;
  userRole = role;

  // UPDATED: include device layer
  const sessionRoot = `_GameData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}`;

  // Create an object to send to the database
  // Some of these are placeholders for future values that aren't implemented yet i.e. Hints
  const promises = [
    set(ref(db, `_GameData/${gameId}/CurricularID`), CurrId),
    set(ref(db, `${sessionRoot}/UserId`), userId),
    set(ref(db, `${sessionRoot}/UserRole`), userRole),
    set(ref(db, `${sessionRoot}/DeviceID`), deviceId),               // NEW
    set(ref(db, `${sessionRoot}/DeviceNickname`), deviceNickname),   // NEW
    set(ref(db, `${sessionRoot}/GameStart`), timestamp),
    set(ref(db, `${sessionRoot}/GameStartGMT`), timestampGMT),
    set(ref(db, `${sessionRoot}/DaRep`), 'null'),
    set(ref(db, `${sessionRoot}/Hints/HintEnabled`), "null"),
    set(ref(db, `${sessionRoot}/Hints/HintCount`), "null"),
    set(ref(db, `${sessionRoot}/Hints/HintOrder`), "null"),
    set(ref(db, `${sessionRoot}/LatinSquareOrder`), "null"),
  ];

  // Return the promise that push() returns
  return promises;
};

// Write timestamp for pose start to the database
export const writeToDatabasePoseStart = async (poseNumber, ConjectureId, gameId) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // set event type to pose start
  eventType = poseNumber
  conjectureId = ConjectureId;

  // UPDATED: include device layer
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/${poseNumber} Begin`), timestamp),
    set(ref(db, `${userSession}/${poseNumber} Begin GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  return promises;
};

// Writes a pose match into the database. Separated for simplicity
export const writeToDatabasePoseMatch = async (poseNumber, gameId) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // UPDATED: include device layer
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/${poseNumber} Match`), timestamp),
    set(ref(db, `${userSession}/${poseNumber} Match GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  await Promise.all(promises);
};

// Write in the start of the truefalse phase
export const writeToDatabaseIntuitionStart = async (gameId) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // event type for pose data
  eventType = "Intuition";

  // UPDATED: include device layer
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Intuition Start`), timestamp),
    set(ref(db, `${userSession}/Intuition Start GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  await Promise.all(promises);
};

// Write in the end of the truefalse phase. 
export const writeToDatabaseIntuitionEnd = async (gameId) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // event type for pose data
  eventType = "Insight";

  // UPDATED: include device layer
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Intuition End/`), timestamp),
    set(ref(db, `${userSession}/Intuition End GMT/`), timestampGMT),
  ];

  // Return the promise that push() returns
  await Promise.all(promises);
};

// Write in the second part of the true false phase
export const writeToDatabaseInsightStart = async (gameId = undefined) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // UPDATED: include device layer
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Insight Start/`), timestamp),
    set(ref(db, `${userSession}/Insight Start GMT/`), timestampGMT),
  ];

  // Return the promise that push() returns
  await Promise.all(promises);
};

// Write in the end of the second part of the true false phase
export const writeToDatabaseInsightEnd = async (gameId = undefined) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // UPDATED: include device layer
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${deviceSlug}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Insight End`), timestamp),
    set(ref(db, `${userSession}/Insight End GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  await Promise.all(promises);
};

// Search functionality that downloads a set of child nodes from a game based on inputted dates
export const getFromDatabaseByGame = async (selectedGame, gameId, selectedStart, selectedEnd ) => {
  try {
    // Create reference to the realtime database
    const posedbRef = ref(db, `_PoseData/${gameId}`);
    const eventdbRef = ref(db, `_GameData/${gameId}`);

    // Query to find data
    const poseq = query(posedbRef, orderByKey(), startAt(selectedStart), endAt(selectedEnd));
    const eventq = query(eventdbRef, orderByKey(), startAt(selectedStart), endAt(selectedEnd));
    // Execute the query
    const poseQuerySnapshot = await get(poseq);
    const eventQuerySnapshot = await get(eventq);

    const formattedStart = selectedStart.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedEnd = selectedEnd.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedGame = selectedGame.replace(/[^a-zA-Z0-9]/g, '_');

    // Check if data in snapshot exists
    if (poseQuerySnapshot.exists() && eventQuerySnapshot.exists()) {
      const poseData = poseQuerySnapshot.val();
      const eventData = eventQuerySnapshot.val();

      // Determine device label for filenames (single device => that slug; else MULTI_DEVICE)
      const collectDeviceLabel = (tree) => {
        const setD = new Set();
        for (const day in (tree || {})) {
          const users = tree[day] || {};
          for (const uname in users) {
            const devs = users[uname] || {};
            for (const dslug in devs) setD.add(dslug);
          }
        }
        return setD.size === 1 ? [...setD][0] : "MULTI_DEVICE";
      };
      const deviceLabel = sanitize(collectDeviceLabel(eventData));

      // Convert event log to JSON and download
      const eventjsonStr = JSON.stringify(eventData, null, 2);
      const eventDownload = document.createElement('a');
      eventDownload.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(eventjsonStr));
      eventDownload.setAttribute('download', `${formattedGame}__${deviceLabel}__event_log_${formattedStart}_to_${formattedEnd}.json`);
      document.body.appendChild(eventDownload);
      eventDownload.click();
      document.body.removeChild(eventDownload);

      // Convert pose data to JSON and download (takes longer)
      const posejsonStr = JSON.stringify(poseData, null, 2);
      const poseDownload = document.createElement('a');
      poseDownload.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(posejsonStr));
      poseDownload.setAttribute('download', `${formattedGame}__${deviceLabel}__pose_data_${formattedStart}_to_${formattedEnd}.json`);
      document.body.appendChild(poseDownload);
      poseDownload.click();
      document.body.removeChild(poseDownload);
      
    } else {
      return null; // This will happen if data not found
    }
  } catch (error) {
    throw error; 
  }
};

export const getFromDatabaseByGameCSV = async (selectedGame, gameId, selectedStart, selectedEnd) => {
  try {
    const eventdbRef = ref(db, `_GameData/${gameId}`);
    const eventq = query(eventdbRef, orderByKey(), startAt(selectedStart), endAt(selectedEnd));
    const eventQuerySnapshot = await get(eventq);

    const formattedStart = selectedStart.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedEnd = selectedEnd.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedGame = selectedGame.replace(/[^a-zA-Z0-9]/g, '_');

    if (eventQuerySnapshot.exists()) {
      const eventData = eventQuerySnapshot.val();

      // Determine device label (same logic as JSON export)
      const collectDeviceLabel = (tree) => {
        const setD = new Set();
        for (const day in (tree || {})) {
          const users = tree[day] || {};
          for (const uname in users) {
            const devs = users[uname] || {};
            for (const dslug in devs) setD.add(dslug);
          }
        }
        return setD.size === 1 ? [...setD][0] : "MULTI_DEVICE";
      };
      const deviceLabel = sanitize(collectDeviceLabel(eventData));
      
      // Convert to JSON string and let convertJsonToCsv handle the download
      const eventjsonStr = JSON.stringify(eventData);
      const result = await convertJsonToCsv(eventjsonStr, `${formattedGame}__${deviceLabel}`, formattedStart, formattedEnd);
      
      return result;
    } else {
      return null;
    }
  } catch (error) {
    throw error; 
  }
};

export const removeFromDatabaseByGame = async (selectedGame, selectedStart, selectedEnd) => {
  try {
    // Create reference to the realtime database
    const dbRef = ref(db, `_PoseData/${selectedGame}`);

    // Query to find data
    const q = query(dbRef, orderByKey(), startAt(selectedStart), endAt(selectedEnd));
    
    // Execute the query
    const querySnapshot = await get(q);

    // Check if the data exists
    if (querySnapshot.exists()) {
      const data = {};

      // Set each snapshot to null, deleting data
      querySnapshot.forEach((snapshot) => {
        data[snapshot.key] = null;
      })
      // Using await to handle errors
      const itemRef = ref(db, `_PoseData/${selectedGame}`);
      await remove(itemRef, data);
      
      return { success: true, message: 'Data removed.' };
    } else {
      return { success: false, message: 'No data to remove.' };
    }
  } catch (error) {
    throw error; // this is an actual bad thing
  }
};

export const checkGameAuthorization = async (gameName) => {
  try {
    const dbRef = ref(db, 'Game');
    const q = query(dbRef, orderByChild('CurricularName'), equalTo(gameName));
    const qSnapshot = await get(q);

    if (qSnapshot.exists()) {
      // If there is a game with this name, continue
      const p = query(dbRef, orderByChild('AuthorID'), equalTo(userId));
      const pSnapshopt = await get(p);
      // Only returns true if author matches current user
      if (pSnapshopt.exists()) {
        return true;
      } else {
        return false;
      }
    } else {
      // Returns null if the game does not exist at all
      return null; 
    }
  } catch (error) {
    throw error;
  }
};

export const getAuthorizedGameList = async () => {
  try {
    const dbRef = ref(db, 'Game');
    const q = query(dbRef, orderByChild('AuthorID'), equalTo(userId));
    const querySnapshot = await get(q);
    console.log("Query snapshot:", querySnapshot.val());

    if (querySnapshot.exists()) {
      // get all the conjectures in an array
      const authorizedCurricular = [];

      querySnapshot.forEach((authorizedCurricularSnapshot) => {
        // push name string into list of authorized games
        authorizedCurricular.push(authorizedCurricularSnapshot.val().CurricularName);
      })
      return authorizedCurricular;

    } else {
      console.log("No data found");
      // return nothing if user has no created games
      return null;
    }
  } catch (error) {
    console.error("Error getting game list", error);
    throw error;
  }
};

// Get game name using game UUID
export const getGameNameByUUID = async (gameID) => {
  try {
    // if (!gameID) return 'UnknownGame';
    
    const gameData = await getCurricularDataByUUID(gameID);
    console.log('Game data', gameData);
    if (gameData && Object.keys(gameData).length > 0) {
      const gameKey = Object.keys(gameData)[0];
      console.log('Game name:', gameData[gameKey].CurricularName);
      return gameData[gameKey].CurricularName || 'UnknownGame';
    }
    return 'UnknownGame';
  } catch (error) {
    console.error('Error getting game name:', error);
    return 'GameNameNotFound';
  }
};

// Get level name using level UUID
export const getLevelNameByUUID = async (levelUUID) => {
  try {
    if (!levelUUID) return 'UnknownLevel';
    
    const levelData = await getConjectureDataByUUID(levelUUID);
    if (levelData && Object.keys(levelData).length > 0) {
      const levelKey = Object.keys(levelData)[0];
      // First try to get the level Name field
      if (levelData[levelKey].Name) {
        console.log('Level name: ', levelData[levelKey].Name);
        return levelData[levelKey].Name;
      }
      // Otherwise try the CurricularName or conjecture name
      if (levelData[levelKey]['Text Boxes'] && 
          levelData[levelKey]['Text Boxes']['Conjecture Name']) {
        return levelData[levelKey]['Text Boxes']['Conjecture Name'];
      }
      return 'UnknownLevel';
    }
    return 'UnknownLevel';
  } catch (error) {
    console.error('Error getting level name:', error);
    return 'UnknownLevel';
  }
};

// Find game that contains a specific level UUID
export const findGameByLevelUUID = async (levelUUID) => {
  try {
    if (!levelUUID) return null;
    
    const gamesRef = ref(db, 'Game');
    const gamesSnapshot = await get(gamesRef);
    
    if (!gamesSnapshot.exists()) return null;
    
    const games = gamesSnapshot.val();
    
    for (const gameKey in games) {
      const game = games[gameKey];
      if (game.ConjectureUUIDs && Array.isArray(game.ConjectureUUIDs) && 
          game.ConjectureUUIDs.includes(levelUUID)) {
        // console.log('Game found:', game.CurricularName);
        return game;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding game by level UUID:', error);
    return null;
  }
};

// Get game name from level UUID by finding the game that contains this level
export const getGameNameByLevelUUID = async (levelUUID) => {
  try {
    const game = await findGameByLevelUUID(levelUUID);
    return game?.CurricularName || 'UnknownGame';
  } catch (error) {
    console.error('Error getting game name by level UUID:', error);
    return 'UnknownGame';
  }
};


// Not Database function but attached to data menu search
export const checkDateFormat = (dateStr) => {
  // Regular expression to match the date format 'mm/dd/yyyy', 'm/dd/yyyy', 'mm/d/yyyy', 'm/d/yyyy', 'mm-dd-yyyy', 'm-dd-yyyy', 'mm-d-yyyy', or 'm-d-yyyy'
  const regex = /^(0?[1-9]|1[0-2])[-\/](0?[1-9]|[12][0-9]|3[01])[-\/](\d{4})$/;

  // Test the date string against the regular expression
  if (!regex.test(dateStr)) {
    console.log('Invalid date format');
    return false;
    
  }
};

export const convertDateFormat = (dateStr) => {
    // Check if the date string contains '/' or '-'
    const separator = dateStr.includes('/') ? '/' : '-';
  
    // Split the date string into parts
    const [day, month, year] = dateStr.split(separator);
    
    // Return the date string in the format 'yyyy-dd-mm'
    return `${year}-${month}-${day}`;
};

export const findGameIdByName = async (name) => {
  try {
    if (!name) return null;
    
    const gamesRef = ref(db, 'Game');
    const gamesSnapshot = await get(gamesRef);
    
    if (!gamesSnapshot.exists()) return null;
    
    const games = gamesSnapshot.val();
    
    for (const gameKey in games) {
      const game = games[gameKey];
      if (game.CurricularName && game.CurricularName.includes(name)) {
        // console.log('Game found:', game.CurricularName);
        return game.UUID;
      }
    }
  
    return null;
  } catch (error) {
    console.error('Error finding gameId by name:', error);
    return null;
  }
};
