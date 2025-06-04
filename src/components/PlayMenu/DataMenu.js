import React from 'react'
import { Container, Text, Graphics } from '@inlet/react-pixi';
import { powderBlue, navyBlue, cornflowerBlue, green, neonGreen, black, blue, white, pink, orange, red, transparent, turquoise, yellow, gold, goldenRod, midnightBlue, royalBlue, lightGray, darkGray} from "../../utils/colors";
import RectButton from "../RectButton";
import { useCallback } from "react";
import { TextStyle } from "@pixi/text";
import InputBox from "../InputBox";
import { Input } from 'postcss';
import { useEffect, useRef, useState, } from 'react';
import { getUserEmailFromDatabase,  } from "../../firebase/userDatabase"
import { getFromDatabaseByGame, convertDateFormat, checkDateFormat, checkGameAuthorization, getAuthorizedGameList, } from "../../firebase/database"
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, get } from "firebase/database";

import { set } from 'firebase/database';

const DataMenu = (props) => {
  const {
    menuWidth,
    menuHeight,
    x,
    y,
    trigger,
    onClose = () => {},
  } = props;

  const [all_data, setAllData] = useState(false);
  const [save_csv, setSaveCSV] = useState(false);
  const [save_json, setSaveJSON] = useState(false);
  const [game_name, setGameName] = useState('');
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');
  const [game_list, setGameList] = useState([]);
  const [save_videos, setSaveVideos] = useState(false);


  // For fetching email when componenet first mounts
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const innerRectWidth = menuWidth * 0.94;
  const innerRectHeight = menuHeight * 0.8; 
  const innerRectMargins = (menuWidth - innerRectWidth) / 2;
  const fieldTextMarginsFromInnerRect = menuHeight * 0.07;
  const fieldTextMarginsFromEachOther = menuHeight * 0.11;
  const fieldHeight = menuWidth * 0.028;
  const inputBoxHeight = fieldHeight * 3;
  const inputBoxTextSize = menuWidth * 0.02;
  const distanceFromFieldTextToField = menuWidth * 0.3;
  const checkButtonWidth = menuWidth * 0.07;
  const checkButtonFont = menuWidth * 0.03;
  const fieldText = new TextStyle({
    align: "center",                    
    fontFamily: "Arial",                 
    fontSize: fieldHeight,                    
    fontWeight: 1000,                 
    fill: [black],                      
  })

  // When component mounts, user email is either loading, fetched, or reached an error
  useEffect(() => {
    let isMounted = true;
  
    const fetchEmail = async () => {
      try {
        setIsLoading(true);
        const email = await getUserEmailFromDatabase();
        if (isMounted) setUserEmail(email);
      } catch (error) {
        if (isMounted) setError(error.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
  
    fetchEmail();
  
    return () => {
      isMounted = false;
    };
  }, []);
  

  const downloadVideos = async (gameName, start, end) => {
    try {
      const storage = getStorage();
      const database = getDatabase();
  
      // Parsing dates
      // const parseDate = (dateStr) => {
      //   if (!dateStr) return null;
  
      //   if (dateStr.includes('/')) {
      //     const [month, day, year] = dateStr.split('/');
      //     return new Date(Date.UTC(+year, +month - 1, +day));
      //   } else if (dateStr.includes('-')) {
      //     const [year, month, day] = dateStr.split('-');
      //     return new Date(Date.UTC(+year, +month - 1, +day));
      //   }
  
      //   return null;
      // };
  
      const startDateUTC = start;
      const endDateUTC = end ? new Date(end.getTime() + 86400000 - 1) : null;

      // Calling Firebase to get the game data
      const gamesRef = dbRef(database, 'Game');
      const snapshot = await get(gamesRef);
  
      if (!snapshot.exists()) {
        alert('No games found in database. Please check the database path.');
        return;
      }
  
      const games = snapshot.val();
      let foundGame = null;
  
      for (const uuid in games) {
        const game = games[uuid];
        if (
          game.CurricularName &&
          game.CurricularName.toLowerCase().trim() === gameName.toLowerCase().trim()
        ) {
          foundGame = game;
          break;
        }
      }
  
      if (!foundGame) {
        alert(`Couldn't find a matching game in the database. Searched for: ${gameName}`);
        return;
      }
  
      const author = foundGame.Author || '';
      const name = foundGame.CurricularName || '';
  
      // Fetching videos from Firebase Storage
      const videoFolderRef = ref(storage, 'videos');
      const videoList = await listAll(videoFolderRef);
  
      if (videoList.items.length === 0) {
        alert("No videos found in storage.");
        return;
      }
  
      const filteredVideos = [];
  
      for (const item of videoList.items) {
        const match = item.name.match(/^(\d{4})(\d{2})(\d{2})_/); // YYYYMMDD_
  
        if (!match) continue;
  
        const videoDate = new Date(Date.UTC(
          parseInt(match[1]),
          parseInt(match[2]) - 1,
          parseInt(match[3])
        ));
  
        // Debugging log
        console.log(`Checking ${item.name} | videoDate: ${videoDate.toISOString()}, start: ${startDateUTC?.toISOString()}, end: ${endDateUTC?.toISOString()}`);
  
        const isInDateRange =
          (!startDateUTC || videoDate >= startDateUTC) &&
          (!endDateUTC || videoDate <= endDateUTC);
  
        const includesAuthor = author ? item.name.includes(author) : true;

        // Strip out all spaces from both the game name and item name for comparison
        const gameNameNoSpaces = name ? name.replace(/\s+/g, '') : '';
        const includesName = name ? item.name.includes(gameNameNoSpaces) : true;
  
        if (isInDateRange && includesAuthor && includesName) {
          // console.log(`  ✅ ADDING ${item.name} to filteredVideos`);
          // console.log("Video date: ", videoDate)
          // console.log("Author: ", item.author)
          // console.log("Name: ", item.name)
          filteredVideos.push(item);
        }
        else {
          // --- ADD THIS LOG ---
          // console.log(`  ❌ SKIPPING ${item.name} because one or more conditions failed.`);
          // console.log("Video date: ", videoDate)
          // console.log("Author: ", author)
          // console.log("Name: ", name)
          // --- END LOG ---
        }
      }
  
      if (filteredVideos.length === 0) {
        alert("No videos found for the specified criteria.");
        return;
      }
  
      let downloadCount = 0;
      for (const videoRef of filteredVideos) {
        try {
          const downloadURL = await getDownloadURL(videoRef);
  
          const response = await fetch(downloadURL);
          const blob = await response.blob();
  
          const blobURL = URL.createObjectURL(blob);
  
          const a = document.createElement('a');
          a.href = blobURL;
          a.download = videoRef.name.endsWith('.mp4') ? videoRef.name : `${videoRef.name}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          downloadCount++;
  
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Error downloading ${videoRef.name}:`, err);
        }
      }
  
      alert(`Successfully downloaded ${downloadCount} out of ${filteredVideos.length} video files.`);
    } catch (error) {
      console.error('Error during video download:', error);
      alert('Failed to download videos. Please check the console for details.');
    }
  };


  const draw = useCallback(
    (g) => {
      g.clear();
      g.beginFill(cornflowerBlue);
      g.drawRect(x, y, menuWidth, menuHeight);
      g.endFill();
      g.beginFill(white);
      g.drawRoundedRect(
        x + innerRectMargins, 
        y + menuHeight - innerRectMargins - innerRectHeight,
        innerRectWidth, 
        innerRectHeight);
      g.endFill();
    },
    [menuHeight, menuWidth, x, y]
  );


  if (trigger) {
    return (
    <Container>
      <Graphics
        draw={draw}
        interactive={true}
      />
      <Text
        text={"DOWNLOAD DATA"}                                
        style={                                
          new TextStyle({
            align: "center",                      
            fontFamily: "Arial",                  
            fontSize: menuWidth * 0.03,                     
            fontWeight: 1000,                
            fill: [white],                     
          })
        }
        x={x + menuWidth / 2} // Center in menu
        y={y + (menuHeight - innerRectMargins - innerRectHeight) / 2} //Center in top margins
        anchor={0.5}
      />
      
      <Text
        text={"USER ID"}
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect}
        anchor={0}
      />
      <InputBox //Box for user ID
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect}
        color={lightGray}
        fontSize={inputBoxTextSize}  //  Dynamically modify font size based on screen width
        fontColor={black}
        text={isLoading ? 'Loading...' : error ? 'Error loading email' : userEmail}
        fontWeight={600}
      />
      <Text
        text={"GAME NAME"}                             
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther}
        anchor={0}
      />
      <InputBox //Box for game name
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther}
        color={white}
        fontSize={inputBoxTextSize}  //  Dynamically modify font size based on screen width
        fontColor={black}
        text={game_name} // change this out to game_name after testing
        fontWeight={600}
        callback={async () => {
          const game_list = await getAuthorizedGameList();
          let gameOptions;
          if (game_list != null) {
            gameOptions = game_list.join('\n');
          } else {
            gameOptions = "No games found";
          }
          
          //let promptVal = prompt("Please Enter the Game Name", game_name);
          let promptVal = prompt(`Please Enter a Game from the following list\n\n${gameOptions}\n\n`, game_name);
          let gameValid = await checkGameAuthorization(promptVal);
         // console.log(gameValid);
          while (promptVal != null && gameValid != true) {
            promptVal = prompt(`Invalid Game Name. Please try again. Enter a Game from the following list\n\n${gameOptions}\n\n`, game_name);
            gameValid = await checkGameAuthorization(promptVal);
            //console.log(gameValid);
          }
          if (promptVal != null) {
            setGameName(promptVal)
          }
        }}
      />
      <Text
        text={"START DATE"}                             
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 2}
        anchor={0}
      />
      <InputBox //Box for Start Date
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 2}
        color={(all_data) ? lightGray : white}
        fontSize={inputBoxTextSize}
        fontColor={black}
        text={start_date}
        fontWeight={600}
        callback={() => {
          if (!all_data) { // If all data is not selected, allow user to input start date
            let promptVal = prompt("Please Enter the Start Date in the format mm/dd/yyyy", start_date);
            while (promptVal != null && checkDateFormat(promptVal) == false) {
              promptVal = prompt("Invalid Date Format. Please Enter the Start Date in the format mm/dd/yyyy", start_date);
            }
            if (promptVal != null) {
              setStartDate(promptVal)
            }
          }
          
        }}
      />
      <Text
        text={"END DATE"}              
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 3}
        anchor={0}
      />
      <InputBox //Box for End Date
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 3}
        color={(all_data) ? lightGray : white}
        fontSize={inputBoxTextSize}
        fontColor={black}
        text={end_date}
        fontWeight={600}
        callback={() => {
          if (!all_data) { // If all data is not selected, allow user to input end date
            let promptVal = prompt("Please Enter the End Date in the format mm/dd/yyyy", end_date);
            while (promptVal != null && checkDateFormat(promptVal) == false) {
              promptVal = prompt("Invalid Date Format. Please Enter the End Date in the format mm/dd/yyyy", end_date);
            }
            if (promptVal != null) {
              setEndDate(promptVal)
            }
          }
        }}
      />
        
      <InputBox //Check box for downloading all the data for the user
        height={checkButtonWidth}
        width={checkButtonWidth}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 4}
        color={white}
        fontSize={checkButtonFont}
        fontColor={black}
        fontWeight={600}
        text={all_data ? "X" : ""}
        callback = {() => { setAllData(!all_data) } }
      />

      <Text
        text={"Select entire date range"}              
        style={new TextStyle({
          align: "center",
          fontFamily: "Arial",
          fontSize: fieldHeight * 0.9,
          fontWeight: 1000,
          fill: [black],
        })}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + checkButtonWidth * 0.5} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 3 + fieldTextMarginsFromEachOther }
        anchor={0}
        callback = {() => { setAllData(!all_data) } }
      />

      <InputBox //Check box for downloading as CSV
        height={checkButtonWidth}
        width={checkButtonWidth}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        color={white}
        fontSize={checkButtonFont}
        fontColor={black}
        fontWeight={600}
        text={save_csv ? "X" : ""}
        callback = {() => { setSaveCSV(!save_csv) } }
      />

      <Text
        text={"CSV \n(broken)"}              
        style={new TextStyle({
          align: "left",
          fontFamily: "Arial",
          fontSize: fieldHeight * 0.9,
          fontWeight: 1000,
          fill: [black],
        })}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + checkButtonWidth * 0.8} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        anchor={0}
      />

      <InputBox //Check box for downloading as JSON
        height={checkButtonWidth}
        width={checkButtonWidth}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + checkButtonWidth * 3}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        color={white}
        fontSize={checkButtonFont}
        fontColor={black}
        fontWeight={600}
        text={save_json ? "X" : ""}
        callback = {() => { setSaveJSON(!save_json) } }
      />

      <Text
        text={"JSON"}
        style={new TextStyle({
          align: "center",
          fontFamily: "Arial",
          fontSize: fieldHeight * 0.9,
          fontWeight: 1000,
          fill: [black],
        })}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + + checkButtonWidth * 3 + checkButtonWidth * 0.8} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        anchor={0}
      />

        <InputBox //Check box for downloading audio and video data
        height={checkButtonWidth}
        width={checkButtonWidth}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + checkButtonWidth * 6}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        color={white}
        fontSize={checkButtonFont}
        fontColor={black}
        fontWeight={600}
        text={save_videos ? "X" : ""}
        callback = {() => { setSaveVideos(!save_videos) } }
      />

      <Text
        text={"Video/Audio"}
        style={new TextStyle({
          align: "center",
          fontFamily: "Arial",
          fontSize: fieldHeight * 0.9,
          fontWeight: 1000,
          fill: [black],
        })}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + + checkButtonWidth * 6 + checkButtonWidth * 0.8} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        anchor={0}
      />

      <RectButton
        height={menuHeight * 0.08}
        width={menuWidth * 0.08}
        x={x + menuWidth - innerRectMargins - menuWidth * 0.06}
        y={y + (menuHeight - innerRectMargins - innerRectHeight) / 2}
        color={red}
        fontSize={14}
        fontColor={white}
        text={"X"}
        fontWeight={800}
        callback={onClose}
      />

      <RectButton //Button for downloading the data
        height={menuHeight * 0.3}
        width={menuWidth* 0.4}
        x={x + innerRectMargins + innerRectWidth - menuWidth* 0.2 - fieldTextMarginsFromInnerRect}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 4}
        color={(save_csv || save_json) ? royalBlue : lightGray}
        text={"SAVE"}
        fontSize={menuWidth * 0.02}
        fontColor={white}
        fontWeight={600}
        callback={() => {
          // getFromDatabaseByGame('sittingquicktest', '2024-11-11', '2024-12-11'); //game, start date, end date
          if (all_data && save_json){
            getFromDatabaseByGame(game_name, '2000-01-01', new Date().toISOString().split('T')[0]); //game, start date, end date
          }
          else if (save_json) {
            getFromDatabaseByGame(game_name, convertDateFormat(start_date), convertDateFormat(end_date)); //game, start date, end date
          }
          if (all_data && save_csv){
            getFromDatabaseByGameCSV(game_name, '2000-01-01', new Date().toISOString().split('T')[0]); //game, start date, end date
          }
          else if (save_csv) {
            getFromDatabaseByGameCSV(game_name, convertDateFormat(start_date), convertDateFormat(end_date)); //game, start date, end date
          }
          
          if (all_data && save_videos) {
            if (!game_name) {
              alert('Please enter a game name.');
              return;
            }
          
            if (!all_data && (!start_date || !end_date)) {
              alert('Please enter a start and end date.');
              return;
            }
          
            // parse to Date object directly here
            const parseDate = (dateStr) => {
              if (!dateStr) return null;
              const [month, day, year] = dateStr.split('/');
              return new Date(Date.UTC(+year, +month - 1, +day));
            };
          
            const start = all_data ? new Date(Date.UTC(2000, 0, 1)) : parseDate(start_date);
            const end = all_data ? new Date() : parseDate(end_date);
          
            console.log("Sending to downloadVideos -> start:", start.toISOString(), "end:", end.toISOString());
          
            downloadVideos(game_name, start, end);
          }

          if (save_videos) {
            if (!game_name) {
              alert('Please enter a game name.');
              return;
            }
          
            if (!all_data && (!start_date || !end_date)) {
              alert('Please enter a start and end date.');
              return;
            }
          
            // parse to Date object directly here
            const parseDate = (dateStr) => {
              if (!dateStr) return null;
              const [month, day, year] = dateStr.split('/');
              return new Date(Date.UTC(+year, +month - 1, +day));
            };
          
            const start = all_data ? new Date() : parseDate(start_date);
            const end = all_data ? new Date() : parseDate(end_date);
          
            console.log("Sending to downloadVideos -> start:", start.toISOString(), "end:", end.toISOString());
          
            downloadVideos(game_name, start, end);
          }                  
        }}
      />
    </Container>
    )
} else {
    return <Container/>;
  }
}

export default DataMenu