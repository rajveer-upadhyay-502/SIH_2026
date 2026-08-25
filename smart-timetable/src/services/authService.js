import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser,
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
    deleteDoc,
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

    let credential = null;
    let facultyDoc = null;

    try {
        /*
          Create the Firebase Authentication account first.

          This is important because Firestore faculty lookup
          requires an authenticated user.
        */

        credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = credential.user;

        await updateProfile(user, {
            displayName: name,
        });

        /*
          Create the initial user profile first.

          For faculty, employeeId is required so that
          Firestore rules can authorize the faculty lookup.
        */

        const userData = {
            uid: user.uid,
            name,
            email,
            role,
            departmentId,
            studentId,
            employeeId:
                role === "faculty"
                    ? employeeId.trim()
                    : "",
            active: true,
            createdAt:
                serverTimestamp(),
        };

        await setDoc(
            doc(db, "users", user.uid),
            userData
        );

        /*
          Faculty signup:
          Find the pre-registered faculty record by
          employeeId.

          This happens AFTER authentication and after the
          users document has been created, so the Firestore
          security rules can identify the user as faculty.
        */

        if (role === "faculty") {
            if (!employeeId.trim()) {
                throw new Error(
                    "Employee ID is required for faculty signup."
                );
            }

            const facultyQuery = query(
                collection(db, "faculty"),
                where(
                    "employeeId",
                    "==",
                    employeeId.trim()
                )
            );

            const facultySnapshot =
                await getDocs(facultyQuery);

            if (facultySnapshot.empty) {
                throw new Error(
                    "No pre-registered faculty found with this employee ID. Please contact the administrator."
                );
            }

            /*
              If multiple records somehow have the same
              employeeId, use the first matching record.
            */

            facultyDoc =
                facultySnapshot.docs[0];

            const facultyData =
                facultyDoc.data();

            /*
              Also verify the email stored by Admin matches
              the email being used for signup.
            */

            if (
                facultyData.email &&
                facultyData.email.toLowerCase() !==
                email.toLowerCase()
            ) {
                throw new Error(
                    "The email does not match the pre-registered faculty record."
                );
            }

            /*
              Link the Firebase user to the existing faculty
              record.
            */

            await updateDoc(
                doc(
                    db,
                    "faculty",
                    facultyDoc.id
                ),
                {
                    userId: user.uid,
                }
            );

            /*
              Save the faculty document ID in the user profile.
            */

            await updateDoc(
                doc(db, "users", user.uid),
                {
                    facultyId:
                        facultyDoc.id,
                }
            );
        }

        return user;
    } catch (error) {
        /*
          If signup fails after the Firebase account/user
          document was created, clean up the partially created
          account so the user can try again normally.
        */

        try {
            if (credential?.user) {
                await deleteDoc(
                    doc(
                        db,
                        "users",
                        credential.user.uid
                    )
                );
            }
        } catch (cleanupError) {
            console.error(
                "Failed to clean up user profile:",
                cleanupError
            );
        }

        try {
            if (credential?.user) {
                await deleteUser(
                    credential.user
                );
            }
        } catch (cleanupError) {
            console.error(
                "Failed to clean up Firebase account:",
                cleanupError
            );
        }

        throw error;
    }
};

export const loginUser = async (
    email,
    password
) => {
    const credential =
        await signInWithEmailAndPassword(
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
    const userRef = doc(
        db,
        "users",
        uid
    );

    const snapshot =
        await getDoc(userRef);

    if (!snapshot.exists()) {
        throw new Error(
            "User profile not found"
        );
    }

    return snapshot.data();
};