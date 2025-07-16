// AKA Game module
import React, {useState} from 'react';
import Background from "../Background";
import { blue, white, red, green, indigo, hotPink, purple,} from "../../utils/colors";
import Button from "../Button"
import RectButton from "../RectButton";
import { useMachine } from "@xstate/react";
import { setAddtoCurricular } from '../ConjectureSelector/ConjectureSelectorModule';
import { StoryEditorContentEditor } from "./StoryEditorModuleBoxes";
import Settings from '../Settings'; // Import the Settings component
import { idToSprite } from "../Chapter"; //Import list of sprites
import { saveGameDialoguesToFirebase, loadGameDialoguesFromFirebase } from "../../firebase/database";
import { useEffect } from "react";import { saveNarrativeDraftToFirebase } from "../../firebase/database";
import { Curriculum } from '../CurricularModule/CurricularModule';
import PixiLoader from '../utilities/PixiLoader';

const StoryEditorModule = (props) => {
  const { height, width, mainCallback, gameUUID, curricularCallback, conjectureSelectCallback, conjectureCallback } = props;
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stores dialogues
  const [dialogues, setDialogues] = useState([]);
            
  // ----- Chapters -----
  // Always keep chapters in sync with the current number of levels (conjectures)
  const [chapters, setChapters] = useState(() => {
    const initialCount = Curriculum.getCurrentConjectures().length;
    return Array.from({ length: initialCount }, (_, i) => `${i + 1}`);
  });

  // Function to sort dialogues by chapter (numerically) and then by type (Intro first, then Outro)
  const sortDialogues = (dialogueArray) => {
    return [...dialogueArray].sort((a, b) => {
      // First sort by chapter (convert to number for proper numerical sorting)
      const chapterA = parseInt(a.chapter) || 0;
      const chapterB = parseInt(b.chapter) || 0;
      
      if (chapterA !== chapterB) {
        return chapterA - chapterB;
      }
      
      // If chapters are the same, sort by type (Intro before Outro)
      const typeOrder = { 'Intro': 0, 'Outro': 1 };
      const typeA = typeOrder[a.type] || 0;
      const typeB = typeOrder[b.type] || 0;
      
      return typeA - typeB;
    });
  };

  // Whenever a level is added / removed, automatically mirror that change in chapters
  useEffect(() => {
    const levelCount = Curriculum.getCurrentConjectures().length;

    // Update chapters first
    setChapters(prev => {
      if (levelCount === prev.length) {
        return prev; // No change needed
      }
      
      console.log(`Chapter count changing from ${prev.length} to ${levelCount}`);
      return Array.from({ length: levelCount }, (_, i) => `${i + 1}`);
    });

    // Then update dialogues if needed
    setDialogues(currentDialogues => {
      let hasChanges = false;
      const updated = currentDialogues.map(dialogue => {
        const currentChapter = parseInt(dialogue.chapter) || 1;
        // If dialogue chapter exceeds max, set it to the highest available chapter
        if (currentChapter > levelCount) {
          hasChanges = true;
          console.log(`Moving dialogue from chapter ${currentChapter} to chapter ${levelCount}`);
          return { ...dialogue, chapter: levelCount.toString() };
        }
        return dialogue;
      });
      
      // Save to database if there were changes to chapter numbers
      if (hasChanges) {
        const gameId = Curriculum.getCurrentUUID() || gameUUID;
        if (gameId) {
          console.log(`Conjecture count decreased. Updating database...`);
          // Sort the updated dialogues before saving
          const sortedUpdated = sortDialogues(updated);
          saveNarrativeDraftToFirebase(gameId, sortedUpdated).then(() => {
            console.log("Chapter numbers automatically updated in database due to conjecture removal");
          }).catch(error => {
            console.error("✗ Error auto-saving chapter updates:", error);
          });
          
          // Return sorted dialogues to update the UI immediately
          return sortedUpdated;
        } else {
          console.warn("No game ID available for auto-saving chapter updates");
        }
      }
      
      return updated;
    });
  }, [Curriculum.getCurrentConjectures().length, gameUUID]); // Added gameUUID as dependency

  useEffect(() => {
    const gameId = gameUUID ?? Curriculum.getCurrentUUID();
    if (!gameId) {
      console.warn("No real gameId—skipping dialogues load.");
      return;
    }
    loadGameDialoguesFromFirebase(gameId).then((loaded) => {
      if (loaded) {
        const maxChapter = Math.max(1, Curriculum.getCurrentConjectures().length);
        
        // Ensure all dialogues have properly formatted chapters and are capped to available conjectures
        let hasChanges = false;
        const updatedDialogues = loaded.map(dialogue => {
          let updatedDialogue = { ...dialogue };
          
          // Add chapter if missing
          if (!dialogue.hasOwnProperty('chapter')) {
            updatedDialogue.chapter = "1"; // Default to chapter-1
            hasChanges = true;
          }
          
          // Cap chapter to maximum available
          const currentChapter = parseInt(updatedDialogue.chapter) || 1;
          if (currentChapter > maxChapter) {
            console.log(`Capping dialogue chapter from ${currentChapter} to ${maxChapter} on load`);
            updatedDialogue.chapter = maxChapter.toString();
            hasChanges = true;
          }
          
          return updatedDialogue;
        });
        
        // Sort dialogues after loading and capping
        const sortedDialogues = sortDialogues(updatedDialogues);
        setDialogues(sortedDialogues);
        setLoading(false);
        
        // If we made changes during loading, save them back to database
        if (hasChanges) {
          console.log("Saving capped chapter numbers back to database...");
          saveNarrativeDraftToFirebase(gameId, sortedDialogues).then(() => {
            console.log("Capped chapter numbers saved to database");
          }).catch(error => {
            console.error("Error saving capped chapter updates:", error);
          });
        }
      } else {
          setLoading(false);
      }
    });
  }, [gameUUID]);

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

  const handleChangeChapter = (localIndex, newChapterName) => {
    const globalIndex = startIndex + localIndex;
    const updated = [...dialogues];
    updated[globalIndex].chapter = newChapterName;
    setDialogues(updated);
  }

  const handleAddDialogue = () => {
    const newText = prompt("Enter dialogue text:");
    if (newText && newText.trim() !== "") {
      // Default to the latest chapter (or first if none exist)
      if (chapters.length === 0) setChapters(["1"]);
      const defaultChapter = chapters.length ? chapters[chapters.length - 1] : "1";      
      const newDialogue = {
        text: newText,
        character: "player",
        type: "Intro",
        chapter: defaultChapter
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
      // Save dialogues in their current order
      await saveNarrativeDraftToFirebase(gameId, dialogues);
      alert("Dialogues saved for this game!");
      if (typeof curricularCallback === 'function') {
        curricularCallback();
      }
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

  if (loading) {
    return (
      <>
        <Background height={height * 1.1} width={width} />
        <PixiLoader height={height} width={width} />
      </>
    );
  }

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