import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getCollegeConfig,
    saveCollegeConfig,
    getRooms,
    addRoom,
    deleteRoom,
    getFaculty,
    addFaculty,
    deleteFaculty,
} from "../../services/collegeConfigService";

const DEFAULT_CONFIG = {
    collegeName: "",
    collegeCode: "",
    universityName: "",
    academicYear: "2026-27",

    workingDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
    ],

    workingHours: {
        start: "09:00",
        end: "17:00",
    },

    periodDuration: 50,

    breaks: [
        {
            name: "Lunch",
            start: "13:00",
            end: "14:00",
        },
    ],
};

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const emptyRoom = {
    name: "",
    building: "",
    type: "classroom",
    capacity: 60,
};

const emptyFaculty = {
    name: "",
    email: "",
    employeeId: "",
    department: "",
    maxHoursPerDay: 6,
    maxHoursPerWeek: 18,
    maxClassesPerDay: 4,
    availability: {},
};

const CollegeSetup = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    const [config, setConfig] = useState(
        DEFAULT_CONFIG
    );

    const [rooms, setRooms] = useState([]);
    const [faculty, setFaculty] = useState([]);

    const [roomForm, setRoomForm] =
        useState(emptyRoom);

    const [facultyForm, setFacultyForm] =
        useState(emptyFaculty);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    /* =====================================================
       LOAD EXISTING DATA
    ===================================================== */

    useEffect(() => {
        const loadData = async () => {
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

                if (collegeData) {
                    setConfig({
                        ...DEFAULT_CONFIG,
                        ...collegeData,
                    });
                }

                setRooms(roomsData);
                setFaculty(facultyData);
            } catch (err) {
                console.error(err);
                setError(
                    "Failed to load college configuration."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    /* =====================================================
       CONFIG CHANGE
    ===================================================== */

    const updateConfig = (field, value) => {
        setConfig((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const toggleDay = (day) => {
        setConfig((previous) => {
            const exists =
                previous.workingDays.includes(day);

            return {
                ...previous,
                workingDays: exists
                    ? previous.workingDays.filter(
                        (item) => item !== day
                    )
                    : [
                        ...previous.workingDays,
                        day,
                    ],
            };
        });
    };

    /* =====================================================
       BREAKS
    ===================================================== */

    const updateBreak = (
        index,
        field,
        value
    ) => {
        setConfig((previous) => {
            const breaks = [
                ...previous.breaks,
            ];

            breaks[index] = {
                ...breaks[index],
                [field]: value,
            };

            return {
                ...previous,
                breaks,
            };
        });
    };

    const addBreak = () => {
        setConfig((previous) => ({
            ...previous,
            breaks: [
                ...previous.breaks,
                {
                    name: "Break",
                    start: "13:00",
                    end: "14:00",
                },
            ],
        }));
    };

    const removeBreak = (index) => {
        setConfig((previous) => ({
            ...previous,
            breaks: previous.breaks.filter(
                (_, i) => i !== index
            ),
        }));
    };

    /* =====================================================
       ROOM
    ===================================================== */

    const handleAddRoom = async () => {
        setError("");

        if (
            !roomForm.name ||
            !roomForm.capacity
        ) {
            setError(
                "Room name and capacity are required."
            );
            return;
        }

        try {
            const newRoom = await addRoom({
                name: roomForm.name,
                building: roomForm.building,
                type: roomForm.type,
                capacity: Number(
                    roomForm.capacity
                ),
                active: true,
            });

            setRooms((previous) => [
                ...previous,
                newRoom,
            ]);

            setRoomForm(emptyRoom);
            setMessage("Room added successfully.");
        } catch (err) {
            console.error(err);
            setError(
                "Failed to add room."
            );
        }
    };

    const handleDeleteRoom = async (id) => {
        try {
            await deleteRoom(id);

            setRooms((previous) =>
                previous.filter(
                    (room) => room.id !== id
                )
            );
        } catch (err) {
            console.error(err);
            setError(
                "Failed to delete room."
            );
        }
    };

    /* =====================================================
       FACULTY
    ===================================================== */

    const toggleFacultyDay = (day) => {
        setFacultyForm((previous) => ({
            ...previous,
            availability: {
                ...previous.availability,
                [day]:
                    !previous.availability[day],
            },
        }));
    };

    const handleAddFaculty = async () => {
        setError("");

        if (
            !facultyForm.name ||
            !facultyForm.employeeId
        ) {
            setError(
                "Faculty name and employee ID are required."
            );
            return;
        }

        try {
                const newFaculty =
                    await addFaculty({
                        name: facultyForm.name,
                        email: facultyForm.email.toLowerCase(),
                        employeeId:
                            facultyForm.employeeId,
                        department:
                            facultyForm.department,

                        maxHoursPerDay:
                            Number(
                                facultyForm.maxHoursPerDay
                            ),

                        maxHoursPerWeek:
                            Number(
                                facultyForm.maxHoursPerWeek
                            ),

                        maxClassesPerDay:
                            Number(
                                facultyForm.maxClassesPerDay
                            ),

                        availability:
                            facultyForm.availability,

                        active: true,
                    });

            setFaculty((previous) => [
                ...previous,
                newFaculty,
            ]);

            setFacultyForm({
                ...emptyFaculty,
                availability: {},
            });

            setMessage(
                "Faculty added successfully."
            );
        } catch (err) {
            console.error(err);
            setError(
                "Failed to add faculty."
            );
        }
    };

    const handleDeleteFaculty = async (
        id
    ) => {
        try {
            await deleteFaculty(id);

            setFaculty((previous) =>
                previous.filter(
                    (item) => item.id !== id
                )
            );
        } catch (err) {
            console.error(err);
            setError(
                "Failed to delete faculty."
            );
        }
    };

    /* =====================================================
       SAVE CONFIG
    ===================================================== */

    const handleSaveConfiguration =
        async () => {
            setError("");
            setMessage("");

            if (!config.collegeName.trim()) {
                setError(
                    "College name is required."
                );
                setStep(1);
                return;
            }

            if (
                config.workingDays.length === 0
            ) {
                setError(
                    "Select at least one working day."
                );
                setStep(2);
                return;
            }

            try {
                setSaving(true);

                await saveCollegeConfig(
                    config
                );

                setMessage(
                    "College configuration saved successfully."
                );
            } catch (err) {
                console.error(err);

                setError(
                    "Failed to save configuration."
                );
            } finally {
                setSaving(false);
            }
        };

    /* =====================================================
       STEP NAVIGATION
    ===================================================== */

    const nextStep = () => {
        setError("");

        if (
            step === 1 &&
            !config.collegeName.trim()
        ) {
            setError(
                "Enter the college name first."
            );
            return;
        }

        if (
            step === 2 &&
            config.workingDays.length === 0
        ) {
            setError(
                "Select at least one working day."
            );
            return;
        }

        setStep((previous) =>
            Math.min(previous + 1, 4)
        );
    };

    const previousStep = () => {
        setError("");

        setStep((previous) =>
            Math.max(previous - 1, 1)
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <p className="font-semibold">
                    Loading college configuration...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">

            {/* HEADER */}
            <header className="border-b bg-white px-8 py-5">

                <div className="mx-auto max-w-6xl flex items-center justify-between">

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            College Setup
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Configure the resources and rules
                            used by the timetable engine.
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            navigate("/admin")
                        }
                        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                        Back to Dashboard
                    </button>

                </div>

            </header>

            <main className="mx-auto max-w-6xl px-6 py-8">

                {/* PROGRESS */}

                <div className="mb-8 grid grid-cols-4 gap-3">

                    {[
                        "College",
                        "Schedule",
                        "Rooms",
                        "Faculty",
                    ].map((label, index) => {
                        const number = index + 1;

                        return (
                            <button
                                key={label}
                                onClick={() =>
                                    setStep(number)
                                }
                                className={`rounded-xl p-4 text-left transition ${step === number
                                        ? "bg-blue-600 text-white"
                                        : step > number
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-white text-slate-500"
                                    }`}
                            >
                                <div className="text-xs font-semibold uppercase">
                                    Step {number}
                                </div>

                                <div className="mt-1 font-semibold">
                                    {label}
                                </div>
                            </button>
                        );
                    })}

                </div>

                {/* ALERTS */}

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {message}
                    </div>
                )}

                {/* =================================================
            STEP 1
        ================================================= */}

                {step === 1 && (
                    <section className="rounded-2xl bg-white p-8 shadow-sm">

                        <h2 className="text-xl font-bold">
                            College Information
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Basic information displayed
                            throughout the system.
                        </p>

                        <div className="mt-8 grid gap-5 md:grid-cols-2">

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    College Name
                                </label>

                                <input
                                    value={
                                        config.collegeName
                                    }
                                    onChange={(e) =>
                                        updateConfig(
                                            "collegeName",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                                    placeholder="Example: Amity University Patna"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    College Code
                                </label>

                                <input
                                    value={
                                        config.collegeCode
                                    }
                                    onChange={(e) =>
                                        updateConfig(
                                            "collegeCode",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                                    placeholder="Example: AUP"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    University Name
                                </label>

                                <input
                                    value={
                                        config.universityName
                                    }
                                    onChange={(e) =>
                                        updateConfig(
                                            "universityName",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                                    placeholder="University name"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Academic Year
                                </label>

                                <input
                                    value={
                                        config.academicYear
                                    }
                                    onChange={(e) =>
                                        updateConfig(
                                            "academicYear",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                                    placeholder="2026-27"
                                />
                            </div>

                        </div>

                    </section>
                )}

                {/* =================================================
            STEP 2
        ================================================= */}

                {step === 2 && (
                    <section className="rounded-2xl bg-white p-8 shadow-sm">

                        <h2 className="text-xl font-bold">
                            Working Days & Timing
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            These settings define the scheduling
                            grid used by the engine.
                        </p>

                        <div className="mt-8">

                            <label className="mb-3 block text-sm font-medium">
                                Working Days
                            </label>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">

                                {DAYS.map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() =>
                                            toggleDay(day)
                                        }
                                        className={`rounded-xl border p-4 text-left ${config.workingDays.includes(
                                            day
                                        )
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-500"
                                            }`}
                                    >
                                        <div className="font-semibold">
                                            {day}
                                        </div>

                                        <div className="mt-1 text-xs">
                                            {config.workingDays.includes(
                                                day
                                            )
                                                ? "Working"
                                                : "Off"}
                                        </div>
                                    </button>
                                ))}

                            </div>

                        </div>

                        <div className="mt-8 grid gap-5 md:grid-cols-3">

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    College Start Time
                                </label>

                                <input
                                    type="time"
                                    value={
                                        config.workingHours.start
                                    }
                                    onChange={(e) =>
                                        setConfig((previous) => ({
                                            ...previous,
                                            workingHours: {
                                                ...previous.workingHours,
                                                start:
                                                    e.target.value,
                                            },
                                        }))
                                    }
                                    className="w-full rounded-lg border px-4 py-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    College End Time
                                </label>

                                <input
                                    type="time"
                                    value={
                                        config.workingHours.end
                                    }
                                    onChange={(e) =>
                                        setConfig((previous) => ({
                                            ...previous,
                                            workingHours: {
                                                ...previous.workingHours,
                                                end:
                                                    e.target.value,
                                            },
                                        }))
                                    }
                                    className="w-full rounded-lg border px-4 py-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Period Duration (minutes)
                                </label>

                                <input
                                    type="number"
                                    min="20"
                                    max="180"
                                    value={
                                        config.periodDuration
                                    }
                                    onChange={(e) =>
                                        updateConfig(
                                            "periodDuration",
                                            Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-lg border px-4 py-3"
                                />
                            </div>

                        </div>

                        {/* BREAKS */}

                        <div className="mt-10">

                            <div className="flex items-center justify-between">

                                <div>
                                    <h3 className="font-semibold">
                                        Breaks
                                    </h3>

                                    <p className="text-sm text-slate-500">
                                        These periods will not be
                                        assigned classes.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={addBreak}
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    + Add Break
                                </button>

                            </div>

                            <div className="mt-5 space-y-3">

                                {config.breaks.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-4"
                                        >

                                            <input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateBreak(
                                                        index,
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                className="rounded-lg border bg-white px-3 py-2"
                                                placeholder="Lunch"
                                            />

                                            <input
                                                type="time"
                                                value={item.start}
                                                onChange={(e) =>
                                                    updateBreak(
                                                        index,
                                                        "start",
                                                        e.target.value
                                                    )
                                                }
                                                className="rounded-lg border bg-white px-3 py-2"
                                            />

                                            <input
                                                type="time"
                                                value={item.end}
                                                onChange={(e) =>
                                                    updateBreak(
                                                        index,
                                                        "end",
                                                        e.target.value
                                                    )
                                                }
                                                className="rounded-lg border bg-white px-3 py-2"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeBreak(index)
                                                }
                                                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                                            >
                                                Remove
                                            </button>

                                        </div>
                                    )
                                )}

                            </div>

                        </div>

                    </section>
                )}

                {/* =================================================
            STEP 3
        ================================================= */}

                {step === 3 && (
                    <section className="rounded-2xl bg-white p-8 shadow-sm">

                        <h2 className="text-xl font-bold">
                            Classrooms & Laboratories
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Add reusable physical resources.
                            Capacity and room type become
                            timetable constraints.
                        </p>

                        <div className="mt-8 grid gap-3 md:grid-cols-5">

                            <input
                                value={roomForm.name}
                                onChange={(e) =>
                                    setRoomForm({
                                        ...roomForm,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Room name"
                                className="rounded-lg border px-3 py-3"
                            />

                            <input
                                value={roomForm.building}
                                onChange={(e) =>
                                    setRoomForm({
                                        ...roomForm,
                                        building:
                                            e.target.value,
                                    })
                                }
                                placeholder="Building"
                                className="rounded-lg border px-3 py-3"
                            />

                            <select
                                value={roomForm.type}
                                onChange={(e) =>
                                    setRoomForm({
                                        ...roomForm,
                                        type: e.target.value,
                                    })
                                }
                                className="rounded-lg border px-3 py-3"
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

                                <option value="auditorium">
                                    Auditorium
                                </option>
                            </select>

                            <input
                                type="number"
                                min="1"
                                value={roomForm.capacity}
                                onChange={(e) =>
                                    setRoomForm({
                                        ...roomForm,
                                        capacity:
                                            e.target.value,
                                    })
                                }
                                placeholder="Capacity"
                                className="rounded-lg border px-3 py-3"
                            />

                            <button
                                type="button"
                                onClick={handleAddRoom}
                                className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                            >
                                Add Room
                            </button>

                        </div>

                        <div className="mt-8 overflow-hidden rounded-xl border">

                            <table className="w-full text-left text-sm">

                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Name
                                        </th>
                                        <th className="px-4 py-3">
                                            Building
                                        </th>
                                        <th className="px-4 py-3">
                                            Type
                                        </th>
                                        <th className="px-4 py-3">
                                            Capacity
                                        </th>
                                        <th className="px-4 py-3">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {rooms.map((room) => (
                                        <tr
                                            key={room.id}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {room.name}
                                            </td>

                                            <td className="px-4 py-3">
                                                {room.building || "-"}
                                            </td>

                                            <td className="px-4 py-3 capitalize">
                                                {room.type}
                                            </td>

                                            <td className="px-4 py-3">
                                                {room.capacity}
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() =>
                                                        handleDeleteRoom(
                                                            room.id
                                                        )
                                                    }
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>

                                        </tr>
                                    ))}

                                    {rooms.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-4 py-8 text-center text-slate-400"
                                            >
                                                No rooms added yet.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </section>
                )}

                {/* =================================================
            STEP 4
        ================================================= */}

                {step === 4 && (
                    <section className="rounded-2xl bg-white p-8 shadow-sm">

                        <h2 className="text-xl font-bold">
                            Faculty Configuration
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Define workload limits and broad
                            availability. The timetable engine
                            will use these as constraints.
                        </p>

                        <div className="mt-8 grid gap-4 md:grid-cols-3">

                            <input
                                value={facultyForm.name}
                                onChange={(e) =>
                                    setFacultyForm({
                                        ...facultyForm,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Faculty name"
                                className="rounded-lg border px-3 py-3"
                            />

                            <input
                                value={facultyForm.email}
                                onChange={(e) =>
                                    setFacultyForm({
                                        ...facultyForm,
                                        email: e.target.value,
                                    })
                                }
                                placeholder="Faculty Email"
                                type="email"
                                className="rounded-lg border px-3 py-3"
                            />

                            <input
                                value={
                                    facultyForm.employeeId
                                }
                                onChange={(e) =>
                                    setFacultyForm({
                                        ...facultyForm,
                                        employeeId:
                                            e.target.value,
                                    })
                                }
                                placeholder="Employee ID"
                                className="rounded-lg border px-3 py-3"
                            />

                            <input
                                value={
                                    facultyForm.department
                                }
                                onChange={(e) =>
                                    setFacultyForm({
                                        ...facultyForm,
                                        department:
                                            e.target.value,
                                    })
                                }
                                placeholder="Department"
                                className="rounded-lg border px-3 py-3"
                            />

                            <input
                                type="number"
                                min="1"
                                value={
                                    facultyForm.maxHoursPerDay
                                }
                                onChange={(e) =>
                                    setFacultyForm({
                                        ...facultyForm,
                                        maxHoursPerDay:
                                            e.target.value,
                                    })
                                }
                                placeholder="Max hours/day"
                                className="rounded-lg border px-3 py-3"
                            />

                            <input
                                type="number"
                                min="1"
                                value={
                                    facultyForm.maxHoursPerWeek
                                }
                                onChange={(e) =>
                                    setFacultyForm({
                                        ...facultyForm,
                                        maxHoursPerWeek:
                                            e.target.value,
                                    })
                                }
                                placeholder="Max hours/week"
                                className="rounded-lg border px-3 py-3"
                            />

                            <input
                                type="number"
                                min="1"
                                value={
                                    facultyForm.maxClassesPerDay
                                }
                                onChange={(e) =>
                                    setFacultyForm({
                                        ...facultyForm,
                                        maxClassesPerDay:
                                            e.target.value,
                                    })
                                }
                                placeholder="Max classes/day"
                                className="rounded-lg border px-3 py-3"
                            />

                        </div>

                        <div className="mt-6 rounded-xl border bg-slate-50 p-5">

                            <h3 className="font-semibold">
                                Available Days
                            </h3>

                            <div className="mt-4 flex flex-wrap gap-2">

                                {DAYS.map((day) => {

                                    const selected =
                                        facultyForm
                                            .availability?.[
                                        day
                                        ];

                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() =>
                                                toggleFacultyDay(
                                                    day
                                                )
                                            }
                                            className={`rounded-lg px-4 py-2 text-sm font-medium ${selected
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white text-slate-500 border"
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}

                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleAddFaculty}
                            className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            Add Faculty
                        </button>

                        <div className="mt-8 overflow-hidden rounded-xl border">

                            <table className="w-full text-left text-sm">

                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Name
                                        </th>

                                        <th className="px-4 py-3">
                                            Email
                                        </th>

                                        <th className="px-4 py-3">
                                            ID
                                        </th>

                                        <th className="px-4 py-3">
                                            Department
                                        </th>

                                        <th className="px-4 py-3">
                                            Max/Week
                                        </th>

                                        <th className="px-4 py-3">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {faculty.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {item.name}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.email}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.employeeId}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.department}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.maxHoursPerWeek}
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() =>
                                                        handleDeleteFaculty(
                                                            item.id
                                                        )
                                                    }
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {faculty.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-4 py-8 text-center text-slate-400"
                                            >
                                                No faculty added yet.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </section>
                )}

                {/* FOOTER ACTIONS */}

                <div className="mt-8 flex items-center justify-between">

                    <button
                        onClick={previousStep}
                        disabled={step === 1}
                        className="rounded-lg border bg-white px-5 py-3 font-medium disabled:opacity-40"
                    >
                        Previous
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSaveConfiguration}
                            disabled={saving}
                            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : "Save College Configuration"}
                        </button>
                    )}

                </div>

            </main>

        </div>
    );
};

export default CollegeSetup;