import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";

import {
    getPublishedTimetablesForFaculty,
} from "../../services/timetableService";

import {
    getFacultyByUserId,
    getFacultyLeaveRequests,
    submitLeaveRequest,
    submitChangeRequest,
    updateFacultyAvailability,
} from "../../services/facultyService";

const DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const FacultyDashboard = () => {
    const { user, profile } = useAuth();

    /* =========================================================
       STATE
    ========================================================= */

    const [faculty, setFaculty] = useState(null);

    const [timetables, setTimetables] = useState([]);

    const [leaveRequests, setLeaveRequests] =
        useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [notice, setNotice] = useState("");

    const [activeTab, setActiveTab] =
        useState("dashboard");

    const [availability, setAvailability] =
        useState({});

    const [leaveForm, setLeaveForm] = useState({
        startDate: "",
        endDate: "",
        reason: "",
    });

    const [changeForm, setChangeForm] =
        useState({
            timetableId: "",
            subjectId: "",
            subjectName: "",
            day: "",
            startTime: "",
            reason: "",
        });

    const [submittingLeave, setSubmittingLeave] =
        useState(false);

    const [submittingChange, setSubmittingChange] =
        useState(false);

    const [savingAvailability, setSavingAvailability] =
        useState(false);

    /* =========================================================
       LOAD FACULTY DATA
    ========================================================= */

    useEffect(() => {
        const loadData = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                setNotice("");

                const facultyProfile =
                    await getFacultyByUserId(
                        user.uid,
                        profile
                    );

                if (!facultyProfile) {
                    setFaculty(null);

                    setError(
                        "Faculty profile was not found. Check that the employeeId in your users document matches the employeeId in the faculty document."
                    );

                    return;
                }

                setFaculty(facultyProfile);

                setAvailability(
                    facultyProfile.availability || {}
                );

                const [
                    timetableData,
                    leaveData,
                ] = await Promise.all([
                    getPublishedTimetablesForFaculty(
                        facultyProfile.id
                    ),
                    getFacultyLeaveRequests(
                        user.uid
                    ),
                ]);

                setTimetables(
                    timetableData || []
                );

                setLeaveRequests(
                    leaveData || []
                );
            } catch (err) {
                console.error(
                    "Faculty dashboard error:",
                    err
                );

                setFaculty(null);

                setError(
                    err?.message ||
                    "Failed to load faculty dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user?.uid, profile]);

    /* =========================================================
       DERIVED DATA
  
       IMPORTANT:
       These are NOT hooks.
       Therefore they are safe even when faculty is null.
    ========================================================= */

    const facultyClasses = faculty
        ? timetables.flatMap(
            (timetable) =>
                (timetable.schedule || [])
                    .filter(
                        (item) =>
                            item.facultyId ===
                            faculty.id
                    )
                    .map((item) => ({
                        ...item,

                        timetableId:
                            timetable.id,

                        program:
                            timetable.program,

                        semester:
                            timetable.semester,

                        section:
                            timetable.section,

                        academicYear:
                            timetable.academicYear,

                        courseKey:
                            timetable.courseKey,

                        timetableStatus:
                            timetable.status,
                    }))
        )
        : [];

    const sortedFacultyClasses = [
        ...facultyClasses,
    ].sort((a, b) => {
        const dayDifference =
            DAY_ORDER.indexOf(a.day) -
            DAY_ORDER.indexOf(b.day);

        if (dayDifference !== 0) {
            return dayDifference;
        }

        return a.startTime.localeCompare(
            b.startTime
        );
    });

    const jsDay =
        new Date().getDay();

    const todayName =
        jsDay === 0
            ? "Sunday"
            : DAY_ORDER[jsDay - 1];

    const todayClasses =
        sortedFacultyClasses.filter(
            (item) =>
                item.day === todayName
        );

    const weeklyPeriods =
        facultyClasses.reduce(
            (total, item) =>
                total +
                Number(
                    item.duration || 1
                ),
            0
        );

    /*
      This should eventually come from collegeConfig.
      For now timetable periods are 50 minutes,
      matching your current Admin setup.
    */

    const periodDuration = 50;

    const weeklyHours =
        (weeklyPeriods *
            periodDuration) /
        60;

    const weeklyLimit = Number(
        faculty?.maxHoursPerWeek || 0
    );

    const workloadPercentage =
        weeklyLimit > 0
            ? Math.min(
                100,
                (weeklyHours /
                    weeklyLimit) *
                100
            )
            : 0;

    const pendingLeaves =
        leaveRequests.filter(
            (item) =>
                item.status === "pending"
        ).length;

    const approvedLeaves =
        leaveRequests.filter(
            (item) =>
                item.status === "approved"
        ).length;

    /* =========================================================
       LEAVE REQUEST
    ========================================================= */

    const handleLeaveSubmit =
        async (event) => {
            event.preventDefault();

            setError("");
            setNotice("");

            if (
                !leaveForm.startDate ||
                !leaveForm.endDate
            ) {
                setError(
                    "Please select both start and end dates."
                );
                return;
            }

            if (
                leaveForm.endDate <
                leaveForm.startDate
            ) {
                setError(
                    "End date cannot be before start date."
                );
                return;
            }

            if (
                !leaveForm.reason.trim()
            ) {
                setError(
                    "Please enter a reason for the leave."
                );
                return;
            }

            try {
                setSubmittingLeave(true);

                const request =
                    await submitLeaveRequest({
                        facultyId: faculty.id,

                        facultyUserId: user.uid,

                        facultyName: faculty.name,

                        startDate:
                            leaveForm.startDate,

                        endDate:
                            leaveForm.endDate,

                        reason:
                            leaveForm.reason.trim(),
                    });

                setLeaveRequests(
                    (previous) => [
                        request,
                        ...previous,
                    ]
                );

                setLeaveForm({
                    startDate: "",
                    endDate: "",
                    reason: "",
                });

                setNotice(
                    "Leave request submitted successfully."
                );
            } catch (err) {
                console.error(
                    "Leave request error:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to submit leave request."
                );
            } finally {
                setSubmittingLeave(false);
            }
        };

    /* =========================================================
       CHANGE REQUEST
    ========================================================= */

    const handleChangeRequest =
        async (event) => {
            event.preventDefault();

            setError("");
            setNotice("");

            if (
                !changeForm.timetableId
            ) {
                setError(
                    "Please select a class."
                );
                return;
            }

            if (
                !changeForm.reason.trim()
            ) {
                setError(
                    "Please enter a reason for the change request."
                );
                return;
            }

            try {
                setSubmittingChange(true);

                await submitChangeRequest({
                    timetableId:
                        changeForm.timetableId,

                    facultyId: faculty.id,

                    facultyUserId: user.uid,

                    facultyName:
                        faculty.name,

                    subjectId:
                        changeForm.subjectId,

                    subjectName:
                        changeForm.subjectName,

                    day: changeForm.day,

                    startTime:
                        changeForm.startTime,

                    reason:
                        changeForm.reason.trim(),
                });

                setChangeForm({
                    timetableId: "",
                    subjectId: "",
                    subjectName: "",
                    day: "",
                    startTime: "",
                    reason: "",
                });

                setNotice(
                    "Timetable change request submitted successfully."
                );
            } catch (err) {
                console.error(
                    "Change request error:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to submit change request."
                );
            } finally {
                setSubmittingChange(false);
            }
        };

    /* =========================================================
       AVAILABILITY
    ========================================================= */

    const toggleAvailability = (
        day
    ) => {
        setAvailability(
            (previous) => ({
                ...previous,
                [day]:
                    previous[day] ===
                    false,
            })
        );
    };

    const saveAvailability =
        async () => {
            if (!faculty) {
                return;
            }

            try {
                setSavingAvailability(true);

                setError("");
                setNotice("");

                await updateFacultyAvailability({
                    facultyId: faculty.id,
                    availability,
                });

                setFaculty(
                    (previous) => ({
                        ...previous,
                        availability,
                    })
                );

                setNotice(
                    "Availability updated successfully."
                );
            } catch (err) {
                console.error(
                    "Availability error:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to update availability."
                );
            } finally {
                setSavingAvailability(false);
            }
        };

    /* =========================================================
       LOGOUT
    ========================================================= */

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error(
                "Logout error:",
                err
            );
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="rounded-2xl bg-white px-8 py-6 shadow">
                    <p className="font-semibold text-slate-800">
                        Loading faculty dashboard...
                    </p>
                </div>
            </div>
        );
    }

    /* =========================================================
       PROFILE NOT FOUND
    ========================================================= */

    if (!faculty) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
                <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
                        ⚠️
                    </div>

                    <h1 className="mt-5 text-2xl font-bold">
                        Faculty profile unavailable
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-red-600">
                        {error ||
                            "Your faculty profile could not be found."}
                    </p>

                    <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-500">

                        <p className="font-semibold text-slate-700">
                            Required connection
                        </p>

                        <p className="mt-2">
                            users.employeeId
                            {" "}
                            must match
                            {" "}
                            faculty.employeeId
                        </p>

                    </div>

                    <button
                        onClick={
                            handleLogout
                        }
                        className="mt-6 rounded-lg bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600"
                    >
                        Logout
                    </button>

                </div>
            </div>
        );
    }

    /* =========================================================
       MAIN DASHBOARD
    ========================================================= */

    return (
        <div className="min-h-screen bg-slate-100">

            {/* HEADER */}

            <header className="border-b bg-white">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

                    <div>

                        <p className="text-sm font-semibold text-blue-600">
                            Smart Timetable
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Faculty Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Welcome, {faculty.name}
                        </p>

                    </div>

                    <div className="flex items-center gap-4">

                        <div className="hidden text-right md:block">

                            <p className="text-sm font-semibold">
                                {faculty.employeeId ||
                                    "-"}
                            </p>

                            <p className="text-xs text-slate-500">
                                {faculty.department ||
                                    "Faculty"}
                            </p>

                        </div>

                        <button
                            onClick={
                                handleLogout
                            }
                            className="rounded-lg bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600"
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">

                {/* ALERTS */}

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {notice}
                    </div>
                )}

                {/* STATISTICS */}

                <div className="grid gap-5 md:grid-cols-4">

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Today's Classes
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {todayClasses.length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Weekly Classes
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {facultyClasses.length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">

                        <p className="text-sm text-slate-500">
                            Weekly Teaching Load
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {weeklyHours.toFixed(1)}
                            <span className="ml-1 text-sm">
                                hrs
                            </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Limit:{" "}
                            {faculty.maxHoursPerWeek ||
                                "-"}{" "}
                            hrs/week
                        </p>

                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">

                        <p className="text-sm text-slate-500">
                            Pending Leave Requests
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {pendingLeaves}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Approved:{" "}
                            {approvedLeaves}
                        </p>

                    </div>

                </div>

                {/* TABS */}

                <div className="mt-8 flex flex-wrap gap-2">

                    {[
                        [
                            "dashboard",
                            "Overview",
                        ],
                        [
                            "timetable",
                            "My Timetable",
                        ],
                        [
                            "leave",
                            "Leave Requests",
                        ],
                        [
                            "availability",
                            "My Availability",
                        ],
                        [
                            "changes",
                            "Change Request",
                        ],
                    ].map(
                        ([value, label]) => (
                            <button
                                key={value}
                                onClick={() => {
                                    setActiveTab(
                                        value
                                    );
                                    setError("");
                                    setNotice("");
                                }}
                                className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${activeTab === value
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {label}
                            </button>
                        )
                    )}

                </div>

                {/* =====================================================
            OVERVIEW
        ===================================================== */}

                {activeTab ===
                    "dashboard" && (
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">

                            {/* TODAY */}

                            <section className="rounded-2xl bg-white p-6 shadow-sm">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <h2 className="text-xl font-bold">
                                            Today's Classes
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {todayName}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() =>
                                            setActiveTab(
                                                "timetable"
                                            )
                                        }
                                        className="text-sm font-semibold text-blue-600 hover:underline"
                                    >
                                        View timetable
                                    </button>

                                </div>

                                <div className="mt-6 space-y-3">

                                    {todayClasses.length === 0 ? (
                                        <div className="rounded-xl bg-slate-50 p-6 text-center">

                                            <p className="text-2xl">
                                                🎉
                                            </p>

                                            <p className="mt-2 text-sm font-medium">
                                                No classes today
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Enjoy the academic miracle.
                                            </p>

                                        </div>
                                    ) : (
                                        todayClasses.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <div
                                                    key={`${item.timetableId}-${item.subjectId}-${item.period}-${index}`}
                                                    className="rounded-xl border bg-slate-50 p-4"
                                                >

                                                    <div className="flex items-start justify-between gap-4">

                                                        <div>

                                                            <p className="font-bold">
                                                                {
                                                                    item.subjectName
                                                                }
                                                            </p>

                                                            {item.subjectCode && (
                                                                <p className="mt-1 text-xs font-semibold text-blue-600">
                                                                    {
                                                                        item.subjectCode
                                                                    }
                                                                </p>
                                                            )}

                                                            <p className="mt-2 text-sm text-slate-500">
                                                                {
                                                                    item.program
                                                                }
                                                                {" • Sem "}
                                                                {
                                                                    item.semester
                                                                }
                                                                {" • Sec "}
                                                                {
                                                                    item.section
                                                                }
                                                            </p>

                                                        </div>

                                                        <span className="shrink-0 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
                                                            {
                                                                item.startTime
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                item.endTime
                                                            }
                                                        </span>

                                                    </div>

                                                    <div className="mt-3 flex gap-5 text-xs text-slate-500">

                                                        <span>
                                                            🏫 Room:{" "}
                                                            {
                                                                item.roomName
                                                            }
                                                        </span>

                                                        <span>
                                                            ⏱{" "}
                                                            {
                                                                item.duration ||
                                                                1
                                                            }{" "}
                                                            period
                                                            {
                                                                Number(
                                                                    item.duration
                                                                ) >
                                                                    1
                                                                    ? "s"
                                                                    : ""
                                                            }
                                                        </span>

                                                    </div>

                                                </div>
                                            )
                                        )
                                    )}

                                </div>

                            </section>

                            {/* WORKLOAD */}

                            <section className="rounded-2xl bg-white p-6 shadow-sm">

                                <h2 className="text-xl font-bold">
                                    Teaching Workload
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Assigned workload from the published timetable.
                                </p>

                                <div className="mt-6 grid gap-4 md:grid-cols-2">

                                    <div className="rounded-xl bg-slate-50 p-5">

                                        <p className="text-sm text-slate-500">
                                            Weekly Limit
                                        </p>

                                        <p className="mt-2 text-3xl font-bold">
                                            {
                                                faculty.maxHoursPerWeek ||
                                                "-"
                                            }
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            hours/week
                                        </p>

                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-5">

                                        <p className="text-sm text-slate-500">
                                            Assigned
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-blue-600">
                                            {weeklyHours.toFixed(1)}
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            hours/week
                                        </p>

                                    </div>

                                </div>

                                <div className="mt-6">

                                    <div className="mb-2 flex justify-between text-sm">

                                        <span>
                                            Workload utilization
                                        </span>

                                        <span className="font-semibold">
                                            {Math.round(
                                                workloadPercentage
                                            )}
                                            %
                                        </span>

                                    </div>

                                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">

                                        <div
                                            className="h-full rounded-full bg-blue-600"
                                            style={{
                                                width: `${workloadPercentage}%`,
                                            }}
                                        />

                                    </div>

                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">

                                    <div className="rounded-lg border p-4">

                                        <p className="text-xs text-slate-500">
                                            Max hours/day
                                        </p>

                                        <p className="mt-1 text-xl font-bold">
                                            {
                                                faculty.maxHoursPerDay ||
                                                "-"
                                            }
                                        </p>

                                    </div>

                                    <div className="rounded-lg border p-4">

                                        <p className="text-xs text-slate-500">
                                            Max classes/day
                                        </p>

                                        <p className="mt-1 text-xl font-bold">
                                            {
                                                faculty.maxClassesPerDay ||
                                                "-"
                                            }
                                        </p>

                                    </div>

                                </div>

                            </section>

                        </div>
                    )}

                {/* =====================================================
            MY TIMETABLE
        ===================================================== */}

                {activeTab ===
                    "timetable" && (
                        <section className="mt-6 space-y-6">

                            {timetables.length === 0 ? (
                                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

                                    <div className="text-4xl">
                                        📅
                                    </div>

                                    <h2 className="mt-4 text-xl font-bold">
                                        No Published Timetable
                                    </h2>

                                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                        Your coordinator has not published
                                        a timetable containing your classes.
                                    </p>

                                </div>
                            ) : (
                                timetables.map(
                                    (timetable) => {

                                        const classes =
                                            sortedFacultyClasses.filter(
                                                (item) =>
                                                    item.timetableId ===
                                                    timetable.id
                                            );

                                        return (
                                            <div
                                                key={
                                                    timetable.id
                                                }
                                                className="rounded-2xl bg-white p-6 shadow-sm"
                                            >

                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                                                    <div>

                                                        <h2 className="text-xl font-bold">
                                                            {
                                                                timetable.program
                                                            }
                                                            {" • Semester "}
                                                            {
                                                                timetable.semester
                                                            }
                                                            {" • Section "}
                                                            {
                                                                timetable.section
                                                            }
                                                        </h2>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Academic Year:{" "}
                                                            {
                                                                timetable.academicYear ||
                                                                "-"
                                                            }
                                                        </p>

                                                    </div>

                                                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                                        Published
                                                    </span>

                                                </div>

                                                <div className="mt-6 overflow-x-auto">

                                                    <table className="w-full min-w-[850px] border-collapse text-sm">

                                                        <thead>

                                                            <tr className="bg-slate-900 text-left text-white">

                                                                <th className="border border-slate-700 p-3">
                                                                    Day
                                                                </th>

                                                                <th className="border border-slate-700 p-3">
                                                                    Time
                                                                </th>

                                                                <th className="border border-slate-700 p-3">
                                                                    Subject
                                                                </th>

                                                                <th className="border border-slate-700 p-3">
                                                                    Room
                                                                </th>

                                                            </tr>

                                                        </thead>

                                                        <tbody>

                                                            {classes.length === 0 ? (
                                                                <tr>
                                                                    <td
                                                                        colSpan="4"
                                                                        className="border p-8 text-center text-slate-400"
                                                                    >
                                                                        No classes assigned.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                classes.map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => (
                                                                        <tr
                                                                            key={`${item.subjectId}-${item.day}-${item.period}-${index}`}
                                                                            className="hover:bg-slate-50"
                                                                        >

                                                                            <td className="border p-3 font-semibold">
                                                                                {
                                                                                    item.day
                                                                                }
                                                                            </td>

                                                                            <td className="border p-3">
                                                                                {
                                                                                    item.startTime
                                                                                }{" "}
                                                                                -{" "}
                                                                                {
                                                                                    item.endTime
                                                                                }
                                                                            </td>

                                                                            <td className="border p-3">

                                                                                <p className="font-semibold">
                                                                                    {
                                                                                        item.subjectName
                                                                                    }
                                                                                </p>

                                                                                {item.subjectCode && (
                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        {
                                                                                            item.subjectCode
                                                                                        }
                                                                                    </p>
                                                                                )}

                                                                            </td>

                                                                            <td className="border p-3">
                                                                                {
                                                                                    item.roomName
                                                                                }
                                                                            </td>

                                                                        </tr>
                                                                    )
                                                                )
                                                            )}

                                                        </tbody>

                                                    </table>

                                                </div>

                                            </div>
                                        );
                                    }
                                )
                            )}

                        </section>
                    )}

                {/* =====================================================
            LEAVE REQUEST
        ===================================================== */}

                {activeTab === "leave" && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">

                        <section className="rounded-2xl bg-white p-6 shadow-sm">

                            <h2 className="text-xl font-bold">
                                Request Leave
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Submit a leave request to the academic coordinator.
                            </p>

                            <form
                                onSubmit={
                                    handleLeaveSubmit
                                }
                                className="mt-6 space-y-4"
                            >

                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            leaveForm.startDate
                                        }
                                        onChange={(e) =>
                                            setLeaveForm(
                                                (previous) => ({
                                                    ...previous,
                                                    startDate:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        className="w-full rounded-lg border px-4 py-3"
                                    />

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        End Date
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            leaveForm.endDate
                                        }
                                        onChange={(e) =>
                                            setLeaveForm(
                                                (previous) => ({
                                                    ...previous,
                                                    endDate:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        className="w-full rounded-lg border px-4 py-3"
                                    />

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        Reason
                                    </label>

                                    <textarea
                                        rows="5"
                                        value={
                                            leaveForm.reason
                                        }
                                        onChange={(e) =>
                                            setLeaveForm(
                                                (previous) => ({
                                                    ...previous,
                                                    reason:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        placeholder="Enter your leave reason..."
                                        className="w-full rounded-lg border px-4 py-3"
                                    />

                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        submittingLeave
                                    }
                                    className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submittingLeave
                                        ? "Submitting..."
                                        : "Submit Leave Request"}
                                </button>

                            </form>

                        </section>

                        <section className="rounded-2xl bg-white p-6 shadow-sm">

                            <h2 className="text-xl font-bold">
                                My Leave Requests
                            </h2>

                            <div className="mt-6 space-y-3">

                                {leaveRequests.length === 0 ? (
                                    <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                                        No leave requests yet.
                                    </div>
                                ) : (
                                    leaveRequests.map(
                                        (request) => (
                                            <div
                                                key={
                                                    request.id
                                                }
                                                className="rounded-xl border bg-slate-50 p-4"
                                            >

                                                <div className="flex items-start justify-between gap-3">

                                                    <div>

                                                        <p className="font-semibold">
                                                            {
                                                                request.startDate
                                                            }{" "}
                                                            →
                                                            {" "}
                                                            {
                                                                request.endDate
                                                            }
                                                        </p>

                                                        <p className="mt-2 text-sm text-slate-500">
                                                            {
                                                                request.reason
                                                            }
                                                        </p>

                                                    </div>

                                                    <span
                                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${request.status ===
                                                                "approved"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : request.status ===
                                                                    "rejected"
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-amber-100 text-amber-700"
                                                            }`}
                                                    >
                                                        {
                                                            request.status
                                                        }
                                                    </span>

                                                </div>

                                            </div>
                                        )
                                    )
                                )}

                            </div>

                        </section>

                    </div>
                )}

                {/* =====================================================
            AVAILABILITY
        ===================================================== */}

                {activeTab ===
                    "availability" && (
                        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

                            <h2 className="text-xl font-bold">
                                My Availability
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Set the days you are generally available.
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">

                                {DAY_ORDER.slice(
                                    0,
                                    6
                                ).map((day) => {

                                    const available =
                                        availability[day] !==
                                        false;

                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() =>
                                                toggleAvailability(
                                                    day
                                                )
                                            }
                                            className={`rounded-xl border p-5 text-left ${available
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-400"
                                                }`}
                                        >

                                            <div className="flex items-center justify-between">

                                                <p className="font-bold">
                                                    {day}
                                                </p>

                                                <span className="text-lg">
                                                    {available
                                                        ? "✓"
                                                        : "×"}
                                                </span>

                                            </div>

                                            <p className="mt-1 text-sm">
                                                {available
                                                    ? "Available"
                                                    : "Unavailable"}
                                            </p>

                                        </button>
                                    );
                                })}

                            </div>

                            <button
                                type="button"
                                onClick={
                                    saveAvailability
                                }
                                disabled={
                                    savingAvailability
                                }
                                className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {savingAvailability
                                    ? "Saving..."
                                    : "Save Availability"}
                            </button>

                        </section>
                    )}

                {/* =====================================================
            CHANGE REQUEST
        ===================================================== */}

                {activeTab ===
                    "changes" && (
                        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

                            <h2 className="text-xl font-bold">
                                Request Timetable Change
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Submit a request when a published class needs adjustment.
                            </p>

                            <form
                                onSubmit={
                                    handleChangeRequest
                                }
                                className="mt-6 max-w-2xl space-y-5"
                            >

                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        Select Class
                                    </label>

                                    <select
                                        value={
                                            changeForm.timetableId
                                                ? [
                                                    changeForm.timetableId,
                                                    changeForm.subjectId,
                                                    changeForm.day,
                                                    changeForm.startTime,
                                                ].join("|")
                                                : ""
                                        }
                                        onChange={(e) => {

                                            const value =
                                                e.target.value;

                                            if (!value) {
                                                setChangeForm({
                                                    timetableId: "",
                                                    subjectId: "",
                                                    subjectName: "",
                                                    day: "",
                                                    startTime: "",
                                                    reason: "",
                                                });

                                                return;
                                            }

                                            const [
                                                timetableId,
                                                subjectId,
                                                day,
                                                startTime,
                                            ] =
                                                value.split("|");

                                            const selected =
                                                sortedFacultyClasses.find(
                                                    (item) =>
                                                        item.timetableId ===
                                                        timetableId &&
                                                        item.subjectId ===
                                                        subjectId &&
                                                        item.day ===
                                                        day &&
                                                        item.startTime ===
                                                        startTime
                                                );

                                            setChangeForm({
                                                timetableId,
                                                subjectId,
                                                subjectName:
                                                    selected?.subjectName ||
                                                    "",
                                                day,
                                                startTime,
                                                reason: "",
                                            });
                                        }}
                                        className="w-full rounded-lg border px-4 py-3"
                                    >

                                        <option value="">
                                            Select a class
                                        </option>

                                        {sortedFacultyClasses.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <option
                                                    key={`${item.timetableId}-${item.subjectId}-${item.day}-${item.startTime}-${index}`}
                                                    value={[
                                                        item.timetableId,
                                                        item.subjectId,
                                                        item.day,
                                                        item.startTime,
                                                    ].join("|")}
                                                >
                                                    {item.day}
                                                    {" • "}
                                                    {
                                                        item.startTime
                                                    }
                                                    {" • "}
                                                    {
                                                        item.subjectName
                                                    }
                                                    {" • "}
                                                    {
                                                        item.program
                                                    }
                                                    {" Sec "}
                                                    {
                                                        item.section
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        Reason
                                    </label>

                                    <textarea
                                        rows="5"
                                        value={
                                            changeForm.reason
                                        }
                                        onChange={(e) =>
                                            setChangeForm(
                                                (previous) => ({
                                                    ...previous,
                                                    reason:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        placeholder="Explain why the class needs to be changed..."
                                        className="w-full rounded-lg border px-4 py-3"
                                    />

                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        submittingChange
                                    }
                                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submittingChange
                                        ? "Submitting..."
                                        : "Submit Change Request"}
                                </button>

                            </form>

                        </section>
                    )}

            </main>
        </div>
    );
};

export default FacultyDashboard;