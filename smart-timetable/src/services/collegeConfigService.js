import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

/* =========================================================
   COLLEGE CONFIG
========================================================= */

export const getCollegeConfig = async () => {
    const ref = doc(db, "collegeConfig", "main");

    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
    };
};

export const saveCollegeConfig = async (config) => {
    const ref = doc(db, "collegeConfig", "main");

    await setDoc(
        ref,
        {
            ...config,
            updatedAt: serverTimestamp(),
        },
        {
            merge: true,
        }
    );

    return true;
};

/* =========================================================
   ROOMS
========================================================= */

export const getRooms = async () => {
    const snapshot = await getDocs(
        collection(db, "rooms")
    );

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

export const addRoom = async (room) => {
    const ref = await addDoc(
        collection(db, "rooms"),
        {
            ...room,
            createdAt: serverTimestamp(),
        }
    );

    return {
        id: ref.id,
        ...room,
    };
};

export const deleteRoom = async (roomId) => {
    await deleteDoc(
        doc(db, "rooms", roomId)
    );
};

/* =========================================================
   FACULTY
========================================================= */

export const getFaculty = async () => {
    const snapshot = await getDocs(
        collection(db, "faculty")
    );

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

export const addFaculty = async (faculty) => {
    const ref = await addDoc(
        collection(db, "faculty"),
        {
            ...faculty,
            createdAt: serverTimestamp(),
        }
    );

    return {
        id: ref.id,
        ...faculty,
    };
};

export const deleteFaculty = async (facultyId) => {
    await deleteDoc(
        doc(db, "faculty", facultyId)
    );
};