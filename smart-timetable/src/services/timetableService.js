import {
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
    writeBatch,
    doc,
} from "firebase/firestore";

import { db } from "../firebase/config";

export const publishTimetable = async ({
    college,
    course,
    result,
    selectedBy,
}) => {
    const facultyIds = [
        ...new Set(
            result.schedule
                .map((item) => item.facultyId)
                .filter(Boolean)
        ),
    ];

    const academicYear = college?.academicYear || "unknown";

    const courseKey = [
        academicYear,
        course.program,
        course.semester,
        course.section,
    ]
        .join("-")
        .toLowerCase()
        .replace(/\s+/g, "-");

    /*
      Archive previous published timetable
      for the same course / semester / section.
    */

    const existingQuery = query(
        collection(db, "timetables"),
        where("courseKey", "==", courseKey),
        where("status", "==", "published")
    );

    const existingSnapshot = await getDocs(
        existingQuery
    );

    const batch = writeBatch(db);

    for (const timetableDoc of existingSnapshot.docs) {
        batch.update(timetableDoc.ref, {
            status: "archived",
            archivedAt: serverTimestamp(),
        });
    }

    const timetableData = {
        collegeName:
            college?.collegeName || "",

        universityName:
            college?.universityName || "",

        academicYear,

        courseKey,

        program: course.program,

        semester: Number(course.semester),

        section: course.section,

        studentCount:
            Number(course.studentCount),

        schedule: result.schedule,

        score: result.score,

        facultyIds,

        status: "published",

        selectedBy,

        createdAt: serverTimestamp(),

        publishedAt: serverTimestamp(),
    };

    const newTimetableRef = doc(collection(db, "timetables"));
    batch.set(newTimetableRef, timetableData);

    await batch.commit();

    return {
        id: newTimetableRef.id,
        ...timetableData,
    };
};

export const getPublishedTimetablesForFaculty =
    async (facultyId) => {
        const timetableQuery = query(
            collection(db, "timetables"),
            where("status", "==", "published"),
            where(
                "facultyIds",
                "array-contains",
                facultyId
            )
        );

        const snapshot = await getDocs(
            timetableQuery
        );

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    };

export const getAllPublishedTimetables = async (academicYear) => {
    const timetableQuery = query(
        collection(db, "timetables"),
        where("status", "==", "published"),
        where("academicYear", "==", academicYear)
    );

    const snapshot = await getDocs(timetableQuery);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

export const getAllApprovedLeaves = async () => {
    const leaveQuery = query(
        collection(db, "leaveRequests"),
        where("status", "==", "approved")
    );

    const snapshot = await getDocs(leaveQuery);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};