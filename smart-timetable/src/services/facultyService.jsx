import {
    addDoc,
    collection,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import { db } from "../firebase/config";

/* =========================================================
   GET FACULTY BY USER
========================================================= */

export const getFacultyByUserId = async (
    uid,
    profile = null
) => {
    if (!uid) {
        return null;
    }

    /*
      First try matching Firebase UID.
      This supports faculty documents that already
      have userId linked.
    */

    const userIdQuery = query(
        collection(db, "faculty"),
        where("userId", "==", uid)
    );

    const userIdSnapshot =
        await getDocs(userIdQuery);

    if (!userIdSnapshot.empty) {
        const facultyDoc =
            userIdSnapshot.docs[0];

        return {
            id: facultyDoc.id,
            ...facultyDoc.data(),
        };
    }

    /*
      Fallback:
      Older faculty records may only have employeeId.
    */

    const employeeId =
        profile?.employeeId;

    if (!employeeId) {
        return null;
    }

    const employeeQuery = query(
        collection(db, "faculty"),
        where(
            "employeeId",
            "==",
            employeeId
        )
    );

    const employeeSnapshot =
        await getDocs(employeeQuery);

    if (employeeSnapshot.empty) {
        return null;
    }

    const facultyDoc =
        employeeSnapshot.docs[0];

    return {
        id: facultyDoc.id,
        ...facultyDoc.data(),
    };
};

/* =========================================================
   GET FACULTY LEAVE REQUESTS
========================================================= */

export const getFacultyLeaveRequests =
    async (facultyUserId) => {
        if (!facultyUserId) {
            return [];
        }

        const leaveQuery = query(
            collection(
                db,
                "leaveRequests"
            ),
            where(
                "facultyUserId",
                "==",
                facultyUserId
            )
        );

        const snapshot =
            await getDocs(leaveQuery);

        return snapshot.docs
            .map((leaveDoc) => ({
                id: leaveDoc.id,
                ...leaveDoc.data(),
            }))
            .sort((a, b) => {
                const aTime =
                    a.createdAt?.toMillis?.() ||
                    0;

                const bTime =
                    b.createdAt?.toMillis?.() ||
                    0;

                return bTime - aTime;
            });
    };

/* =========================================================
   SUBMIT LEAVE REQUEST
========================================================= */

export const submitLeaveRequest =
    async ({
        facultyId,
        facultyUserId,
        facultyName,
        startDate,
        endDate,
        reason,
    }) => {
        if (!facultyId) {
            throw new Error(
                "Faculty ID is required."
            );
        }

        if (!facultyUserId) {
            throw new Error(
                "Faculty user ID is required."
            );
        }

        if (!startDate || !endDate) {
            throw new Error(
                "Leave dates are required."
            );
        }

        if (!reason?.trim()) {
            throw new Error(
                "Leave reason is required."
            );
        }

        const leaveData = {
            facultyId,
            facultyUserId,
            facultyName:
                facultyName || "",
            startDate,
            endDate,
            reason: reason.trim(),
            status: "pending",
            createdAt:
                serverTimestamp(),
            updatedAt:
                serverTimestamp(),
        };

        const requestRef =
            await addDoc(
                collection(
                    db,
                    "leaveRequests"
                ),
                leaveData
            );

        return {
            id: requestRef.id,
            ...leaveData,
        };
    };



/* =========================================================
   COORDINATOR: REAL-TIME PENDING LEAVE REQUESTS
========================================================= */

export const subscribeToPendingLeaveRequests =
    (onChange, onError) => {
        const leaveQuery = query(
            collection(
                db,
                "leaveRequests"
            ),
            where(
                "status",
                "==",
                "pending"
            )
        );

        return onSnapshot(
            leaveQuery,
            (snapshot) => {
                const requests =
                    snapshot.docs
                        .map((leaveDoc) => ({
                            id: leaveDoc.id,
                            ...leaveDoc.data(),
                        }))
                        .sort((a, b) => {
                            const aTime =
                                a.createdAt?.toMillis?.() ||
                                0;

                            const bTime =
                                b.createdAt?.toMillis?.() ||
                                0;

                            return bTime - aTime;
                        });

                onChange(requests);
            },
            (error) => {
                console.error(
                    "Pending leave listener error:",
                    error
                );

                if (onError) {
                    onError(error);
                }
            }
        );
    };

/* =========================================================
   SUBMIT TIMETABLE CHANGE REQUEST
========================================================= */

export const submitChangeRequest =
    async ({
        timetableId,
        facultyId,
        facultyUserId,
        facultyName,
        subjectId,
        subjectName,
        day,
        startTime,
        reason,
    }) => {
        if (!timetableId) {
            throw new Error(
                "Timetable ID is required."
            );
        }

        if (!facultyId) {
            throw new Error(
                "Faculty ID is required."
            );
        }

        if (!facultyUserId) {
            throw new Error(
                "Faculty user ID is required."
            );
        }

        if (!reason?.trim()) {
            throw new Error(
                "Change request reason is required."
            );
        }

        const changeData = {
            timetableId,
            facultyId,
            facultyUserId,
            facultyName:
                facultyName || "",
            subjectId:
                subjectId || "",
            subjectName:
                subjectName || "",
            day: day || "",
            startTime:
                startTime || "",
            reason: reason.trim(),
            status: "pending",
            createdAt:
                serverTimestamp(),
            updatedAt:
                serverTimestamp(),
        };

        const requestRef =
            await addDoc(
                collection(
                    db,
                    "changeRequests"
                ),
                changeData
            );

        return {
            id: requestRef.id,
            ...changeData,
        };
    };

/* =========================================================
   UPDATE FACULTY AVAILABILITY
========================================================= */

export const updateFacultyAvailability =
    async ({
        facultyId,
        availability,
    }) => {
        if (!facultyId) {
            throw new Error(
                "Faculty ID is required."
            );
        }

        const facultyRef = doc(
            db,
            "faculty",
            facultyId
        );

        await updateDoc(
            facultyRef,
            {
                availability:
                    availability || {},
                updatedAt:
                    serverTimestamp(),
            }
        );

        return true;
    };