import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";

import {
    getCollegeConfig,
    getRooms,
    getFaculty,
} from "../../services/collegeConfigService";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [college, setCollege] =
        useState(null);

    const [rooms, setRooms] =
        useState([]);

    const [faculty, setFaculty] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [
                    collegeData,
                    roomsData,
                    facultyData,
                ] = await Promise.all([
                    getCollegeConfig(),
                    getRooms(),
                    getFaculty(),
                ]);

                setCollege(collegeData);
                setRooms(roomsData);
                setFaculty(facultyData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">

            {/* HEADER */}

            <header className="border-b bg-white">

                <div className="mx-auto max-w-7xl px-8 py-5 flex items-center justify-between">

                    <div>

                        <h1 className="text-2xl font-bold">
                            Smart Timetable
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Administrator Dashboard
                        </p>

                    </div>

                    <div className="flex items-center gap-4">

                        <div className="text-right">

                            <div className="text-sm font-semibold">
                                {profile?.name}
                            </div>

                            <div className="text-xs text-slate-500">
                                Administrator
                            </div>

                        </div>

                        <button
                            onClick={logoutUser}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </header>

            <main className="mx-auto max-w-7xl px-8 py-8">

                {/* COLLEGE CARD */}

                <div className="rounded-2xl bg-white p-8 shadow-sm">

                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                        <div>

                            <p className="text-sm font-medium text-blue-600">
                                College Configuration
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-900">
                                {college?.collegeName ||
                                    "College setup not completed"}
                            </h2>

                            <p className="mt-2 text-slate-500">
                                {college?.universityName ||
                                    "Add college information to begin."}
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate("/admin/setup")
                            }
                            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            {college
                                ? "Edit College Setup"
                                : "Start College Setup"}
                        </button>

                    </div>

                </div>

                {/* STATS */}

                <div className="mt-8 grid gap-5 md:grid-cols-4">

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Working Days
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {college?.workingDays?.length ||
                                0}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Rooms
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {rooms.length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Faculty
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {faculty.length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">

                        <p className="text-sm text-slate-500">
                            Period Duration
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {college?.periodDuration || 0}
                            <span className="ml-1 text-sm font-medium">
                                min
                            </span>
                        </p>

                    </div>

                </div>

                {/* CONFIGURATION SUMMARY */}

                <div className="mt-8 grid gap-6 md:grid-cols-2">

                    <div className="rounded-2xl bg-white p-6 shadow-sm">

                        <h3 className="text-lg font-bold">
                            Working Schedule
                        </h3>

                        <div className="mt-5 space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Working days
                                </span>

                                <span className="font-medium">
                                    {college?.workingDays?.join(
                                        ", "
                                    ) || "-"}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    College timing
                                </span>

                                <span className="font-medium">
                                    {college?.workingHours
                                        ? `${college.workingHours.start} - ${college.workingHours.end}`
                                        : "-"}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Breaks
                                </span>

                                <span className="font-medium">
                                    {college?.breaks?.length ||
                                        0}
                                </span>
                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">

                        <h3 className="text-lg font-bold">
                            Infrastructure
                        </h3>

                        <div className="mt-5 space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Classrooms
                                </span>

                                <span className="font-medium">
                                    {
                                        rooms.filter(
                                            (room) =>
                                                room.type ===
                                                "classroom"
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Laboratories
                                </span>

                                <span className="font-medium">
                                    {
                                        rooms.filter(
                                            (room) =>
                                                room.type === "lab"
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Other spaces
                                </span>

                                <span className="font-medium">
                                    {
                                        rooms.filter(
                                            (room) =>
                                                ![
                                                    "classroom",
                                                    "lab",
                                                ].includes(
                                                    room.type
                                                )
                                        ).length
                                    }
                                </span>
                            </div>

                        </div>

                    </div>

                </div>

                {/* NEXT PHASE */}

                <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">

                    <p className="text-sm font-semibold text-blue-700">
                        Next module
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-blue-950">
                        Timetable Generation
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm text-blue-800">
                        Once the college configuration is
                        complete, the Academic Coordinator
                        will be able to create a timetable
                        for a specific course, semester and
                        section using these saved resources.
                    </p>

                </div>

            </main>

        </div>
    );
};

export default AdminDashboard;