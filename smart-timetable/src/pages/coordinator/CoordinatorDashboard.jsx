import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";

import {
    getCollegeConfig,
    getRooms,
    getFaculty,
} from "../../services/collegeConfigService";

const CoordinatorDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [college, setCollege] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [faculty, setFaculty] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                console.error("Coordinator dashboard error:", err);
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

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Academic Coordinator
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            {profile?.name || "Coordinator"}
                        </p>
                    </div>

                    <button
                        onClick={logoutUser}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-8 py-8">
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <p className="font-semibold">
                            Failed to load configuration
                        </p>

                        <p className="mt-1 text-sm">
                            {error}
                        </p>
                    </div>
                )}

                {/* COLLEGE INFORMATION */}

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
                                {college?.academicYear || "-"}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Working Days
                            </p>

                            <p className="mt-1 font-semibold">
                                {college?.workingDays?.length || 0}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Rooms
                            </p>

                            <p className="mt-1 font-semibold">
                                {rooms.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Faculty
                            </p>

                            <p className="mt-1 font-semibold">
                                {faculty.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}

                <div className="mt-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        Timetable Management
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Use the administrator's saved resources
                        to create an optimized timetable.
                    </p>

                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                        <button
                            onClick={() =>
                                navigate("/coordinator/create-timetable")
                            }
                            className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="text-3xl">
                                +
                            </div>

                            <h3 className="mt-4 text-lg font-bold">
                                Create Timetable
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Create a timetable for a specific
                                program, semester and section.
                            </p>
                        </button>

                        <button
                            className="rounded-2xl bg-white p-6 text-left shadow-sm"
                        >
                            <div className="text-3xl">
                                📋
                            </div>

                            <h3 className="mt-4 text-lg font-bold">
                                Draft Timetables
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                View and manage generated drafts.
                            </p>
                        </button>

                        <button
                            className="rounded-2xl bg-white p-6 text-left shadow-sm"
                        >
                            <div className="text-3xl">
                                ✓
                            </div>

                            <h3 className="mt-4 text-lg font-bold">
                                Approval Requests
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Submit or track timetable approvals.
                            </p>
                        </button>
                    </div>
                </div>

                {/* RESOURCE SUMMARY */}

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h3 className="font-bold">
                            Available Rooms
                        </h3>

                        <div className="mt-4 space-y-3">
                            {rooms.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No rooms configured yet.
                                </p>
                            ) : (
                                rooms.slice(0, 6).map((room) => (
                                    <div
                                        key={room.id}
                                        className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {room.name}
                                            </p>

                                            <p className="text-xs capitalize text-slate-500">
                                                {room.type}
                                            </p>
                                        </div>

                                        <span className="text-sm font-semibold">
                                            {room.capacity} seats
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h3 className="font-bold">
                            Faculty Resources
                        </h3>

                        <div className="mt-4 space-y-3">
                            {faculty.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No faculty configured yet.
                                </p>
                            ) : (
                                faculty.slice(0, 6).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {item.name}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {item.department || "-"}
                                            </p>
                                        </div>

                                        <span className="text-sm font-semibold">
                                            {item.maxHoursPerWeek} hrs/week
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorDashboard;