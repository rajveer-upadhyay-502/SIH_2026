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
    collection,
    query,
    where,
    getDocs,
    updateDoc,
} from "firebase/firestore";

export const signupUser = async ({
    name,
    email,
    password,
    role,
    departmentId = "",
    studentId = "",
}) => {
    if (!["faculty", "student"].includes(role)) {
        throw new Error("Invalid signup role");
    }

    let facultyDoc = null;
    if (role === "faculty") {
        const facultyQuery = query(
            collection(db, "faculty"),
            where("email", "==", email.toLowerCase())
        );
        const facultySnapshot = await getDocs(facultyQuery);
        
        if (facultySnapshot.empty) {
            throw new Error("No pre-registered faculty found with this email. Please contact the administrator.");
        }
        
        facultyDoc = facultySnapshot.docs[0];
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

    const userData = {
        uid: user.uid,
        name,
        email,
        role,
        departmentId,
        studentId,
        active: true,
        createdAt: serverTimestamp(),
    };

    if (role === "faculty" && facultyDoc) {
        userData.facultyId = facultyDoc.id;
        userData.employeeId = facultyDoc.data().employeeId;
        
        await updateDoc(doc(db, "faculty", facultyDoc.id), {
            userId: user.uid,
        });
    }

    await setDoc(doc(db, "users", user.uid), userData);

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