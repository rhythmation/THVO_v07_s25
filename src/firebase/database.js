// Firebase Init
import { ref, push, getDatabase, set, query, equalTo, get, orderByChild, orderByKey, onValue, child, startAt, endAt, remove } from "firebase/database";
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

// Export a function named writeToDatabase, allows constant pose data upload
export const writeToDatabase = async (poseData, UUID, frameRate) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  let promise;

  // only runs if event type is established
  if(eventType !== null){
    const dbRef = ref(db, `_PoseData/${gameId}/${readableDate}/${userName+" "+loginTime}/${UUID}/${eventType}`);

  // Create an object to send to the database
  // This object includes the userId, poseData, conjectureId, frameRate, and timestamp and
    const dataToSend = {
      userId,
      userName,
      poseData: JSON.stringify(poseData),
      eventType,
      timestamp,
      timestampGMT,
      frameRate,
      loginTime,
      UUID,
    };

    // Push the data to the database using the dbRef reference (pushes using default firebase reference codes)
    promise = push(dbRef, dataToSend);
  }
  // Return the promise that push() returns
  return promise;
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
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  let conjectureID;

  // define the UUID based on whether it exists already or not
  if(existingUUID == null){
    conjectureID = uuidv4();
  }
  else{
    conjectureID = existingUUID;
  }
  

  // Initialize empty object to store the data inside
  const dataToPush = {};

  // Fetch values from local storage for each key inside keysToPush 
  const isAnyKeyNullOrUndefined = keysToPush.some((key) => {
    const value = localStorage.getItem(key);
    return value === null || value === undefined || value.trim() === '';
  });

  // if any text values are not there alert message and exit
  if (isAnyKeyNullOrUndefined) {
    return alert("One or more text values are empty. Cannot publish conjecture to database."), false;
  }

  // Check if any of the pose data is null before proceeding
  const startJson = localStorage.getItem('start.json');
  const intermediateJson = localStorage.getItem('intermediate.json');
  const endJson = localStorage.getItem('end.json');

  if (
    startJson !== null && startJson !== undefined &&
    intermediateJson !== null && intermediateJson !== undefined &&
    endJson !== null && endJson !== undefined
  ) {
    // create pose objects
    const startPoseData = await createPoseObjects(startJson, 'StartPose', localStorage.getItem('Start Tolerance'));
    const intermediatePoseData = await createPoseObjects(intermediateJson, 'IntermediatePose', localStorage.getItem('Intermediate Tolerance'));
    const endPoseData = await createPoseObjects(endJson, 'EndPose', localStorage.getItem('End Tolerance'));

    // Define the database path
    const conjecturePath = `Level/${conjectureID}`;

    // Fetch values from local storage for each key inside keysToPush 
    await Promise.all(keysToPush.map(async (key) => {
      const value = localStorage.getItem(key);

      // Check if the value is not null, undefined, or an empty string
      if (value !== null && value !== undefined && value.trim() !== '') {
        // uses helper function to create text objects
        Object.assign(dataToPush, await createTextObjects(key, value));
      }
    }));


    // searrcxh words
    const searchWordsToPush = {
      "Author Name": dataToPush["Author Name"],
      "Conjecture Description": dataToPush["Conjecture Description"],
      "Conjecture Keywords": dataToPush["Conjecture Keywords"],
      "Conjecture Name": dataToPush["Conjecture Name"]
    };
    console.log(searchWordsToPush)

    // Extracting values from searchWordsToPush object
    const searchWordsValues = Object.values(searchWordsToPush);
    // Concatenating search words into a single lowercase string
    const concatenatedSearchWords = searchWordsValues.join(" ").toLowerCase();

    // Splitting the concatenated string into individual words
    const wordsArray = concatenatedSearchWords.split(" ");

    // Initializing an empty object to store search words
    const searchWordsToPushToDatabase = {};

    // Loop through the words array and set each word as a key in the searchWordsToPushToDatabase object with the word itself as its value
    wordsArray.forEach(word => {
      if (word !== undefined) {
        searchWordsToPushToDatabase[word] = word;
      }
    });

    console.log(searchWordsToPushToDatabase)

    // creates promises to push all of the data to the database 
    // uses set to overwrite the random firebaseKeys with easier to read key names
    const promises = [
      set(ref(db, `${conjecturePath}/Time`), timestamp),
      set(ref(db, `${conjecturePath}/AuthorID`), userId),
      set(ref(db, `${conjecturePath}/UUID`),conjectureID),
      set(ref(db, `${conjecturePath}/PIN`), localStorage.getItem("PIN")),
      set(ref(db, `${conjecturePath}/Start Pose`), startPoseData),
      set(ref(db, `${conjecturePath}/Intermediate Pose`), intermediatePoseData),
      set(ref(db, `${conjecturePath}/End Pose`), endPoseData),
      set(ref(db, `${conjecturePath}/Text Boxes`), dataToPush),
      set(ref(db, `${conjecturePath}/isFinal`), true),
      set(ref(db,`${conjecturePath}/Search Words`), searchWordsToPushToDatabase),
      set(ref(db, `${conjecturePath}/Name`), dataToPush["Conjecture Name"]),
      // auto set author to logged in user
      //set(ref(db, `${conjecturePath}/Author`), userName),
    ];

    return promises && alert("Conjecture successfully published to database.");
  } else {
    return alert("One or more poses are missing. Cannot publish conjecture to database."), false;
  }
};

// save a draft of the current conjecture so it can be published later
export const writeToDatabaseConjectureDraft = async (existingUUID) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  let conjectureID;

  // define the UUID based on whether it exists already or not
  if(existingUUID == null){
    conjectureID = uuidv4();
  }
  else{
    conjectureID = existingUUID;
  }

  // Initialize empty object to store the data inside
  const dataToPush = {};
  let noName = false;

  // Fetch values from local storage for each key inside KeysToPush 
  await Promise.all(keysToPush.map(async (key) => {
    const value = localStorage.getItem(key);
    Object.assign(dataToPush, await createTextObjects(key, value));

    // If the value is undefined assign the value as undefined in firebase
    if(value == undefined){
      Object.assign(dataToPush, await createTextObjects(key, "undefined"));
      if(key == "Conjecture Name"){
        noName = true;
      }
    }
  }));

  // create pose objects
  const startPoseData = await createPoseObjects(localStorage.getItem('start.json'), 'StartPose', localStorage.getItem('Start Tolerance'));
  const intermediatePoseData = await createPoseObjects(localStorage.getItem('intermediate.json'), 'IntermediatePose', localStorage.getItem('Intermediate Tolerance'));
  const endPoseData = await createPoseObjects(localStorage.getItem('end.json'), 'EndPose', localStorage.getItem('End Tolerance'));

  // if the level isn't named, alert message and exit
  if (noName) {
    return alert("Please name your level before saving a draft."), false;
  }

  // Define the database path
  const conjecturePath = `Level/${conjectureID}`;

  // creates promises to push all of the data to the database 
  // uses set to overwrite the random firebaseKeys with easier to read key names
  const promises = [
    set(ref(db, `${conjecturePath}/Time`), timestamp),
    set(ref(db, `${conjecturePath}/Start Pose`), startPoseData),
    set(ref(db, `${conjecturePath}/Intermediate Pose`), intermediatePoseData),
    set(ref(db, `${conjecturePath}/End Pose`), endPoseData),
    set(ref(db, `${conjecturePath}/Text Boxes`), dataToPush),
    set(ref(db, `${conjecturePath}/UUID`),conjectureID),
    set(ref(db, `${conjecturePath}/isFinal`), false),
    // auto set author to logged in user
    //set(ref(db, `${conjecturePath}/Author`), userName)
  ];

  return promises && alert("Draft saved");
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


// save a draft of a collection of conjectures to be published later
export const writeToDatabaseCurricularDraft = async (UUID) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();

  let CurricularID; // set the UUID based on whether creating new game or editing existing game
  if(UUID == null){
    CurricularID = uuidv4();
  }
  else{
    CurricularID = UUID;
  }

  //get the UUID of each conjecture
  const conjectureList = Curriculum.getCurrentConjectures();
  let conjectures = [];
  for (let i = 0; i < conjectureList.length; i++){
    conjectures.push(conjectureList[i]["UUID"]);
  }

  const dataToPush = {}
  // Fetch values from local storage for each key inside  curricularTextBoxes
  await Promise.all(curricularTextBoxes.map(async (key) => {
    const value = localStorage.getItem(key);
    Object.assign(dataToPush, await createTextObjects(key, value));

    // If the value is undefined assign the value as undefined in firebase
    if(value == undefined){
      Object.assign(dataToPush, await createTextObjects(key, "undefined"));
    }
  }));

  //if no name: alert message and exit
  if (dataToPush.CurricularName == undefined) {
    return alert("Please name the game first.");
  }

  const CurricularPath = `Game/${CurricularID}`;

  // creates promises to push all of the data to the database 
  // uses set to overwrite the random firebaseKeys with easier to read key names
  const promises = [
    set(ref(db, `${CurricularPath}`), dataToPush),
    set(ref(db, `${CurricularPath}/ConjectureUUIDs`), conjectures),
    set(ref(db, `${CurricularPath}/Time`), timestamp),
    set(ref(db, `${CurricularPath}/UUID`), CurricularID),
    set(ref(db, `${CurricularPath}/isFinal`), false),
    // auto set author for security
    set(ref(db, `${CurricularPath}/Author`), userName),
    set(ref(db, `${CurricularPath}/AuthorID`), userId),
  ];

  return promises && alert("Game Draft saved");
}


// publish a completed game
export const writeToDatabaseCurricular = async (UUID) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();

  let CurricularID; // set the UUID based on whether creating new game or editing existing game
  if(UUID == null){
    CurricularID = uuidv4();
  }
  else{
    CurricularID = UUID;
  }

  // First, load any existing dialogues to preserve them
  let existingDialogues = [];
  try {
    existingDialogues = await loadGameDialoguesFromFirebase(CurricularID) || [];
    console.log("Preserving existing dialogues:", existingDialogues.length);
  } catch (error) {
    console.warn("No existing dialogues found or error loading dialogues:", error);
  }

  //get the UUID of each conjecture
  const conjectureList = Curriculum.getCurrentConjectures();
  let conjectures = [];
  for (let i = 0; i < conjectureList.length; i++){
    conjectures.push(conjectureList[i]["UUID"]);
  }

  const dataToPush = {}
  let hasUndefined = false;
  // Fetch values from local storage for each key inside curricularTextBoxes
  await Promise.all(curricularTextBoxes.map(async (key) => {
    const value = localStorage.getItem(key);
    Object.assign(dataToPush, await createTextObjects(key, value));

    // If the value is undefined assign the value as undefined in firebase
    if(value == undefined){
      Object.assign(dataToPush, await createTextObjects(key, "undefined"));
      hasUndefined = true;
    }
  }));

  // if anything is missing return an alert and exit
  if(hasUndefined){
    //alert("One or more text values are empty. Cannot publish game to database.");
    return alert("One or more text values are empty. Cannot publish game to database.");
  }
  if(conjectureList.length == 0){
    return alert("Please add at least 1 level to your game before publishing.");
  }

  const CurricularPath = `Game/${CurricularID}`;

  // creates promises to push all of the data to the database 
  // uses set to overwrite the random firebaseKeys with easier to read key names
  const promises = [
    set(ref(db, `${CurricularPath}`), dataToPush),
    set(ref(db, `${CurricularPath}/ConjectureUUIDs`), conjectures),
    set(ref(db, `${CurricularPath}/Time`), timestamp),
    set(ref(db, `${CurricularPath}/UUID`), CurricularID),
    set(ref(db, `${CurricularPath}/isFinal`), true),
    set(ref(db, `${CurricularPath}/Author`), userName),
    set(ref(db, `${CurricularPath}/AuthorID`), userId),
    // CRITICAL: Preserve dialogues when publishing
    set(ref(db, `${CurricularPath}/Dialogues`), existingDialogues),
  ];

  return alert("Game Published"), promises; //returns the promises and alerts that the game has been published
}

// save dialogues to firebase
export const saveNarrativeDraftToFirebase = async (UUID, dialogues) => {
  const timestamp = new Date().toISOString();
  const gameId = UUID ?? uuidv4(); // Use provided UUID or create new one
  const dbRef = ref(db, `Game/${gameId}/Dialogues`);

  const promises = [
    set(ref(db, `Game/${gameId}/Dialogues`), dialogues),
    set(ref(db, `Game/${gameId}/LastSaved`), timestamp),
    set(ref(db, `Game/${gameId}/UUID`), gameId),
    set(ref(db, `Game/${gameId}/isFinal`), false),
    // Optional: auto-set author again for traceability
    set(ref(db, `Game/${gameId}/AuthorID`), userId),
    set(ref(db, `Game/${gameId}/Author`), userName),
  ];

  await Promise.all(promises);
  alert("Narrative draft saved.");
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
    querySnapshot.forEach((snapshot) => {
      // Check if snapshot data contains searchWord as a key
      const searchData = snapshot.val();
      if (searchData && searchData['Search Words'] && searchData['Search Words'][searchWord]) {
        // Found searchWord key in this snapshot
        // Add this snapshot's data to the list of matching conjectures
        matchingConjectures.push(searchData);
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

  // Create a reference path to the Firebase Realtime Database
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}`;

  // Create an object to send to the database
  // Some of these are placeholders for future values that aren't implemented yet i.e. Hints
  const promises = [
    set(ref(db, `_GameData/${gameId}/CurricularID`), CurrId),
    set(ref(db, `${userSession}/UserId`), userId),
    set(ref(db, `${userSession}/UserRole`), userRole),
    set(ref(db, `${userSession}/${loginTime}/GameStart`), timestamp),
    set(ref(db, `${userSession}/${loginTime}/GameStartGMT`), timestampGMT),
    set(ref(db, `${userSession}/${loginTime}/DaRep`), 'null'),
    set(ref(db, `${userSession}/${loginTime}/Hints/HintEnabled`), "null"),
    set(ref(db, `${userSession}/${loginTime}/Hints/HintCount`), "null"),
    set(ref(db, `${userSession}/${loginTime}/Hints/HintOrder`), "null"),
    set(ref(db, `${userSession}/${loginTime}/LatinSquareOrder`), "null"),
  ];

  // Return the promise that push() returns
  return promises;
};

// Write timestamp for pose start to the database
export const writeToDatabasePoseStart = async (poseNumber, ConjectureId) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // set event type to pose start
  eventType = poseNumber
  conjectureId = ConjectureId;

  // Create a reference path to the Firebase Realtime Database
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/${poseNumber} Begin`), timestamp),
    set(ref(db, `${userSession}/${poseNumber} Begin GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  return promises;
};

// Writes a pose match into the database. Separated for simplicity
export const writeToDatabasePoseMatch = async (poseNumber) => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // Create a reference to the Firebase Realtime Database
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/${poseNumber} Match`), timestamp),
    set(ref(db, `${userSession}/${poseNumber} Match GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  return promises;
};

// Write in the start of the truefalse phase
export const writeToDatabaseIntuitionStart = async () => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // event type for pose data
  eventType = "Intuition";

  // Create a reference to the Firebase Realtime Database
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Intuition Start`), timestamp),
    set(ref(db, `${userSession}/Intuition Start GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  return promises;
};

// Write in the end of the truefalse phase. 
export const writeToDatabaseIntuitionEnd = async () => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // event type for pose data
  eventType = "Insight";

  // Create a reference to the Firebase Realtime Database
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Intuition End/`), timestamp),
    set(ref(db, `${userSession}/Intuition End GMT/`), timestampGMT),
  ];

  // Return the promise that push() returns
  return promises;
};

// Write in the second part of the true false phase
export const writeToDatabaseInsightStart = async () => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // Create a reference to the Firebase Realtime Database
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Insight Start/`), timestamp),
    set(ref(db, `${userSession}/Insight Start GMT/`), timestampGMT),
  ];

  // Return the promise that push() returns
  return promises;
};

// Write in the end of the second part of the true false phase
export const writeToDatabaseInsightEnd = async () => {
  // Create a new date object to get a timestamp
  const dateObj = new Date();
  const timestamp = dateObj.toISOString();
  const timestampGMT = dateObj.toUTCString();

  // Create a reference to the Firebase Realtime Database
  const userSession = `_GameData/${gameId}/${readableDate}/${userName}/${loginTime}/${conjectureId}`;

  // Create an object to send to the database
  const promises = [
    set(ref(db, `${userSession}/Insight End`), timestamp),
    set(ref(db, `${userSession}/Insight End GMT`), timestampGMT),
  ];

  // Return the promise that push() returns
  return promises;
};

// Search functionality that downloads a set of child nodes from a game based on inputted dates
export const getFromDatabaseByGame = async (selectedGame, selectedStart, selectedEnd ) => {
  try {
    // Create reference to the realtime database
    const posedbRef = ref(db, `_PoseData/${selectedGame}`);
    const eventdbRef = ref(db, `_GameData/${selectedGame}`);

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
      //console.log('Data:', poseData);
      
      // // Convert event log to JSON and download
      const eventjsonStr = JSON.stringify(eventData, null, 2);
      const eventDownload = document.createElement('a');
      eventDownload.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(eventjsonStr));
      eventDownload.setAttribute('download', `${formattedGame}_event_log_${formattedStart}_to_${formattedEnd}.json`);
      document.body.appendChild(eventDownload);
      eventDownload.click();
      document.body.removeChild(eventDownload);

      // Convert pose data to JSON and download (takes longer)
      const posejsonStr = JSON.stringify(poseData, null, 2);
      const poseDownload = document.createElement('a');
      poseDownload.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(posejsonStr));
      poseDownload.setAttribute('download', `${formattedGame}_pose_data_${formattedStart}_to_${formattedEnd}.json`);
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

export const getFromDatabaseByGameCSV = async (selectedGame, selectedStart, selectedEnd ) => {
  try {
    // Create reference to the realtime database
    const eventdbRef = ref(db, `_GameData/${selectedGame}`);

    // Query to find data
    const eventq = query(eventdbRef, orderByKey(), startAt(selectedStart), endAt(selectedEnd));
    // Execute the query
    const eventQuerySnapshot = await get(eventq);

    const formattedStart = selectedStart.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedEnd = selectedEnd.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedGame = selectedGame.replace(/[^a-zA-Z0-9]/g, '_');

    // Check if data in snapshot exists
    if (eventQuerySnapshot.exists()) {
      const eventData = eventQuerySnapshot.val();
      //console.log('Data:', poseData);
      
      // // Convert event log to JSON and download CSV
      const eventjsonStr = JSON.stringify(eventData, null, 2);
      const eventDownload = document.createElement('a');
      eventDownload.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(eventjsonStr));
      eventDownload.setAttribute('download', `${formattedGame}_event_log_${formattedStart}_to_${formattedEnd}.json`);
      document.body.appendChild(eventDownload);
      eventDownload.click();
      document.body.removeChild(eventDownload);

      const result = await convertJsonToCsv(eventjsonStr, formattedGame, formattedStart, formattedEnd);
      
    } else {
      return null; // This will happen if data not found
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

