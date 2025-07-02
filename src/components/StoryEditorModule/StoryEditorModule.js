// AKA Game module
import React, {useState} from 'react';
import Background from "../Background";
import { blue, white, red, green, indigo, hotPink, purple,} from "../../utils/colors";
import Button from "../Button"
import RectButton from "../RectButton";
import { writeToDatabaseCurricular, writeToDatabaseCurricularDraft, getConjectureDataByUUID } from "../../firebase/database";
import { useMachine } from "@xstate/react";
import { setAddtoCurricular } from '../ConjectureSelector/ConjectureSelectorModule';
import { StoryEditorContentEditor } from "./StoryEditorModuleBoxes";
import Settings from '../Settings'; // Import the Settings component
import { idToSprite } from "../Chapter"; //Import list of sprites
import { saveGameDialoguesToFirebase, loadGameDialoguesFromFirebase } from "../../firebase/database";
import { useEffect } from "react";import { saveNarrativeDraftToFirebase } from "../../firebase/database";

// stores a list of conjectures
export const Curriculum = {
  CurrentConjectures: [],
  CurrentUUID: null, // null if using new game. Same UUID from database if editing existing game.

  addConjecture(conjecture) { // add the entire conjecture object to a list
    this.CurrentConjectures.push(conjecture);
  },

  getCurrentConjectures() { // return the game (list of conjectures)
    return this.CurrentConjectures;
  },

  getConjecturebyIndex(index) { // return a specific conjecture
    return this.CurrentConjectures[index];
  },

  getCurrentUUID(){ //return the UUID if editing an existing game
    if(this.CurrentUUID != null && this.CurrentUUID != ""){
      return this.CurrentUUID;
    }
    else{
      return null;
    }
  },

  setCurrentUUID(newUUID){
    this.CurrentUUID = newUUID;
  },

  moveConjectureUpByIndex(index){ // swaps 2 elements so the index rises up the list
    if(index > 0) {
      const temp = this.CurrentConjectures[index - 1];
      this.CurrentConjectures[index - 1] = this.CurrentConjectures[index];
      this.CurrentConjectures[index] = temp;
    }
  },

  moveConjectureDownByIndex(index){ // swaps 2 elements so the index falls down the list
    if(index < this.CurrentConjectures.length - 1){
      const temp = this.CurrentConjectures[index + 1];
      this.CurrentConjectures[index + 1] = this.CurrentConjectures[index];
      this.CurrentConjectures[index] = temp;
    }
  },

  removeConjectureByIndex(index){ // remove a particular conjecture based on its index in the list
    this.CurrentConjectures.splice(index, 1);;
  },

  async setCurricularEditor(curricular){ // fill in curriculum data
    this.CurrentConjectures = []; // remove previous list of levels
    if(curricular["ConjectureUUIDs"]){ // only fill in existing values
      for(i=0; i < curricular["ConjectureUUIDs"].length; i++){
        conjectureList = await getConjectureDataByUUID(curricular["ConjectureUUIDs"][i]); //getConjectureDataByUUID returns a list
        conjecture = conjectureList[curricular["ConjectureUUIDs"][i]]; // get the specific conjecture from that list
        this.CurrentConjectures.push(conjecture);
      }
    }
      localStorage.setItem('CurricularName', curricular["CurricularName"]);
      localStorage.setItem('CurricularAuthor', curricular["CurricularAuthor"]);
      localStorage.setItem('CurricularKeywords', curricular["CurricularKeywords"]);
      if(curricular["CurricularPIN"] != "undefined" && curricular["CurricularPIN"] != null){
        localStorage.setItem('CurricularPIN', curricular["CurricularPIN"]);
      }
  },

  clearCurriculum(){
    this.CurrentConjectures = []; // remove previous list of levels
    this.setCurrentUUID(null); // remove UUID
  },
};

const StoryEditorModule = (props) => {
  const { height, width, mainCallback, gameUUID, curricularCallback, conjectureSelectCallback, conjectureCallback } = props;
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Stores dialogues
  const [dialogues, setDialogues] = useState([]);
            
  // ----- Chapters -----
  // Always keep chapters in sync with the current number of levels (conjectures)
  const [chapters, setChapters] = useState(() => {
    const initialCount = Math.max(1, Curriculum.getCurrentConjectures().length);
    return Array.from({ length: initialCount }, (_, i) => `${i + 1}`);
  });

  // Whenever a level is added / removed, automatically mirror that change in chapters
   useEffect(() => {
    const levelCount = Math.max(1, Curriculum.getCurrentConjectures().length);

    // Update only when the count actually changes
    setChapters(prev =>
      levelCount === prev.length
        ? prev
        : Array.from({ length: levelCount }, (_, i) => `${i + 1}`)
    );
  }, [Curriculum.getCurrentConjectures().length]); 

  useEffect(() => {
    const gameId = gameUUID ?? Curriculum.getCurrentUUID();
    if (!gameId) {
      console.warn("No real gameId—skipping dialogues load.");
      return;
    }
    loadGameDialoguesFromFirebase(gameId).then((loaded) => {
      if (loaded) {
        // Ensure all dialogues have properly formatted chapters
        const updatedDialogues = loaded.map(dialogue => {
          if (!dialogue.hasOwnProperty('chapter')) {
            return { ...dialogue, chapter: "1" }; // Default to chapter-1
          }

          return dialogue;
        });
        
        // Extract all unique chapters from dialogues
        const uniqueChapters = [...new Set(updatedDialogues.map(d => d.chapter))];
        if (uniqueChapters.length > 0) {
          setChapters(uniqueChapters.sort());
        }
        
        setDialogues(updatedDialogues);
      }
    });
  }, []);


  const dialoguesPerPage = 7;
  const totalPages = Math.ceil(dialogues.length / dialoguesPerPage);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const startIndex = currentPage * dialoguesPerPage;
  const currentDialogues = dialogues.slice(startIndex, startIndex + dialoguesPerPage);

  //Change Chapter
  const handleChangeChapter = (localIndex, newChapterName) => {
    const globalIndex = startIndex + localIndex;
    const updated = [...dialogues];
    updated[globalIndex].chapter = newChapterName;
    setDialogues(updated);
  }

  //Add chapter, called by "Add Chapter" button
  

  //Add a new dialogue
  const handleAddDialogue = () => {
    const newText = prompt("Enter dialogue text:");
    if (newText && newText.trim() !== "") {
      // Default to the latest chapter (or first if none exist)
      const defaultChapter = chapters.length > 0 ? chapters[chapters.length - 1] : "1";
      
      const newDialogue = {
        text: newText,
        character: "player",
        type: "Intro",
        chapter: defaultChapter // Add formatted chapter
      };
      setDialogues([...dialogues, newDialogue]);
    }
  };

  //Remove a dialogue by index
  const handleRemoveDialogue = (localIndex) => {
    const globalIndex = startIndex + localIndex;
    const updated = [...dialogues];
    updated.splice(globalIndex, 1);
    setDialogues(updated);

    // if we removed the last item on the current page
    // and we're not on the first page, go back one page
    const newTotalPages = Math.ceil(updated.length / dialoguesPerPage);
    if (currentPage >= newTotalPages && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  //Edit a dialogue's text
  const handleEditDialogue = (localIndex) => {
    const globalIndex = startIndex + localIndex;
    const updatedText = prompt("Edit dialogue:", dialogues[globalIndex].text);
    if (updatedText !== null) {
      const updated = [...dialogues];
      updated[globalIndex].text = updatedText;
      setDialogues(updated);
    }
  };

  //Toggle Intro/Outro
  const handleChangeType = (localIndex, newType) => {
    const globalIndex = startIndex + localIndex;
    const updated = [...dialogues];
    updated[globalIndex].type = updated[globalIndex].type === "Intro" ? "Outro" : "Intro";
    setDialogues(updated);
  }

  //Moves narrative up
  const handleMoveup = (localIndex) => {
    const globalIndex = startIndex + localIndex;
    if (globalIndex > 0) {
      const updated = [...dialogues];
      [updated[globalIndex - 1], updated[globalIndex]] = [updated[globalIndex], updated[globalIndex - 1]];
      setDialogues(updated);
      
      // If moving the first item of current page up, switch to previous page to follow it
      if (localIndex === 0 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  //Moves narrative down
  const handleMoveDown = (localIndex) => {
    const globalIndex = startIndex + localIndex;
    if (globalIndex < dialogues.length - 1) {
      const updated = [...dialogues];
      [updated[globalIndex + 1], updated[globalIndex]] = [updated[globalIndex], updated[globalIndex + 1]];
      setDialogues(updated);
      
      // If moving the last item of current page down, switch to next page to follow it  
      const isLastOnPage = localIndex === currentDialogues.length - 1;
      const isLastOverall = globalIndex === dialogues.length - 1;
      if (isLastOnPage && !isLastOverall && currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const handleChangeCharacter = (localIndex, newCharacter) => {
    const globalIndex = startIndex + localIndex;
    const updated = [...dialogues];
    updated[globalIndex].character = newCharacter;
    setDialogues(updated);
  }

  const handleSaveDialogues = async () => {
    const gameId = Curriculum.getCurrentUUID() || gameUUID;
  
    if (!gameId) {
      alert("No valid game ID. Please open or create a game first.");
      return;
    }
  
    try {
      await saveNarrativeDraftToFirebase(gameId, dialogues);
      alert("Dialogues saved to the game node!");
    } catch (error) {
      console.error("Error saving dialogues:", error);
      alert("Failed to save dialogues.");
    }
    console.log("Saving to Game UUID:", gameId);
  };


  // Reset Function
  const resetCurricularValues = () => {
    localStorage.removeItem('CurricularName');
    localStorage.removeItem('CurricularAuthor');
    localStorage.removeItem('CurricularKeywords');
    localStorage.removeItem('CurricularPIN');
    Curriculum.clearCurriculum();
  };

  // Reset Function
  const enhancedMainCallback = () => {
    resetCurricularValues(); // Reset values before going back
    mainCallback(); //use the callbackfunction
  };

  // Publish function that includes reset
  async function publishAndReset(currentUUID)  {
    let promise = await writeToDatabaseCurricular(currentUUID);
    if (promise != undefined) { // promise is undefined if the game cannot be published
      // Don't reset values when publishing - this keeps dialogues accessible
      alert("Game published successfully! Your dialogues are preserved.");
      
      // Optional: If you want to clear some data but KEEP the game UUID:
      localStorage.removeItem('CurricularName');
      localStorage.removeItem('CurricularAuthor');
      localStorage.removeItem('CurricularKeywords');
      localStorage.removeItem('CurricularPIN');
      
      // IMPORTANT: Do NOT clear the curriculum or reset the UUID
      // This keeps the connection to your dialogues intact
      // Curriculum.clearCurriculum(); - REMOVE THIS
      // Curriculum.CurrentConjectures = []; - REMOVE THIS
    }
  };

  return (
    <>
      {/* Render the main page content only when the Settings menu is NOT open */}
      {!showSettingsMenu && (
        <>
          <Background height={height * 1.1} width={width} />

          {/* Render StoryEditorContentEditor */}
          <StoryEditorContentEditor height={height} width={width} dialogues={currentDialogues} onAddDialogue={handleAddDialogue} onMoveUp={handleMoveup} 
                                    onRemoveDialogue={handleRemoveDialogue} onEditDialogue={handleEditDialogue} onChangeType={handleChangeType}
                                    onMoveDown={handleMoveDown} idToSprite={idToSprite} onChangeCharacter={handleChangeCharacter} chapters={chapters}
                                    onChangeChapter={handleChangeChapter} />

          {/* Buttons */}
          <RectButton
            height={height * 0.13}
            width={width * 0.26}
            x={width * 0.85}
            y={height * 0.93}
            color={red}
            fontSize={width * 0.013}
            fontColor={white}
            text={"BACK"}
            fontWeight={800}
            callback={curricularCallback}
          />
          
          <RectButton
            height={height * 0.13}
            width={width * 0.65}
            x={width * 0.38}
            y={height * 0.93}
            color={indigo}
            fontSize={width * 0.013}
            fontColor={white}
            text={"ADD DIALOGUE"}
            fontWeight={800}
            callback={handleAddDialogue}
          />
          <RectButton
            height={height * 0.13}
            width={width * 0.25}
            x={width * 0.73}
            y={height * 0.93}
            color={green}
            fontSize={width * 0.013}
            fontColor={white}
            text={"SAVE"}
            fontWeight={800}
            callback={handleSaveDialogues}
          />
          <RectButton
            height={height * 0.13}
            width={width * 0.26}
            x={width * 0.02}
            y={height * 0.93}
            color={blue}
            fontSize={width * 0.014}
            fontColor={white}
            text={"PREVIOUS"}
            fontWeight={800}
            callback={totalPages <= 1 || currentPage === 0 ? null : prevPage}
            alpha={totalPages <= 1 || currentPage === 0 ? 0.3 : 1}
          />

          <RectButton
            height={height * 0.13}
            width={width * 0.26}
            x={width * 0.14}
            y={height * 0.93}
            color={blue}
            fontSize={width * 0.014}
            fontColor={white}
            text={"NEXT"}
            fontWeight={800}
            callback={totalPages <= 1 || currentPage === totalPages - 1 ? null : nextPage}
            alpha={totalPages <= 1 || currentPage === totalPages - 1 ? 0.3 : 1}
          />
        </>
      )}

      {/* Render the Settings menu */}
      {showSettingsMenu && (
        <Settings
          width={width * 0.6}
          height={height * 0.6}
          x={width * 0.18}
          y={height * 0.17}
          onClose={() => setShowSettingsMenu(false)} // Close Settings menu
        />
      )}
    </>
  );
};

export default StoryEditorModule;