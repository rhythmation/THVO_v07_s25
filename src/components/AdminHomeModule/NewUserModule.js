import React, { useState } from 'react';
import { Container, Text, TextInput, Select, Graphics, lineStyle, beginFill, drawRect, endFill } from "@inlet/react-pixi"
import Background from "../Background";
import RectButton from '../RectButton';
import { green, neonGreen, black, blue, white, pink, orange, red, transparent, turquoise } from "../../utils/colors";
import {writeNewUserToDatabase} from "../../firebase/userDatabase"


import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword,signInWithEmailAndPassword } from "firebase/auth";
import InputBox from '../InputBox';
import { getSavedPassword, getSavedUsername } from '../auth/UserSaver';



const UserPermissions = {
    Admin: 'Admin',
    Developer: 'Developer',
    Teacher: 'Teacher',
    Student: 'Student',
};

const NewUserModule = (props) => {
    const {height, width, UserManagementCallback} = props

    const [email, setEmail] = useState("example@email.com");
    const [userRole, setUserRole] = useState(UserPermissions.Student); 

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleRoleChange = (e) => {
        setUserRole(e.target.value);
    }


    const SubmitUser = (props) => {

    }

    function sendEmailPrompt(){
        let enteredEmail = prompt("Please Enter New User Email", email);
        if (enteredEmail !== null) {
            setEmail(enteredEmail)
        } else if (enteredEmail !== null) {
        alert('Error reading email: No value');
        }

    }

    function sendRolePrompt() {
        let enteredRole = prompt("Please enter a new user role: Admin, Developer, Teacher, Student", userRole);
        if (enteredRole !== null && Object.values(UserPermissions).includes(enteredRole)) {
            setUserRole(enteredRole);
        } else if (enteredRole !== null) {
            alert('Error reading role: value not allowed');
        }
    }

    console.log(email);

    return (
        <>
        <Background height={height * 1.1} width={width} />
        
        <Container>
            <Text 
                text="Add New User" 
                x={width * .1}
                y={height * .2}
            />
            <InputBox
                height={height * 0.15}
                width={width * 0.8}
                x={width * 0.1}
                y={height * 0.3}
                color={white}
                fontSize={width * 0.015}
                fontColor={black}
                text={email}
                fontWeight={300}
                callback={sendEmailPrompt} // Create Popup
            />
            <InputBox
                height={height * 0.15}
                width={width * 0.8}
                x={width * 0.1}
                y={height * 0.4}
                color={white}
                fontSize={width * 0.015}
                fontColor={black}
                text={userRole}
                fontWeight={300}
                callback={sendRolePrompt} // Create Popup
            />

        </Container>
        {/* // Back Button // */}
        <RectButton
            height={height * 0.13}
            width={width * 0.26}
            x={width * 0.1}
            y={height * 0.93}
            color={red}
            fontSize={width * 0.015}
            fontColor={white}
            text={"Back"}
            fontWeight={800}
            callback={() => {
                const currentUserEmail = getSavedUsername();
                const currentUserPassword = getSavedPassword();
                const auth = getAuth();

                signInWithEmailAndPassword(auth, currentUserEmail, currentUserPassword)
                    .then((userCredential) => {
                        // Handle successful sign-in if needed
                    })
                    .catch((error) => {
                        console.error(error);
                        // Handle sign-in error if needed
                    });

                UserManagementCallback(); // Make sure to call the function
            }}
        />

        {/* // Submite new User Button // */}
        <RectButton
            height={height * 0.13}
            width={width * 0.26}
            x={width * 0.1}
            y={height * 0.5}
            color={green}
            fontSize={width * 0.015}
            fontColor={white}
            text={"Add New User"}
            fontWeight={800}
            callback={async () => {
           // wait for the DB write to finish…
            await writeNewUserToDatabase(email, userRole);
           // …then navigate back so the list (which re-fetches on mount) sees the new user
           UserManagementCallback();
       }}
        />
    </>
    );
};

export default NewUserModule;