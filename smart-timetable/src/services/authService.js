import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";

import { auth, db } from "../firebase/config";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";

export const signupUser = async ({
    name,
    email,
    password,
    role,
    departmentId = "",
    studentId = "",
    employeeId = "",
}) => {
    if (!["faculty", "student"].includes(role)) {
        throw new Error("Invalid signup role");
    }

    const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    const user = credential.user;

    await updateProfile(user, {
        displayName: name,
    });

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        departmentId,
        studentId,
        employeeId,
        active: true,
        createdAt: serverTimestamp(),
    });

    return user;
};

export const loginUser = async (email, password) => {
    const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return credential.user;
};

export const logoutUser = async () => {
    await signOut(auth);
};

export const getUserData = async (uid) => {
    const userRef = doc(db, "users", uid);

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        throw new Error("User profile not found");
    }

    return snapshot.data();
};