import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
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

    const courseKey = [
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

    for (const timetableDoc of existingSnapshot.docs) {
        await updateDoc(timetableDoc.ref, {
            status: "archived",
            archivedAt: serverTimestamp(),
        });
    }

    const timetableData = {
        collegeName:
            college?.collegeName || "",

        universityName:
            college?.universityName || "",

        academicYear:
            college?.academicYear || "",

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

    const timetableRef = await addDoc(
        collection(db, "timetables"),
        timetableData
    );

    return {
        id: timetableRef.id,
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