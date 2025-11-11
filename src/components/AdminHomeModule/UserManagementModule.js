// USED FOR TESTING THE CONJECTURES THAT WE UPLOAD
import Background from "../Background";
import { Text } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import { green, neonGreen, black, blue, white, pink, orange, red, transparent, turquoise, purple, navyBlue, royalBlue, dodgerBlue, powderBlue, midnightBlue, steelBlue, cornflowerBlue } from "../../utils/colors";
import Button from "../Button";
import RectButton from "../RectButton";
import { getConjectureDataByUUID } from "../../firebase/database";
import {getUsersByOrganizationFromDatabase, getUserOrganizationFromDatabase} from "../../firebase/userDatabase";

import UserList from './UserList';


import React, { useState, useEffect } from 'react';
import NewUserModule from "./NewUserModule";



const UserManagementModule = (props) => {
    const { height, width, mainCallback, addNewUserCallback } = props;
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);

    const refreshUserList = async () => {
        try {

                  setLoading(true);

      /* 1.  fetch org (may be null for brand-new users) */
      const organization = await getUserOrganizationFromDatabase();
      if (!organization) {
        console.warn('No organization found for current user');
        setUsersList([]);
        return;      }
      /* 2.  fetch users – returns [] on empty org */
      const users = await getUsersByOrganizationFromDatabase(organization);
      console.log('User 0:', users.length ? users[0] : 'none');
      setUsersList(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refreshUserList();
    }, []);

    const handleEdit = (user) => {
        // Handle edit action for the user
        console.log('Editing user:', user);
        };
        
        const handleDelete = (user) => {
            // Handle delete action for the user
            console.log('Deleting user:', user);
        };

    return(
    <>
        < Background height={height * 1.1} width={width} />
        {/*Ttile*/}
        <Text
            text={`User Management`}
            x={width * .12}
            y={height * 0.01}
            style={
            new TextStyle({
                align: "center",
                fontFamily: "Futura",
                fontSize: 80,
                fontWeight: 800,
                fill: [blue],
                letterSpacing: -5,
            })
            }
        />
        {/* Refresh Button */}
        <RectButton
            height={height * 0.13}
            width={width * 0.4}
            x={width * 0.4}
            y={height * 0.93}
            color={navyBlue} 
            fontSize={width * 0.015}
            fontColor={white} 
            text={loading ? "Refreshing..." : "Refresh Users"}
            fontWeight={800}
            callback={refreshUserList}
        />
        {/* Display Users only if usersList is not null */}
        {usersList.length !== 0 && (
            <UserList 
                users={usersList} 
                height={height * 0.12}
                width={width * 0.26}
                x={width * 0.4}
                y={height * 0.93}
                refreshUserListCallback = {refreshUserList}
            />
        )}

        {/* Back Button */}
        <RectButton
            height={height * 0.13}
            width={width * 0.26}
            x={width * 0.15}
            y={height * 0.93}
            color={red}
            fontSize={width * 0.015}
            fontColor={white}
            text={"Back"}
            fontWeight={800}
            callback={mainCallback}
        />

        {/* // new user module // */}
        <RectButton
            height={height * 0.13}
            width={width * 0.26}
            x={width * .6}
            y={height * .15}
            color={green}
            fontSize={width * 0.015}
            fontColor={white}
            text={"ADD USER"}
            fontWeight={800}
            callback={addNewUserCallback}
        />
    </>
    );
};

export default UserManagementModule;