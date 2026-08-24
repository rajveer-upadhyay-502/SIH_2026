import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getCollegeConfig,
    getRooms,
    getFaculty,
} from "../../services/collegeConfigService";
import { getAllPublishedTimetables } from "../../services/timetableService";

import { generateTimetable } from "../../services/scheduler/timetableEngine";

const CreateTimetable = () => {
    const navigate = useNavigate();

    const [college, setCollege] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [faculty, setFaculty] = useState([]);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [course, setCourse] = useState({
        program: "",
        semester: "",
        section: "",
        studentCount: "",
    });

    const [subjects, setSubjects] = useState([]);

    const [subjectForm, setSubjectForm] = useState({
        name: "",
        code: "",
        facultyId: "",
        classesPerWeek: 3,
        duration: 1,
        type: "theory",
        roomType: "classroom",
    });

    /* =========================================================
       LOAD ADMIN CONFIGURATION
    ========================================================= */

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [collegeData, roomsData, facultyData] =
                    await Promise.all([
                        getCollegeConfig(),
                        getRooms(),
                        getFaculty(),
                    ]);

                setCollege(collegeData);
                setRooms(roomsData);
                setFaculty(facultyData);
            } catch (err) {
                console.error(
                    "Failed to load college data:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to load college configuration."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    /* =========================================================
       COURSE
    ========================================================= */

    const updateCourse = (field, value) => {
        setCourse((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    /* =========================================================
       SUBJECT FORM
    ========================================================= */

    const updateSubjectForm = (field, value) => {
        setSubjectForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    /* =========================================================
       ADD SUBJECT
    ========================================================= */

    const addSubject = () => {
        setError("");
        setSuccess("");

        if (!subjectForm.name.trim()) {
            setError("Subject name is required.");
            return;
        }

        if (!subjectForm.facultyId) {
            setError("Please select a faculty member.");
            return;
        }

        if (
            Number(subjectForm.classesPerWeek) < 1
        ) {
            setError(
                "Classes per week must be at least 1."
            );
            return;
        }

        if (Number(subjectForm.duration) < 1) {
            setError(
                "Duration must be at least 1 period."
            );
            return;
        }

        const selectedFaculty = faculty.find(
            (member) =>
                member.id === subjectForm.facultyId
        );

        if (!selectedFaculty) {
            setError("Selected faculty was not found.");
            return;
        }

        const newSubject = {
            id: crypto.randomUUID(),

            name: subjectForm.name.trim(),

            code: subjectForm.code.trim(),

            facultyId: subjectForm.facultyId,

            facultyName: selectedFaculty.name,

            classesPerWeek: Number(
                subjectForm.classesPerWeek
            ),

            duration: Number(
                subjectForm.duration
            ),

            type: subjectForm.type,

            roomType: subjectForm.roomType,
        };

        setSubjects((previous) => [
            ...previous,
            newSubject,
        ]);

        setSubjectForm({
            name: "",
            code: "",
            facultyId: "",
            classesPerWeek: 3,
            duration: 1,
            type: "theory",
            roomType: "classroom",
        });

        setSuccess(
            `${newSubject.name} added successfully.`
        );
    };

    /* =========================================================
       REMOVE SUBJECT
    ========================================================= */

    const removeSubject = (subjectId) => {
        setSubjects((previous) =>
            previous.filter(
                (subject) =>
                    subject.id !== subjectId
            )
        );
    };

    /* =========================================================
       GENERATE TIMETABLE
    ========================================================= */

    const handleGenerate = async () => {
        setError("");
        setSuccess("");

        /* -------------------------------------------------------
           COURSE VALIDATION
        ------------------------------------------------------- */

        if (!course.program.trim()) {
            setError(
                "Enter the program / course name."
            );
            return;
        }

        if (!course.semester) {
            setError("Enter the semester.");
            return;
        }

        if (!course.section.trim()) {
            setError("Enter the section.");
            return;
        }

        if (
            !course.studentCount ||
            Number(course.studentCount) <= 0
        ) {
            setError(
                "Enter a valid student count."
            );
            return;
        }

        /* -------------------------------------------------------
           SUBJECT VALIDATION
        ------------------------------------------------------- */

        if (subjects.length === 0) {
            setError(
                "Add at least one subject."
            );
            return;
        }

        /* -------------------------------------------------------
           COLLEGE CONFIG VALIDATION
        ------------------------------------------------------- */

        if (!college) {
            setError(
                "College configuration is missing."
            );
            return;
        }

        if (
            !Array.isArray(
                college.workingDays
            ) ||
            college.workingDays.length === 0
        ) {
            setError(
                "No working days are configured."
            );
            return;
        }

        if (
            !college.workingHours?.start ||
            !college.workingHours?.end
        ) {
            setError(
                "College working hours are not configured."
            );
            return;
        }

        if (!college.periodDuration) {
            setError(
                "Period duration is not configured."
            );
            return;
        }

        /* -------------------------------------------------------
           RESOURCE VALIDATION
        ------------------------------------------------------- */

        if (rooms.length === 0) {
            setError(
                "No classrooms or laboratories are available."
            );
            return;
        }

        if (faculty.length === 0) {
            setError(
                "No faculty members are available."
            );
            return;
        }

        /* -------------------------------------------------------
           FACULTY CHECK
        ------------------------------------------------------- */

        const invalidSubjects =
            subjects.filter(
                (subject) =>
                    !faculty.some(
                        (member) =>
                            member.id ===
                            subject.facultyId
                    )
            );

        if (invalidSubjects.length > 0) {
            setError(
                `Invalid faculty assignment for: ${invalidSubjects
                    .map(
                        (subject) =>
                            subject.name
                    )
                    .join(", ")}`
            );

            return;
        }

        /* -------------------------------------------------------
           RUN ENGINE
        ------------------------------------------------------- */

        try {
            setGenerating(true);

            console.log(
                "===== TIMETABLE GENERATION ====="
            );

            console.log("College:", college);
            console.log("Rooms:", rooms);
            console.log("Faculty:", faculty);
            console.log("Course:", course);
            console.log("Subjects:", subjects);

            const publishedData = await getAllPublishedTimetables(
                college.academicYear || "unknown"
            );

            const existingSchedules = publishedData.flatMap(
                (timetable) => timetable.schedule || []
            );

            console.log("Existing Global Schedules:", existingSchedules.length);

            const results = generateTimetable({
                college,
                faculty,
                rooms,
                subjects,
                studentCount: Number(
                    course.studentCount
                ),
                numberOfOptions: 3,
                existingSchedules,
            });

            console.log(
                "Generated Results:",
                results
            );

            if (
                !results ||
                !Array.isArray(results) ||
                results.length === 0
            ) {
                setError(
                    "No valid timetable could be generated with the current constraints."
                );

                return;
            }

            /* -------------------------------------------------------
               IMPORTANT FIX
      
               Store the result before navigation.
            ------------------------------------------------------- */

            const timetableData = {
                college,
                course,
                subjects,
                results,
                generatedAt:
                    new Date().toISOString(),
            };

            sessionStorage.setItem(
                "generatedTimetable",
                JSON.stringify(
                    timetableData
                )
            );

            console.log(
                "Saved timetable to sessionStorage."
            );

            /* -------------------------------------------------------
               NAVIGATE
            ------------------------------------------------------- */

            navigate(
                "/coordinator/timetable-results",
                {
                    state: timetableData,
                }
            );
        } catch (err) {
            console.error(
                "TIMETABLE GENERATION ERROR:",
                err
            );

            setError(
                err?.message ||
                "Unable to generate timetable."
            );
        } finally {
            setGenerating(false);
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="rounded-xl bg-white px-6 py-5 shadow">
                    <p className="font-semibold">
                        Loading timetable configuration...
                    </p>
                </div>
            </div>
        );
    }

    /* =========================================================
       UI
    ========================================================= */

    return (
        <div className="min-h-screen bg-slate-100">

            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

                    <div>
                        <h1 className="text-2xl font-bold">
                            Create Timetable
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            {college?.collegeName ||
                                "College"}
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            navigate(
                                "/coordinator"
                            )
                        }
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                        Back
                    </button>

                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-8">

                {/* ERROR */}

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <strong>
                            Unable to generate:
                        </strong>{" "}
                        {error}
                    </div>
                )}

                {/* SUCCESS */}

                {success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                {/* COURSE */}

                <section className="rounded-2xl bg-white p-8 shadow-sm">

                    <h2 className="text-xl font-bold">
                        Course / Batch Details
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Define the batch for which the timetable
                        will be generated.
                    </p>

                    <div className="mt-6 grid gap-5 md:grid-cols-4">

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Program / Course
                            </label>

                            <input
                                value={course.program}
                                onChange={(e) =>
                                    updateCourse(
                                        "program",
                                        e.target.value
                                    )
                                }
                                placeholder="B.Tech CSE"
                                className="w-full rounded-lg border px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Semester
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={course.semester}
                                onChange={(e) =>
                                    updateCourse(
                                        "semester",
                                        e.target.value
                                    )
                                }
                                placeholder="7"
                                className="w-full rounded-lg border px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Section
                            </label>

                            <input
                                value={course.section}
                                onChange={(e) =>
                                    updateCourse(
                                        "section",
                                        e.target.value
                                    )
                                }
                                placeholder="A"
                                className="w-full rounded-lg border px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Total Students
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={
                                    course.studentCount
                                }
                                onChange={(e) =>
                                    updateCourse(
                                        "studentCount",
                                        e.target.value
                                    )
                                }
                                placeholder="60"
                                className="w-full rounded-lg border px-4 py-3"
                            />
                        </div>

                    </div>
                </section>

                {/* SUBJECTS */}

                <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">

                    <h2 className="text-xl font-bold">
                        Add Subjects
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Define how many sessions each subject
                        requires per week.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">

                        <input
                            value={subjectForm.name}
                            onChange={(e) =>
                                updateSubjectForm(
                                    "name",
                                    e.target.value
                                )
                            }
                            placeholder="Subject Name"
                            className="rounded-lg border px-4 py-3"
                        />

                        <input
                            value={subjectForm.code}
                            onChange={(e) =>
                                updateSubjectForm(
                                    "code",
                                    e.target.value
                                )
                            }
                            placeholder="Subject Code"
                            className="rounded-lg border px-4 py-3"
                        />

                        <select
                            value={
                                subjectForm.facultyId
                            }
                            onChange={(e) =>
                                updateSubjectForm(
                                    "facultyId",
                                    e.target.value
                                )
                            }
                            className="rounded-lg border px-4 py-3"
                        >
                            <option value="">
                                Select Faculty
                            </option>

                            {faculty.map(
                                (member) => (
                                    <option
                                        key={member.id}
                                        value={member.id}
                                    >
                                        {member.name}
                                    </option>
                                )
                            )}
                        </select>

                        <select
                            value={subjectForm.type}
                            onChange={(e) => {
                                const type =
                                    e.target.value;

                                updateSubjectForm(
                                    "type",
                                    type
                                );

                                updateSubjectForm(
                                    "roomType",
                                    type === "lab"
                                        ? "lab"
                                        : "classroom"
                                );
                            }}
                            className="rounded-lg border px-4 py-3"
                        >
                            <option value="theory">
                                Theory
                            </option>

                            <option value="lab">
                                Laboratory
                            </option>
                        </select>

                        <input
                            type="number"
                            min="1"
                            value={
                                subjectForm.classesPerWeek
                            }
                            onChange={(e) =>
                                updateSubjectForm(
                                    "classesPerWeek",
                                    e.target.value
                                )
                            }
                            placeholder="Classes / Week"
                            className="rounded-lg border px-4 py-3"
                        />

                        <input
                            type="number"
                            min="1"
                            max="4"
                            value={
                                subjectForm.duration
                            }
                            onChange={(e) =>
                                updateSubjectForm(
                                    "duration",
                                    e.target.value
                                )
                            }
                            placeholder="Periods"
                            className="rounded-lg border px-4 py-3"
                        />

                        <select
                            value={
                                subjectForm.roomType
                            }
                            onChange={(e) =>
                                updateSubjectForm(
                                    "roomType",
                                    e.target.value
                                )
                            }
                            className="rounded-lg border px-4 py-3"
                        >
                            <option value="classroom">
                                Classroom
                            </option>

                            <option value="lab">
                                Laboratory
                            </option>

                            <option value="seminar">
                                Seminar Hall
                            </option>
                        </select>

                        <button
                            type="button"
                            onClick={addSubject}
                            className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            Add Subject
                        </button>

                    </div>

                    <div className="mt-8 space-y-3">

                        {subjects.map(
                            (subject) => (
                                <div
                                    key={subject.id}
                                    className="flex items-center justify-between rounded-xl border bg-slate-50 p-4"
                                >
                                    <div>
                                        <p className="font-semibold">
                                            {subject.name}

                                            {subject.code &&
                                                ` (${subject.code})`}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {subject.facultyName}
                                            {" • "}
                                            {
                                                subject.classesPerWeek
                                            }
                                            {" classes/week • "}
                                            {subject.duration}
                                            {" period"}
                                            {subject.duration >
                                                1
                                                ? "s"
                                                : ""}
                                            {" • "}
                                            {subject.type}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() =>
                                            removeSubject(
                                                subject.id
                                            )
                                        }
                                        className="font-semibold text-red-600 hover:underline"
                                    >
                                        Remove
                                    </button>

                                </div>
                            )
                        )}

                        {subjects.length ===
                            0 && (
                                <div className="rounded-xl border border-dashed p-8 text-center text-slate-400">
                                    No subjects added yet.
                                </div>
                            )}

                    </div>
                </section>

                {/* RESOURCES */}

                <section className="mt-6 rounded-2xl bg-white p-8 shadow-sm">

                    <h2 className="text-xl font-bold">
                        Scheduler Resources
                    </h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">
                                Working Days
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {
                                    college
                                        ?.workingDays
                                        ?.length || 0
                                }
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">
                                Rooms
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {rooms.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">
                                Faculty
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {faculty.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">
                                Period
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {
                                    college?.periodDuration ||
                                    0
                                }{" "}
                                min
                            </p>
                        </div>

                    </div>
                </section>

                {/* GENERATE */}

                <div className="mt-8 flex justify-end">

                    <button
                        onClick={
                            handleGenerate
                        }
                        disabled={
                            generating
                        }
                        className="rounded-xl bg-emerald-600 px-8 py-4 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {generating
                            ? "Generating Timetable..."
                            : "Generate Timetable"}
                    </button>

                </div>

            </main>
        </div>
    );
};

export default CreateTimetable;