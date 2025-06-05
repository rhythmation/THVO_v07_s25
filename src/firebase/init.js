// Firebase Init
import firebase from "firebase/compat/app";

import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Set session persistence
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    // Existing and future Auth states are now persisted in the current
    // session only. Closing the window would clear any existing state even
    // if a user forgets to sign out.
    // TL;DR CLOSE WINDOW = SIGN IN AGAIN
  })
  .catch((error) => {
    // Handle errors
    console.error('Error setting session persistence:', error);
  });

export { app, auth, storage };

