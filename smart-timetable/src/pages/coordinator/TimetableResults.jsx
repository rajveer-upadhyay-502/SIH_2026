import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import { publishTimetable } from "../../services/timetableService";

const DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const getDayIndex = (day) => {
    const index =
        DAY_ORDER.indexOf(day);

    return index === -1
        ? 999
        : index;
};

const timeToMinutes = (time) => {
    const [hours, minutes] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
    const hours = Math.floor(
        minutes / 60
    );

    const mins = minutes % 60;

    return `${String(hours).padStart(
        2,
        "0"
    )}:${String(mins).padStart(
        2,
        "0"
    )}`;
};

const buildPeriods = (college) => {
    if (!college?.workingHours) {
        return [];
    }

    const start =
        timeToMinutes(
            college.workingHours.start
        );

    const end =
        timeToMinutes(
            college.workingHours.end
        );

    const duration =
        Number(
            college.periodDuration || 50
        );

    const breaks =
        Array.isArray(
            college.breaks
        )
            ? college.breaks
            : [];

    const periods = [];

    let current = start;
    let period = 1;

    while (
        current + duration <=
        end
    ) {
        const periodStart =
            current;

        const periodEnd =
            current + duration;

        const breakItem =
            breaks.find(
                (item) => {
                    const breakStart =
                        timeToMinutes(
                            item.start
                        );

                    const breakEnd =
                        timeToMinutes(
                            item.end
                        );

                    return (
                        periodStart <
                        breakEnd &&
                        periodEnd >
                        breakStart
                    );
                }
            );

        if (breakItem) {
            current =
                timeToMinutes(
                    breakItem.end
                );

            continue;
        }

        periods.push({
            period,
            startTime:
                minutesToTime(
                    periodStart
                ),
            endTime:
                minutesToTime(
                    periodEnd
                ),
        });

        period += 1;
        current += duration;
    }

    return periods;
};

const getClassForCell = ({
    schedule,
    day,
    period,
}) => {
    return schedule.find(
        (item) => {
            if (item.day !== day) {
                return false;
            }

            if (
                Array.isArray(
                    item.occupiedPeriods
                )
            ) {
                return item.occupiedPeriods.includes(
                    period
                );
            }

            return (
                item.period === period
            );
        }
    );
};

const TimetableResults = () => {
    const location =
        useLocation();

    const navigate =
        useNavigate();

    const { user } = useAuth();

    const [publishingId, setPublishingId] =
        useState(null);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const data = useMemo(() => {
        if (
            location.state?.college &&
            location.state?.course &&
            location.state?.results
        ) {
            return location.state;
        }

        try {
            const stored =
                sessionStorage.getItem(
                    "generatedTimetable"
                );

            if (!stored) {
                return null;
            }

            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, [location.state]);

    if (
        !data ||
        !data.college ||
        !data.course ||
        !Array.isArray(
            data.results
        )
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="rounded-2xl bg-white p-8 text-center shadow">
                    <h1 className="text-2xl font-bold">
                        No timetable data found
                    </h1>

                    <button
                        onClick={() =>
                            navigate(
                                "/coordinator/create-timetable"
                            )
                        }
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
                    >
                        Create Timetable
                    </button>
                </div>
            </div>
        );
    }

    const {
        college,
        course,
        results,
    } = data;

    const days = [
        ...(college.workingDays || []),
    ].sort(
        (a, b) =>
            getDayIndex(a) -
            getDayIndex(b)
    );

    const periods =
        buildPeriods(college);

    const handlePublish = async (
        result,
        index
    ) => {
        try {
            setPublishingId(result.id);
            setMessage("");
            setError("");

            const published =
                await publishTimetable({
                    college,
                    course,
                    result,
                    selectedBy:
                        user?.uid || "",
                });

            console.log(
                "Published timetable:",
                published
            );

            setMessage(
                `Option ${index + 1} has been published successfully. Faculty dashboards will now use this timetable.`
            );
        } catch (err) {
            console.error(
                "Publish error:",
                err
            );

            setError(
                err?.message ||
                "Failed to publish timetable."
            );
        } finally {
            setPublishingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">

            <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-5">

                    <div>
                        <p className="text-sm font-semibold text-blue-600">
                            {college.collegeName}
                        </p>

                        <h1 className="mt-1 text-2xl font-bold">
                            Generated Timetables
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            {course.program}
                            {" • "}
                            Semester {course.semester}
                            {" • "}
                            Section {course.section}
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            navigate(
                                "/coordinator/create-timetable"
                            )
                        }
                        className="rounded-lg border px-5 py-2.5 text-sm font-semibold"
                    >
                        Back to Generator
                    </button>

                </div>
            </header>

            <main className="mx-auto max-w-[1800px] px-6 py-8">

                {message && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {results.map(
                    (result, optionIndex) => (
                        <section
                            key={
                                result.id ||
                                optionIndex
                            }
                            className="mb-10 rounded-2xl bg-white p-6 shadow-sm"
                        >

                            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                <div>
                                    <div className="flex items-center gap-3">

                                        <h2 className="text-2xl font-bold">
                                            Option{" "}
                                            {optionIndex + 1}
                                        </h2>

                                        <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700">
                                            Score:{" "}
                                            {result.score}
                                        </span>

                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        {course.program}
                                        {" | "}
                                        Semester{" "}
                                        {course.semester}
                                        {" | "}
                                        Section{" "}
                                        {course.section}
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        handlePublish(
                                            result,
                                            optionIndex
                                        )
                                    }
                                    disabled={
                                        publishingId ===
                                        result.id
                                    }
                                    className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {publishingId ===
                                        result.id
                                        ? "Publishing..."
                                        : "Select & Publish"}
                                </button>

                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-300">

                                <table className="w-full min-w-[1250px] border-collapse">

                                    <thead>
                                        <tr>

                                            <th className="sticky left-0 z-20 w-[150px] border border-slate-300 bg-slate-900 px-4 py-4 text-left text-white">
                                                Day / Time
                                            </th>

                                            {periods.map(
                                                (period) => (
                                                    <th
                                                        key={
                                                            period.period
                                                        }
                                                        className="min-w-[175px] border border-slate-300 bg-slate-900 px-3 py-4 text-center text-white"
                                                    >
                                                        <div className="font-bold">
                                                            Period{" "}
                                                            {
                                                                period.period
                                                            }
                                                        </div>

                                                        <div className="mt-1 text-xs text-slate-300">
                                                            {
                                                                period.startTime
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                period.endTime
                                                            }
                                                        </div>
                                                    </th>
                                                )
                                            )}

                                        </tr>
                                    </thead>

                                    <tbody>

                                        {days.map(
                                            (day) => (
                                                <tr key={day}>

                                                    <td className="sticky left-0 z-10 border border-slate-300 bg-slate-100 px-4 py-5 font-bold">
                                                        {day}
                                                    </td>

                                                    {periods.map(
                                                        (period) => {

                                                            const item =
                                                                getClassForCell(
                                                                    {
                                                                        schedule:
                                                                            result.schedule,
                                                                        day,
                                                                        period:
                                                                            period.period,
                                                                    }
                                                                );

                                                            if (!item) {
                                                                return (
                                                                    <td
                                                                        key={`${day}-${period.period}`}
                                                                        className="h-[125px] border border-slate-300 bg-white"
                                                                    >
                                                                        <div className="flex h-full items-center justify-center text-xs text-slate-300">
                                                                            Free
                                                                        </div>
                                                                    </td>
                                                                );
                                                            }

                                                            const isStart =
                                                                item.period ===
                                                                period.period;

                                                            if (
                                                                !isStart
                                                            ) {
                                                                return (
                                                                    <td
                                                                        key={`${day}-${period.period}`}
                                                                        className="h-[125px] border border-slate-300 bg-blue-50"
                                                                    >
                                                                        <div className="flex h-full items-center justify-center text-xs text-blue-400">
                                                                            ↳ Continuing
                                                                        </div>
                                                                    </td>
                                                                );
                                                            }

                                                            return (
                                                                <td
                                                                    key={`${day}-${period.period}`}
                                                                    className="h-[125px] border border-slate-300 bg-blue-50 p-2"
                                                                >
                                                                    <div className="flex h-full flex-col justify-center rounded-xl border border-blue-200 bg-white p-3 shadow-sm">

                                                                        <div className="font-bold">
                                                                            {
                                                                                item.subjectName
                                                                            }
                                                                        </div>

                                                                        {item.subjectCode && (
                                                                            <div className="mt-1 text-xs font-semibold text-blue-600">
                                                                                {
                                                                                    item.subjectCode
                                                                                }
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-2 text-xs text-slate-600">
                                                                            {
                                                                                item.facultyName
                                                                            }
                                                                        </div>

                                                                        <div className="mt-1 text-xs text-slate-500">
                                                                            Room:{" "}
                                                                            {
                                                                                item.roomName
                                                                            }
                                                                        </div>

                                                                    </div>
                                                                </td>
                                                            );
                                                        }
                                                    )}

                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>
                            </div>

                        </section>
                    )
                )}

            </main>

        </div>
    );
};

export default TimetableResults;