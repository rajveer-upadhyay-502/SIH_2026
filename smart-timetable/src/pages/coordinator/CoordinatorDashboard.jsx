import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    collection,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    doc,
    where,
} from "firebase/firestore";

import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";

import {
    getCollegeConfig,
    getRooms,
    getFaculty,
} from "../../services/collegeConfigService";

import { db } from "../../firebase/config";

const CoordinatorDashboard = () => {
    const navigate = useNavigate();

    const { profile, user } = useAuth();

    /* =========================================================
       STATE
    ========================================================= */

    const [college, setCollege] =
        useState(null);

    const [rooms, setRooms] =
        useState([]);

    const [faculty, setFaculty] =
        useState([]);

    const [leaveRequests, setLeaveRequests] =
        useState([]);

    const [changeRequests, setChangeRequests] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [notification, setNotification] =
        useState("");

    const [processingLeaveId, setProcessingLeaveId] =
        useState(null);

    const [processingChangeId, setProcessingChangeId] =
        useState(null);

    /* =========================================================
       LOAD COLLEGE RESOURCES
    ========================================================= */

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                setError("");

                const [
                    collegeData,
                    roomsData,
                    facultyData,
                ] = await Promise.all([
                    getCollegeConfig(),
                    getRooms(),
                    getFaculty(),
                ]);

                setCollege(
                    collegeData
                );

                setRooms(
                    roomsData || []
                );

                setFaculty(
                    facultyData || []
                );
            } catch (err) {
                console.error(
                    "Coordinator dashboard error:",
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
       REAL-TIME PENDING LEAVE REQUESTS
    ========================================================= */

    useEffect(() => {
        if (!profile) {
            return;
        }

        const pendingLeaveQuery =
            query(
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

        const unsubscribe =
            onSnapshot(
                pendingLeaveQuery,
                (snapshot) => {
                    const requests =
                        snapshot.docs
                            .map(
                                (document) => ({
                                    id:
                                        document.id,
                                    ...document.data(),
                                })
                            )
                            .sort(
                                (
                                    a,
                                    b
                                ) => {
                                    const timeA =
                                        a.createdAt
                                            ?.toMillis?.() ||
                                        0;

                                    const timeB =
                                        b.createdAt
                                            ?.toMillis?.() ||
                                        0;

                                    return (
                                        timeB -
                                        timeA
                                    );
                                }
                            );

                    setLeaveRequests(
                        requests
                    );
                },
                (err) => {
                    console.error(
                        "Leave request listener error:",
                        err
                    );

                    setError(
                        err?.message ||
                        "Unable to load leave requests."
                    );
                }
            );

        return () => {
            unsubscribe();
        };
    }, [profile]);

    /* =========================================================
       REAL-TIME PENDING CHANGE REQUESTS
    ========================================================= */

    useEffect(() => {
        if (!profile) {
            return;
        }

        const pendingChangeQuery = query(
            collection(db, "changeRequests"),
            where("status", "==", "pending")
        );

        const unsubscribe = onSnapshot(
            pendingChangeQuery,
            (snapshot) => {
                const requests = snapshot.docs
                    .map((document) => ({
                        id: document.id,
                        ...document.data(),
                    }))
                    .sort((a, b) => {
                        const timeA = a.createdAt?.toMillis?.() || 0;
                        const timeB = b.createdAt?.toMillis?.() || 0;
                        return timeB - timeA;
                    });

                setChangeRequests(requests);
            },
            (err) => {
                console.error("Change request listener error:", err);
                setError(err?.message || "Unable to load change requests.");
            }
        );

        return () => {
            unsubscribe();
        };
    }, [profile]);

    /* =========================================================
       APPROVE LEAVE
    ========================================================= */

    const handleApproveLeave =
        async (requestId) => {
            if (!requestId) {
                return;
            }

            try {
                setProcessingLeaveId(
                    requestId
                );

                setError("");

                const requestRef =
                    doc(
                        db,
                        "leaveRequests",
                        requestId
                    );

                await updateDoc(
                    requestRef,
                    {
                        status: "approved",

                        reviewedBy:
                            user?.uid ||
                            profile?.id ||
                            "coordinator",

                        reviewedByName:
                            profile?.name ||
                            "Coordinator",

                        reviewedAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp(),
                    }
                );

                setNotification(
                    "Leave request approved successfully."
                );

                /*
                  The real-time listener is watching:
                  status == "pending"

                  Therefore this request will automatically
                  disappear from the pending list.
                */
            } catch (err) {
                console.error(
                    "Approve leave error:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to approve leave request."
                );
            } finally {
                setProcessingLeaveId(
                    null
                );
            }
        };

    /* =========================================================
       REJECT LEAVE
    ========================================================= */

    const handleRejectLeave =
        async (requestId) => {
            if (!requestId) {
                return;
            }

            try {
                setProcessingLeaveId(
                    requestId
                );

                setError("");

                const requestRef =
                    doc(
                        db,
                        "leaveRequests",
                        requestId
                    );

                await updateDoc(
                    requestRef,
                    {
                        status: "rejected",

                        reviewedBy:
                            user?.uid ||
                            profile?.id ||
                            "coordinator",

                        reviewedByName:
                            profile?.name ||
                            "Coordinator",

                        reviewedAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp(),
                    }
                );

                setNotification(
                    "Leave request rejected."
                );

                /*
                  Again, because the listener only retrieves
                  status == pending, this request disappears
                  automatically after the update.
                */
            } catch (err) {
                console.error(
                    "Reject leave error:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to reject leave request."
                );
            } finally {
                setProcessingLeaveId(
                    null
                );
            }
        };

    /* =========================================================
       APPROVE CHANGE REQUEST
    ========================================================= */

    const handleApproveChange = async (requestId) => {
        if (!requestId) return;

        try {
            setProcessingChangeId(requestId);
            setError("");

            const requestRef = doc(db, "changeRequests", requestId);

            await updateDoc(requestRef, {
                status: "approved",
                reviewedBy: user?.uid || profile?.id || "coordinator",
                reviewedByName: profile?.name || "Coordinator",
                reviewedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setNotification("Change request approved successfully.");
        } catch (err) {
            console.error("Approve change error:", err);
            setError(err?.message || "Failed to approve change request.");
        } finally {
            setProcessingChangeId(null);
        }
    };

    /* =========================================================
       REJECT CHANGE REQUEST
    ========================================================= */

    const handleRejectChange = async (requestId) => {
        if (!requestId) return;

        try {
            setProcessingChangeId(requestId);
            setError("");

            const requestRef = doc(db, "changeRequests", requestId);

            await updateDoc(requestRef, {
                status: "rejected",
                reviewedBy: user?.uid || profile?.id || "coordinator",
                reviewedByName: profile?.name || "Coordinator",
                reviewedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setNotification("Change request rejected.");
        } catch (err) {
            console.error("Reject change error:", err);
            setError(err?.message || "Failed to reject change request.");
        } finally {
            setProcessingChangeId(null);
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">

                <div className="rounded-xl bg-white px-6 py-5 shadow">

                    <p className="font-semibold text-slate-800">
                        Loading coordinator dashboard...
                    </p>

                </div>

            </div>
        );
    }

    /* =========================================================
       MAIN UI
    ========================================================= */

    return (
        <div className="min-h-screen bg-slate-100">

            {/* =================================================
               HEADER
            ================================================= */}

            <header className="border-b bg-white">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

                    <div>

                        <h1 className="text-2xl font-bold text-slate-900">
                            Academic Coordinator
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            {profile?.name ||
                                "Coordinator"}
                        </p>

                    </div>

                    <button
                        onClick={
                            logoutUser
                        }
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                        Logout
                    </button>

                </div>

            </header>


            <main className="mx-auto max-w-7xl px-8 py-8">

                {/* =================================================
                   ERROR
                ================================================= */}

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

                        <p className="font-semibold text-red-700">
                            Something went wrong
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>

                    </div>
                )}


                {/* =================================================
                   NOTIFICATION
                ================================================= */}

                {notification && (
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">

                        <div>

                            <p className="font-semibold text-blue-800">
                                Notification
                            </p>

                            <p className="mt-1 text-sm text-blue-700">
                                {
                                    notification
                                }
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                setNotification(
                                    ""
                                )
                            }
                            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700"
                        >
                            Dismiss
                        </button>

                    </div>
                )}


                {/* =================================================
                   COLLEGE INFORMATION
                ================================================= */}

                <div className="rounded-2xl bg-white p-8 shadow-sm">

                    <p className="text-sm font-semibold text-blue-600">
                        College
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        {college?.collegeName ||
                            "College not configured"}
                    </h2>

                    <p className="mt-2 text-slate-500">
                        {college?.universityName ||
                            "No university information available"}
                    </p>


                    <div className="mt-6 grid gap-4 md:grid-cols-4">

                        <div className="rounded-xl bg-slate-50 p-4">

                            <p className="text-xs text-slate-500">
                                Academic Year
                            </p>

                            <p className="mt-1 font-semibold">
                                {college?.academicYear ||
                                    "-"}
                            </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-4">

                            <p className="text-xs text-slate-500">
                                Working Days
                            </p>

                            <p className="mt-1 font-semibold">
                                {
                                    college
                                        ?.workingDays
                                        ?.length ||
                                    0
                                }
                            </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-4">

                            <p className="text-xs text-slate-500">
                                Rooms
                            </p>

                            <p className="mt-1 font-semibold">
                                {
                                    rooms.length
                                }
                            </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-4">

                            <p className="text-xs text-slate-500">
                                Faculty
                            </p>

                            <p className="mt-1 font-semibold">
                                {
                                    faculty.length
                                }
                            </p>

                        </div>

                    </div>

                </div>


                {/* =================================================
                   FACULTY LEAVE REQUESTS
                ================================================= */}

                <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>

                            <h2 className="text-xl font-bold text-slate-900">
                                Faculty Leave Requests
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Review leave requests submitted by faculty members.
                            </p>

                        </div>

                        <div className="w-fit rounded-full bg-amber-100 px-4 py-2">

                            <span className="text-sm font-bold text-amber-700">
                                {
                                    leaveRequests.length
                                }{" "}
                                Pending
                            </span>

                        </div>

                    </div>


                    <div className="mt-6 space-y-4">

                        {leaveRequests.length ===
                            0 ? (

                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

                                <p className="text-2xl">
                                    ✓
                                </p>

                                <p className="mt-2 font-semibold text-slate-700">
                                    No pending leave requests
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    New faculty requests will appear here automatically.
                                </p>

                            </div>

                        ) : (

                            leaveRequests.map(
                                (request) => {

                                    const isProcessing =
                                        processingLeaveId ===
                                        request.id;

                                    return (
                                        <div
                                            key={
                                                request.id
                                            }
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                        >

                                            {/* REQUEST HEADER */}

                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                                                <div>

                                                    <p className="text-lg font-bold text-slate-900">
                                                        {
                                                            request.facultyName ||
                                                            "Faculty"
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Faculty ID:{" "}
                                                        {
                                                            request.facultyId ||
                                                            "-"
                                                        }
                                                    </p>

                                                </div>

                                                <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
                                                    Pending
                                                </span>

                                            </div>


                                            {/* DATES */}

                                            <div className="mt-4 grid gap-3 md:grid-cols-3">

                                                <div className="rounded-lg bg-white p-3">

                                                    <p className="text-xs text-slate-400">
                                                        Start Date
                                                    </p>

                                                    <p className="mt-1 font-semibold">
                                                        {
                                                            request.startDate ||
                                                            "-"
                                                        }
                                                    </p>

                                                </div>


                                                <div className="rounded-lg bg-white p-3">

                                                    <p className="text-xs text-slate-400">
                                                        End Date
                                                    </p>

                                                    <p className="mt-1 font-semibold">
                                                        {
                                                            request.endDate ||
                                                            "-"
                                                        }
                                                    </p>

                                                </div>


                                                <div className="rounded-lg bg-white p-3">

                                                    <p className="text-xs text-slate-400">
                                                        Status
                                                    </p>

                                                    <p className="mt-1 font-semibold text-amber-600">
                                                        Pending Review
                                                    </p>

                                                </div>

                                            </div>


                                            {/* REASON */}

                                            <div className="mt-4 rounded-lg bg-white p-4">

                                                <p className="text-xs font-semibold uppercase text-slate-400">
                                                    Reason
                                                </p>

                                                <p className="mt-1 text-sm text-slate-700">
                                                    {
                                                        request.reason ||
                                                        "No reason provided."
                                                    }
                                                </p>

                                            </div>


                                            {/* ACTION BUTTONS */}

                                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                                                <button
                                                    type="button"
                                                    disabled={
                                                        isProcessing
                                                    }
                                                    onClick={() =>
                                                        handleRejectLeave(
                                                            request.id
                                                        )
                                                    }
                                                    className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isProcessing
                                                        ? "Processing..."
                                                        : "Decline"}
                                                </button>


                                                <button
                                                    type="button"
                                                    disabled={
                                                        isProcessing
                                                    }
                                                    onClick={() =>
                                                        handleApproveLeave(
                                                            request.id
                                                        )
                                                    }
                                                    className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isProcessing
                                                        ? "Processing..."
                                                        : "Approve"}
                                                </button>

                                            </div>

                                        </div>
                                    );
                                }
                            )

                        )}

                    </div>

                </div>


                {/* =================================================
                   FACULTY CHANGE REQUESTS
                ================================================= */}

                <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Timetable Change Requests
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Review timetable adjustments requested by faculty.
                            </p>
                        </div>

                        <div className="w-fit rounded-full bg-blue-100 px-4 py-2">
                            <span className="text-sm font-bold text-blue-700">
                                {changeRequests.length} Pending
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {changeRequests.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                <p className="text-2xl">✓</p>
                                <p className="mt-2 font-semibold text-slate-700">
                                    No pending change requests
                                </p>
                            </div>
                        ) : (
                            changeRequests.map((request) => {
                                const isProcessing = processingChangeId === request.id;

                                return (
                                    <div
                                        key={request.id}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                    >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-lg font-bold text-slate-900">
                                                    {request.facultyName || "Faculty"}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Course Key: {request.courseKey || "-"}
                                                </p>
                                            </div>
                                            <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                                                Pending
                                            </span>
                                        </div>

                                        <div className="mt-4 rounded-lg bg-white p-4">
                                            <p className="text-xs font-semibold uppercase text-slate-400">
                                                Details
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                                                {request.details || "No details provided."}
                                            </p>
                                        </div>

                                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                            <button
                                                type="button"
                                                disabled={isProcessing}
                                                onClick={() => handleRejectChange(request.id)}
                                                className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isProcessing ? "Processing..." : "Decline"}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isProcessing}
                                                onClick={() => handleApproveChange(request.id)}
                                                className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isProcessing ? "Processing..." : "Approve"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>


                {/* =================================================
                   RESOURCE CARDS
                ================================================= */}

                <div className="mt-8 grid gap-6 md:grid-cols-2">


                    {/* ROOMS */}

                    <div className="rounded-2xl bg-white p-6 shadow-sm">

                        <h3 className="font-bold">
                            Rooms
                        </h3>

                        <div className="mt-4 space-y-3">

                            {rooms.length ===
                                0 ? (

                                <p className="text-sm text-slate-500">
                                    No rooms configured yet.
                                </p>

                            ) : (

                                rooms
                                    .slice(
                                        0,
                                        6
                                    )
                                    .map(
                                        (
                                            room
                                        ) => (

                                            <div
                                                key={
                                                    room.id
                                                }
                                                className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                                            >

                                                <div>

                                                    <p className="font-medium">
                                                        {
                                                            room.name
                                                        }
                                                    </p>

                                                    <p className="text-xs capitalize text-slate-500">
                                                        {
                                                            room.type
                                                        }
                                                    </p>

                                                </div>

                                                <span className="text-sm font-semibold">
                                                    {
                                                        room.capacity
                                                    }{" "}
                                                    seats
                                                </span>

                                            </div>

                                        )
                                    )

                            )}

                        </div>

                    </div>


                    {/* FACULTY */}

                    <div className="rounded-2xl bg-white p-6 shadow-sm">

                        <h3 className="font-bold">
                            Faculty Resources
                        </h3>

                        <div className="mt-4 space-y-3">

                            {faculty.length ===
                                0 ? (

                                <p className="text-sm text-slate-500">
                                    No faculty configured yet.
                                </p>

                            ) : (

                                faculty
                                    .slice(
                                        0,
                                        6
                                    )
                                    .map(
                                        (
                                            item
                                        ) => (

                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                                            >

                                                <div>

                                                    <p className="font-medium">
                                                        {
                                                            item.name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {
                                                            item.department ||
                                                            "-"
                                                        }
                                                    </p>

                                                </div>

                                                <span className="text-sm font-semibold">
                                                    {
                                                        item.maxHoursPerWeek
                                                    }{" "}
                                                    hrs/week
                                                </span>

                                            </div>

                                        )
                                    )

                            )}

                        </div>

                    </div>

                </div>


                {/* =================================================
                   TIMETABLE MANAGEMENT
                ================================================= */}

                <div className="mt-8">

                    <h2 className="text-xl font-bold text-slate-900">
                        Timetable Management
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Use the administrator's saved resources to create an optimized timetable.
                    </p>

                    <div className="mt-5">

                        <button
                            onClick={() =>
                                navigate(
                                    "/coordinator/create-timetable"
                                )
                            }
                            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            Create Timetable
                        </button>

                    </div>

                </div>

            </main>

        </div>
    );
};

export default CoordinatorDashboard;