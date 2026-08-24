/*
  SMART TIMETABLE ENGINE - V2

  Handles:
  - Exact weekly session counts
  - Subject distribution across days
  - Faculty availability
  - Faculty max hours/day
  - Faculty max hours/week
  - Faculty max classes/day
  - Faculty conflict
  - Batch conflict
  - Room conflict
  - Room capacity
  - Room type
  - Multi-period classes/labs
  - Breaks
  - Sequential scheduling
  - Student timetable compactness
  - Multiple optimized timetable options
*/

const DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

/* =========================================================
   BASIC HELPERS
========================================================= */

const dayIndex = (day) => {
    const index = DAY_ORDER.indexOf(day);
    return index === -1 ? 999 : index;
};

const timeToMinutes = (time) => {
    if (!time) return 0;

    const [hours, minutes] = time
        .split(":")
        .map(Number);

    return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(
        mins
    ).padStart(2, "0")}`;
};

const isSameTime = (a, b) => {
    return a === b;
};

/* =========================================================
   GENERATE DAILY TEACHING PERIODS
========================================================= */

const generateDailyPeriods = (college) => {
    if (!college?.workingHours) {
        return [];
    }

    const start = timeToMinutes(
        college.workingHours.start
    );

    const end = timeToMinutes(
        college.workingHours.end
    );

    const duration = Number(
        college.periodDuration || 50
    );

    const breaks = Array.isArray(college.breaks)
        ? college.breaks
        : [];

    const periods = [];

    let current = start;
    let period = 1;

    while (current + duration <= end) {
        const periodStart = current;
        const periodEnd = current + duration;

        const overlappingBreak = breaks.find(
            (breakItem) => {
                const breakStart = timeToMinutes(
                    breakItem.start
                );

                const breakEnd = timeToMinutes(
                    breakItem.end
                );

                return (
                    periodStart < breakEnd &&
                    periodEnd > breakStart
                );
            }
        );

        if (overlappingBreak) {
            current = timeToMinutes(
                overlappingBreak.end
            );
            continue;
        }

        periods.push({
            period,
            startTime: minutesToTime(periodStart),
            endTime: minutesToTime(periodEnd),
        });

        period += 1;
        current += duration;
    }

    return periods;
};

/* =========================================================
   GENERATE ALL COLLEGE SLOTS
========================================================= */

const generateSlots = (college) => {
    const dailyPeriods = generateDailyPeriods(
        college
    );

    const workingDays = [
        ...(college?.workingDays || []),
    ].sort(
        (a, b) => dayIndex(a) - dayIndex(b)
    );

    const slots = [];

    workingDays.forEach((day) => {
        dailyPeriods.forEach((period) => {
            slots.push({
                id: `${day}-${period.period}`,

                day,

                period: period.period,

                startTime: period.startTime,

                endTime: period.endTime,
            });
        });
    });

    return slots;
};

/* =========================================================
   SLOT MAP
========================================================= */

const makeSlotKey = (day, period) => {
    return `${day}-${period}`;
};

const createSlotMap = (slots) => {
    const map = new Map();

    slots.forEach((slot) => {
        map.set(
            makeSlotKey(
                slot.day,
                slot.period
            ),
            slot
        );
    });

    return map;
};

/* =========================================================
   MULTI-PERIOD SLOT VALIDATION
========================================================= */

const getConsecutiveSlots = ({
    startSlot,
    duration,
    slotMap,
}) => {
    const result = [];

    for (let offset = 0; offset < duration; offset++) {
        const period =
            startSlot.period + offset;

        const slot = slotMap.get(
            makeSlotKey(
                startSlot.day,
                period
            )
        );

        if (!slot) {
            return null;
        }

        /*
          Actual time continuity check.
          This prevents a 2-period lab from
          jumping over the lunch break.
        */

        if (offset > 0) {
            const previous =
                result[result.length - 1];

            if (
                !isSameTime(
                    previous.endTime,
                    slot.startTime
                )
            ) {
                return null;
            }
        }

        result.push(slot);
    }

    return result;
};

/* =========================================================
   FACULTY AVAILABILITY
========================================================= */

const facultyAvailable = ({
    faculty,
    slot,
}) => {
    /*
      Supported formats:

      1) Day-level availability
      {
        Monday: true,
        Tuesday: false
      }

      2) Period-level availability
      {
        Monday: [1, 2, 3],
        Tuesday: []
      }

      3) Compact available-days form
      {
        availableDays: [
          "Monday",
          "Wednesday",
          "Friday"
        ]
      }

      No availability field means "no additional
      restriction", preserving the existing behaviour.
    */

    if (!faculty) {
        return false;
    }

    const availability =
        faculty.availability;

    if (
        availability === undefined ||
        availability === null
    ) {
        return true;
    }

    if (
        Array.isArray(
            availability.availableDays
        )
    ) {
        return availability.availableDays.includes(
            slot.day
        );
    }

    const dayAvailability =
        availability[slot.day];

    if (
        dayAvailability === undefined ||
        dayAvailability === null
    ) {
        return true;
    }

    if (
        typeof dayAvailability ===
        "boolean"
    ) {
        return dayAvailability;
    }

    if (
        Array.isArray(
            dayAvailability
        )
    ) {
        return dayAvailability.includes(
            slot.period
        );
    }

    return true;
};

/* =========================================================
   FACULTY WORKLOAD
========================================================= */

const facultyEntries = ({
    schedule,
    facultyId,
}) => {
    return schedule.filter(
        (item) =>
            item.facultyId === facultyId
    );
};

const facultyDayEntries = ({
    schedule,
    facultyId,
    day,
}) => {
    return schedule.filter(
        (item) =>
            item.facultyId === facultyId &&
            item.day === day
    );
};

const calculatePeriods = (entries) => {
    return entries.reduce(
        (total, item) => {
            return (
                total +
                Number(item.duration || 1)
            );
        },
        0
    );
};

const calculateFacultyHours = ({
    entries,
    college,
}) => {
    const periods = calculatePeriods(
        entries
    );

    const periodDuration =
        Number(
            college.periodDuration || 50
        );

    return (
        periods *
        (periodDuration / 60)
    );
};

const facultyOverLimit = ({
    faculty,
    schedule,
    day,
    duration,
    college,
}) => {
    const weeklyEntries =
        facultyEntries({
            schedule,
            facultyId: faculty.id,
        });

    const dailyEntries =
        facultyDayEntries({
            schedule,
            facultyId: faculty.id,
            day,
        });

    const currentWeeklyHours =
        calculateFacultyHours({
            entries: weeklyEntries,
            college,
        });

    const currentDailyHours =
        calculateFacultyHours({
            entries: dailyEntries,
            college,
        });

    const weeklyLimit = Number(
        faculty.maxHoursPerWeek
    );

    const dailyLimit = Number(
        faculty.maxHoursPerDay
    );

    const classLimit = Number(
        faculty.maxClassesPerDay
    );

    const durationHours =
        duration *
        (Number(
            college.periodDuration || 50
        ) /
            60);

    if (
        weeklyLimit > 0 &&
        currentWeeklyHours +
        durationHours >
        weeklyLimit
    ) {
        return true;
    }

    if (
        dailyLimit > 0 &&
        currentDailyHours +
        durationHours >
        dailyLimit
    ) {
        return true;
    }

    if (
        classLimit > 0 &&
        dailyEntries.length >=
        classLimit
    ) {
        return true;
    }

    return false;
};

/* =========================================================
   OVERLAP CHECK
========================================================= */

const itemOccupiedPeriods = (item) => {
    if (
        Array.isArray(
            item.occupiedPeriods
        )
    ) {
        return item.occupiedPeriods;
    }

    return [item.period];
};

const overlaps = ({
    existingItem,
    candidateDay,
    candidatePeriods,
}) => {
    if (
        existingItem.day !==
        candidateDay
    ) {
        return false;
    }

    const existingPeriods =
        itemOccupiedPeriods(
            existingItem
        );

    return existingPeriods.some(
        (period) =>
            candidatePeriods.includes(
                period
            )
    );
};

/* =========================================================
   CONFLICT CHECKS
========================================================= */

const hasFacultyConflict = ({
    schedule,
    facultyId,
    candidateDay,
    candidatePeriods,
}) => {
    return schedule.some(
        (item) =>
            item.facultyId === facultyId &&
            overlaps({
                existingItem: item,
                candidateDay,
                candidatePeriods,
            })
    );
};

const hasBatchConflict = ({
    schedule,
    batchId,
    candidateDay,
    candidatePeriods,
}) => {
    return schedule.some(
        (item) =>
            item.batchId === batchId &&
            overlaps({
                existingItem: item,
                candidateDay,
                candidatePeriods,
            })
    );
};

const hasRoomConflict = ({
    schedule,
    roomId,
    candidateDay,
    candidatePeriods,
}) => {
    return schedule.some(
        (item) =>
            item.roomId === roomId &&
            overlaps({
                existingItem: item,
                candidateDay,
                candidatePeriods,
            })
    );
};

/* =========================================================
   ROOM VALIDATION
========================================================= */

const roomSuitable = ({
    room,
    subject,
    studentCount,
}) => {
    if (!room) return false;

    if (room.active === false) {
        return false;
    }

    if (
        Number(room.capacity) <
        Number(studentCount)
    ) {
        return false;
    }

    if (
        subject.roomType &&
        room.type !==
        subject.roomType
    ) {
        return false;
    }

    return true;
};

/* =========================================================
   SUBJECT DAILY OCCURRENCES
========================================================= */

const subjectDayEntries = ({
    schedule,
    subjectId,
    day,
}) => {
    return schedule.filter(
        (item) =>
            item.subjectId === subjectId &&
            item.day === day
    );
};

const subjectDaysUsed = ({
    schedule,
    subjectId,
}) => {
    return new Set(
        schedule
            .filter(
                (item) =>
                    item.subjectId ===
                    subjectId
            )
            .map(
                (item) => item.day
            )
    );
};

/* =========================================================
   DAILY BATCH LOAD
========================================================= */

const batchDayEntries = ({
    schedule,
    batchId,
    day,
}) => {
    return schedule.filter(
        (item) =>
            item.batchId === batchId &&
            item.day === day
    );
};

/* =========================================================
   COMPACTNESS SCORE
========================================================= */

const calculateSlotScore = ({
    schedule,
    batchId,
    subjectId,
    slot,
    workingDayCount,
    totalSubjectSessions,
}) => {
    let score = 0;

    const dayEntries =
        batchDayEntries({
            schedule,
            batchId,
            day: slot.day,
        });

    const usedSubjectDays =
        subjectDaysUsed({
            schedule,
            subjectId,
        });

    const subjectAlreadyOnDay =
        usedSubjectDays.has(
            slot.day
        );

    const subjectOccurrenceToday =
        subjectDayEntries({
            schedule,
            subjectId,
            day: slot.day,
        }).length;

    /*
      -------------------------------------------------------
      SUBJECT DISTRIBUTION
      -------------------------------------------------------
    */

    if (
        !subjectAlreadyOnDay &&
        usedSubjectDays.size <
        workingDayCount
    ) {
        score += 80;
    }

    if (subjectAlreadyOnDay) {
        /*
          Strong penalty for repeating the same
          subject on the same day.
        */

        score -= 90;

        /*
          Even stronger penalty if this would
          make consecutive occurrences.
        */

        if (
            subjectOccurrenceToday > 0
        ) {
            score -= 50;
        }
    }

    /*
      -------------------------------------------------------
      DAILY COMPACTNESS
      -------------------------------------------------------
    */

    if (
        dayEntries.length === 0
    ) {
        /*
          Prefer using the day if the subject
          still needs distribution.
        */

        score += 10;
    } else {
        const occupiedPeriods =
            dayEntries
                .flatMap(
                    (item) =>
                        itemOccupiedPeriods(
                            item
                        )
                )
                .sort(
                    (a, b) => a - b
                );

        const first =
            occupiedPeriods[0];

        const last =
            occupiedPeriods[
            occupiedPeriods.length -
            1
            ];

        /*
          Put new classes immediately after
          or before existing ones.
        */

        if (
            slot.period ===
            last + 1
        ) {
            score += 70;
        }

        if (
            slot.period ===
            first - 1
        ) {
            score += 45;
        }

        /*
          Penalize gaps.
        */

        if (
            slot.period >
            last + 1
        ) {
            score -=
                (slot.period -
                    last -
                    1) *
                35;
        }
    }

    /*
      -------------------------------------------------------
      AVOID LATE RANDOM PLACEMENT
      -------------------------------------------------------
    */

    score -=
        slot.period * 2;

    /*
      -------------------------------------------------------
      Encourage subject spacing when possible
      -------------------------------------------------------
    */

    if (
        totalSubjectSessions <=
        workingDayCount &&
        subjectAlreadyOnDay
    ) {
        score -= 120;
    }

    return score;
};

/* =========================================================
   EXPAND SUBJECTS INTO WEEKLY SESSIONS
========================================================= */

const expandSessions = (
    subjects
) => {
    const sessions = [];

    subjects.forEach(
        (subject) => {
            const count = Math.max(
                1,
                Number(
                    subject.classesPerWeek ||
                    1
                )
            );

            for (
                let index = 0;
                index < count;
                index++
            ) {
                sessions.push({
                    ...subject,
                    sessionNumber:
                        index + 1,

                    totalSubjectSessions:
                        count,
                });
            }
        }
    );

    return sessions;
};

/* =========================================================
   SESSION ORDER
========================================================= */

const sortSessions = (
    sessions
) => {
    return [...sessions].sort(
        (a, b) => {
            /*
              Long classes/labs first.
            */

            const durationDifference =
                Number(
                    b.duration || 1
                ) -
                Number(
                    a.duration || 1
                );

            if (
                durationDifference !== 0
            ) {
                return durationDifference;
            }

            /*
              Subjects with more weekly
              sessions first.
            */

            const weeklyDifference =
                Number(
                    b.totalSubjectSessions
                ) -
                Number(
                    a.totalSubjectSessions
                );

            if (
                weeklyDifference !== 0
            ) {
                return weeklyDifference;
            }

            /*
              Labs first.
            */

            if (
                a.type === "lab" &&
                b.type !== "lab"
            ) {
                return -1;
            }

            if (
                b.type === "lab" &&
                a.type !== "lab"
            ) {
                return 1;
            }

            return 0;
        }
    );
};

/* =========================================================
   CANDIDATE BUILDER
========================================================= */

const buildCandidates = ({
    session,
    faculty,
    rooms,
    slots,
    slotMap,
    schedule,
    existingSchedules,
    college,
    studentCount,
    batchId,
}) => {
    const globalSchedule = [...schedule, ...(existingSchedules || [])];
    const facultyMember =
        faculty.find(
            (member) =>
                member.id ===
                session.facultyId
        );

    if (!facultyMember) {
        return [];
    }

    const duration = Math.max(
        1,
        Number(
            session.duration || 1
        )
    );

    const workingDays =
        college.workingDays
            ?.length || 1;

    const candidates = [];

    slots.forEach(
        (startSlot) => {
            const candidateSlots =
                getConsecutiveSlots({
                    startSlot,
                    duration,
                    slotMap,
                });

            if (!candidateSlots) {
                return;
            }

            /*
              Faculty availability across EVERY
              period of the class.
            */

            const facultyAvailableForAll =
                candidateSlots.every(
                    (slot) =>
                        facultyAvailable({
                            faculty:
                                facultyMember,
                            slot,
                        })
                );

            if (
                !facultyAvailableForAll
            ) {
                return;
            }

            /*
              Faculty workload.
            */

            if (
                facultyOverLimit({
                    faculty:
                        facultyMember,
                    schedule: globalSchedule,
                    day:
                        startSlot.day,
                    duration,
                    college,
                })
            ) {
                return;
            }

            const periods =
                candidateSlots.map(
                    (slot) => slot.period
                );

            /*
              Faculty conflict.
            */

            if (
                hasFacultyConflict({
                    schedule: globalSchedule,
                    facultyId:
                        facultyMember.id,
                    candidateDay:
                        startSlot.day,
                    candidatePeriods:
                        periods,
                })
            ) {
                return;
            }

            /*
              Batch conflict.
            */

            if (
                hasBatchConflict({
                    schedule: globalSchedule,
                    batchId,
                    candidateDay:
                        startSlot.day,
                    candidatePeriods:
                        periods,
                })
            ) {
                return;
            }

            /*
              Suitable rooms.
            */

            const suitableRooms =
                rooms
                    .filter(
                        (room) =>
                            roomSuitable({
                                room,
                                subject:
                                    session,
                                studentCount,
                            })
                    )
                    .filter(
                        (room) =>
                            !hasRoomConflict({
                                schedule: globalSchedule,
                                roomId:
                                    room.id,
                                candidateDay:
                                    startSlot.day,
                                candidatePeriods:
                                    periods,
                            })
                    )
                    /*
                      Smallest suitable room first.
                    */
                    .sort(
                        (a, b) =>
                            Number(
                                a.capacity
                            ) -
                            Number(
                                b.capacity
                            )
                    );

            suitableRooms.forEach(
                (room) => {
                    const score =
                        calculateSlotScore({
                            schedule,
                            batchId,
                            subjectId:
                                session.id,
                            slot: startSlot,
                            workingDayCount:
                                workingDays,
                            totalSubjectSessions:
                                session.totalSubjectSessions,
                        });

                    candidates.push({
                        session,
                        facultyMember,
                        room,
                        startSlot,
                        candidateSlots,
                        score,
                    });
                }
            );
        }
    );

    /*
      Sort strongest candidate first.
  
      Random tie-break gives different
      timetable options without destroying
      the structure.
    */

    candidates.sort(
        (a, b) => {
            if (
                b.score !==
                a.score
            ) {
                return (
                    b.score -
                    a.score
                );
            }

            return (
                Math.random() - 0.5
            );
        }
    );

    return candidates;
};

/* =========================================================
   CREATE SCHEDULE ENTRY
========================================================= */

const makeScheduleEntry = ({
    candidate,
    batchId,
}) => {
    const {
        session,
        facultyMember,
        room,
        candidateSlots,
        startSlot,
    } = candidate;

    return {
        subjectId:
            session.id,

        subjectName:
            session.name,

        subjectCode:
            session.code || "",

        facultyId:
            facultyMember.id,

        facultyName:
            facultyMember.name,

        roomId:
            room.id,

        roomName:
            room.name,

        roomType:
            room.type,

        batchId,

        day:
            startSlot.day,

        period:
            startSlot.period,

        startTime:
            candidateSlots[0]
                .startTime,

        endTime:
            candidateSlots[
                candidateSlots.length -
                1
            ].endTime,

        duration:
            Number(
                session.duration || 1
            ),

        type:
            session.type,

        sessionNumber:
            session.sessionNumber,

        totalSubjectSessions:
            session.totalSubjectSessions,

        occupiedPeriods:
            candidateSlots.map(
                (slot) =>
                    slot.period
            ),

        occupiedSlots:
            candidateSlots.map(
                (slot) => ({
                    period:
                        slot.period,
                    startTime:
                        slot.startTime,
                    endTime:
                        slot.endTime,
                })
            ),

        slotScore:
            candidate.score,
    };
};

/* =========================================================
   COMPLETE SCHEDULE SCORE
========================================================= */

const calculateFinalScore = ({
    schedule,
    subjects,
    college,
    studentCount,
}) => {
    let score = 100;

    const workingDays =
        college.workingDays
            ?.length || 1;

    /*
      -------------------------------------------------------
      1. EXACT SESSION COMPLETION
      -------------------------------------------------------
    */

    subjects.forEach(
        (subject) => {
            const expected =
                Number(
                    subject.classesPerWeek ||
                    1
                );

            const actual =
                schedule.filter(
                    (item) =>
                        item.subjectId ===
                        subject.id
                ).length;

            if (actual === expected) {
                score += 20;
            }
        }
    );

    /*
      -------------------------------------------------------
      2. SUBJECT DISTRIBUTION
      -------------------------------------------------------
    */

    subjects.forEach(
        (subject) => {
            const entries =
                schedule.filter(
                    (item) =>
                        item.subjectId ===
                        subject.id
                );

            const uniqueDays =
                new Set(
                    entries.map(
                        (item) =>
                            item.day
                    )
                ).size;

            const expected =
                Number(
                    subject.classesPerWeek ||
                    1
                );

            if (
                expected > 1 &&
                uniqueDays > 1
            ) {
                score +=
                    uniqueDays * 7;
            }

            if (
                expected <=
                workingDays &&
                uniqueDays === expected
            ) {
                score += 20;
            }
        }
    );

    /*
      -------------------------------------------------------
      3. DAILY COMPACTNESS
      -------------------------------------------------------
    */

    const classesByDay = {};

    schedule.forEach(
        (item) => {
            if (
                !classesByDay[item.day]
            ) {
                classesByDay[item.day] =
                    [];
            }

            classesByDay[
                item.day
            ].push(item);
        }
    );

    Object.values(
        classesByDay
    ).forEach((entries) => {
        const periods =
            entries
                .flatMap(
                    (item) =>
                        itemOccupiedPeriods(
                            item
                        )
                )
                .sort(
                    (a, b) => a - b
                );

        if (
            periods.length === 0
        ) {
            return;
        }

        const first =
            periods[0];

        const last =
            periods[
            periods.length - 1
            ];

        const span =
            last - first + 1;

        const gaps =
            span - periods.length;

        /*
          Fewer gaps = better.
        */

        score -=
            gaps * 12;
    });

    /*
      -------------------------------------------------------
      4. REPEATED SUBJECT SAME DAY
      -------------------------------------------------------
    */

    subjects.forEach(
        (subject) => {
            const entries =
                schedule.filter(
                    (item) =>
                        item.subjectId ===
                        subject.id
                );

            const grouped = {};

            entries.forEach(
                (entry) => {
                    grouped[entry.day] =
                        (grouped[entry.day] ||
                            0) + 1;
                }
            );

            Object.values(
                grouped
            ).forEach((count) => {
                if (count > 1) {
                    score -=
                        (count - 1) * 20;
                }
            });
        }
    );

    /*
      -------------------------------------------------------
      5. EMPTY DAYS
      -------------------------------------------------------
    */

    const usedDays =
        new Set(
            schedule.map(
                (item) => item.day
            )
        );

    if (
        usedDays.size <
        Math.min(
            workingDays,
            schedule.length
        )
    ) {
        score -= 5;
    }

    /*
      Keep score within a sensible range.
    */

    score = Math.max(
        0,
        Math.min(
            100,
            Math.round(score)
        )
    );

    return score;
};

/* =========================================================
   GENERATE ONE COMPLETE TIMETABLE
========================================================= */

const generateSingleTimetable = ({
    subjects,
    faculty,
    rooms,
    college,
    slots,
    slotMap,
    studentCount,
    batchId,
    existingSchedules = [],
}) => {
    const sessions =
        sortSessions(
            expandSessions(
                subjects
            )
        );

    const schedule = [];

    /*
      -------------------------------------------------------
      RECURSIVE BACKTRACK
      -------------------------------------------------------
    */

    const backtrack = (
        index
    ) => {
        /*
          Everything scheduled.
        */

        if (
            index >=
            sessions.length
        ) {
            return true;
        }

        const session =
            sessions[index];

        const candidates =
            buildCandidates({
                session,
                faculty,
                rooms,
                slots,
                slotMap,
                schedule,
                existingSchedules,
                college,
                studentCount,
                batchId,
            });

        if (
            candidates.length === 0
        ) {
            return false;
        }

        /*
          -----------------------------------------------------
          Try candidates in ranked order
          -----------------------------------------------------
        */

        for (
            const candidate of candidates
        ) {
            const entry =
                makeScheduleEntry({
                    candidate,
                    batchId,
                });

            /*
              Additional hard rule:
              If the subject has as many or fewer
              sessions than working days, avoid
              putting the same subject twice on
              the same day.
            */

            const subjectAlreadyThatDay =
                schedule.some(
                    (item) =>
                        item.subjectId ===
                        session.id &&
                        item.day ===
                        entry.day
                );

            const workingDayCount =
                college.workingDays
                    ?.length || 1;

            if (
                session.totalSubjectSessions <=
                workingDayCount &&
                subjectAlreadyThatDay
            ) {
                continue;
            }

            schedule.push(entry);

            if (
                backtrack(index + 1)
            ) {
                return true;
            }

            schedule.pop();
        }

        return false;
    };

    const success =
        backtrack(0);

    if (!success) {
        return null;
    }

    /*
      Verify all subjects received
      exactly the requested number of
      weekly sessions.
    */

    for (
        const subject of subjects
    ) {
        const expected =
            Number(
                subject.classesPerWeek ||
                1
            );

        const actual =
            schedule.filter(
                (item) =>
                    item.subjectId ===
                    subject.id
            ).length;

        if (
            actual !== expected
        ) {
            return null;
        }
    }

    /*
      Final sorting.
    */

    schedule.sort(
        (a, b) => {
            const dayDifference =
                dayIndex(a.day) -
                dayIndex(b.day);

            if (
                dayDifference !== 0
            ) {
                return dayDifference;
            }

            return (
                a.period -
                b.period
            );
        }
    );

    return schedule;
};

/* =========================================================
   SIGNATURE
========================================================= */

const scheduleSignature = (
    schedule
) => {
    return schedule
        .map(
            (item) =>
                [
                    item.subjectId,
                    item.day,
                    item.period,
                    item.roomId,
                ].join("|")
        )
        .sort()
        .join(";");
};

/* =========================================================
   PUBLIC API
========================================================= */

export const generateTimetable = ({
    college,
    faculty,
    rooms,
    subjects,
    studentCount,
    numberOfOptions = 3,
    existingSchedules = [],
}) => {
    if (!college) {
        throw new Error(
            "College configuration is missing."
        );
    }

    if (
        !Array.isArray(
            college.workingDays
        ) ||
        college.workingDays.length ===
        0
    ) {
        throw new Error(
            "No working days are configured."
        );
    }

    if (
        !college.workingHours?.start ||
        !college.workingHours?.end
    ) {
        throw new Error(
            "College working hours are not configured."
        );
    }

    if (
        !college.periodDuration
    ) {
        throw new Error(
            "Period duration is not configured."
        );
    }

    if (
        !Array.isArray(faculty) ||
        faculty.length === 0
    ) {
        throw new Error(
            "No faculty has been configured."
        );
    }

    if (
        !Array.isArray(rooms) ||
        rooms.length === 0
    ) {
        throw new Error(
            "No rooms or laboratories have been configured."
        );
    }

    if (
        !Array.isArray(subjects) ||
        subjects.length === 0
    ) {
        throw new Error(
            "No subjects were added."
        );
    }

    if (
        !studentCount ||
        Number(studentCount) <= 0
    ) {
        throw new Error(
            "Student count is invalid."
        );
    }

    /*
      Generate all valid teaching slots.
    */

    const slots =
        generateSlots(college);

    if (
        slots.length === 0
    ) {
        throw new Error(
            "No usable timetable periods were found."
        );
    }

    const slotMap =
        createSlotMap(slots);

    const results = [];
    const signatures =
        new Set();

    /*
      More attempts allow the engine
      to discover alternative valid
      timetables.
    */

    const maxAttempts =
        Math.max(
            numberOfOptions * 30,
            40
        );

    for (
        let attempt = 0;
        attempt < maxAttempts;
        attempt++
    ) {
        const schedule =
            generateSingleTimetable({
                subjects,
                faculty,
                rooms,
                college,
                slots,
                slotMap,
                studentCount:
                    Number(studentCount),
                batchId:
                    "current-batch",
                existingSchedules,
            });

        if (!schedule) {
            continue;
        }

        const signature =
            scheduleSignature(
                schedule
            );

        if (
            signatures.has(
                signature
            )
        ) {
            continue;
        }

        signatures.add(
            signature
        );

        const score =
            calculateFinalScore({
                schedule,
                subjects,
                college,
                studentCount:
                    Number(studentCount),
            });

        results.push({
            id: crypto.randomUUID(),

            score,

            schedule,
        });

        if (
            results.length >=
            numberOfOptions
        ) {
            break;
        }
    }

    /*
      Best first.
    */

    results.sort(
        (a, b) =>
            b.score -
            a.score
    );

    if (
        results.length === 0
    ) {
        throw new Error(
            "No valid timetable could be generated with the current faculty, rooms, working hours and constraints."
        );
    }

    return results;
};