import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function calculateTimeDifference(start: string, end: string): string {
    if(!start || !end) return "00:00:00";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const timeDiff = endTime.getTime() - startTime.getTime();
    
    // Ensure non-negative time difference
    if (timeDiff < 0) return "00:00:00";
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateTimeDifferenceInMinutes(start: string, end: string): number {
    if(!start || !end) return 0;
    const startTime = new Date(start);
    const endTime = new Date(end);
    const timeDiff = endTime.getTime() - startTime.getTime();
    
    // Ensure non-negative time difference
    if (timeDiff < 0) return 0;
    
    return Math.floor(timeDiff / (1000 * 60)); // Return minutes
}

function minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

function calculateLateEarly(actual: string, expected: string): string {
    if(!actual || !expected) return "00:00:00";
    const actualTime = new Date(actual);
    const expectedTime = new Date(expected);
    const timeDiff = expectedTime.getTime() - actualTime.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTime(timestamp: string | null): string {
    if(!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(timestamp: string | null): string {
    if(!timestamp) return "Not set";
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function determineShift(loginTime: string | null, logoutTime: string | null): { shift: string; shiftInTime: string; shiftOutTime: string } {
    // Default values
    let shift = "General";
    let shiftInTime = "10:00:00";
    let shiftOutTime = "19:00:00";
    
    if (!loginTime) {
        return { shift, shiftInTime, shiftOutTime };
    }
    
    const loginDate = new Date(loginTime);
    const loginHour = loginDate.getHours();
    const loginMinute = loginDate.getMinutes();
    const loginSecond = loginDate.getSeconds();
    const loginTimeMinutes = loginHour * 60 + loginMinute + loginSecond / 60;
    
    // Define all shifts with their time ranges
    const shifts = [
        { name: "Night", start: 22 * 60, end: 6 * 60, startTime: "22:00", endTime: "06:00", spansMidnight: true },
        { name: "Evening", start: 18 * 60, end: 2 * 60, startTime: "18:00", endTime: "02:00", spansMidnight: true },
        { name: "Afternoon", start: 14 * 60, end: 22 * 60, startTime: "14:00", endTime: "22:00", spansMidnight: false },
        { name: "Middle", start: 11 * 60, end: 20 * 60, startTime: "11:00", endTime: "20:00", spansMidnight: false },
        { name: "General", start: 10 * 60, end: 19 * 60, startTime: "10:00", endTime: "19:00", spansMidnight: false },
    ];
    
    // Find all shifts that the login time falls into
    const matchingShifts = shifts.filter(s => {
        if (s.spansMidnight) {
            // For shifts that span midnight, check if login is after start OR before end
            return loginTimeMinutes >= s.start || loginTimeMinutes < s.end;
        } else {
            // For regular shifts, check if login is between start and end
            return loginTimeMinutes >= s.start && loginTimeMinutes < s.end;
        }
    });
    
    // If multiple shifts match, prioritize:
    // 1. Shifts that span midnight (Night, Evening)
    // 2. Shifts whose start time is closest to login time
    if (matchingShifts.length > 0) {
        // First, prefer shifts that span midnight
        const midnightShifts = matchingShifts.filter(s => s.spansMidnight);
        if (midnightShifts.length > 0) {
            // Among midnight shifts, pick the one whose start is closest to login time
            midnightShifts.sort((a, b) => {
                const distA = Math.min(
                    Math.abs(loginTimeMinutes - a.start),
                    loginTimeMinutes < a.end ? Math.abs(loginTimeMinutes - (a.start - 1440)) : Infinity
                );
                const distB = Math.min(
                    Math.abs(loginTimeMinutes - b.start),
                    loginTimeMinutes < b.end ? Math.abs(loginTimeMinutes - (b.start - 1440)) : Infinity
                );
                return distA - distB;
            });
            const selected = midnightShifts[0];
            shift = selected.name;
            shiftInTime = selected.startTime;
            shiftOutTime = selected.endTime;
        } else {
            // No midnight shifts, pick the one whose start is closest to login time
            matchingShifts.sort((a, b) => Math.abs(loginTimeMinutes - a.start) - Math.abs(loginTimeMinutes - b.start));
            const selected = matchingShifts[0];
            shift = selected.name;
            shiftInTime = selected.startTime;
            shiftOutTime = selected.endTime;
        }
    } else {
        // No matching shift found, assign to General as default
        // This handles edge cases like login before 10am
        shift = "General";
        shiftInTime = "10:00:00";
        shiftOutTime = "19:00:00";
    }
    
    return { shift, shiftInTime, shiftOutTime };
}

export async function GET() {
    try {
        // Fetch user_sessions data
        const { data: sessions, error: sessionsError } = await supabase
            .from("user_sessions")
            .select("id, user_id, login_time, logout_time, session_date")
            .order("session_date", { ascending: false })
            .order("login_time", { ascending: false });

        if (sessionsError) {
            console.error("Error fetching user_sessions:", sessionsError);
            return NextResponse.json({ error: sessionsError.message }, { status: 400 });
        }

        if (!sessions || sessions.length === 0) {
            return NextResponse.json([]);
        }

        // Get unique user IDs from sessions
        const userIds = [...new Set(sessions.map((s: any) => s.user_id))].filter(Boolean);

        // Fetch profiles data for all users
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, email, role")
            .in("id", userIds);

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            return NextResponse.json({ error: profilesError.message }, { status: 400 });
        }

        // Create a map of user_id to profile for quick lookup
        const profileMap = new Map();
        if (profiles) {
            profiles.forEach((profile: any) => {
                profileMap.set(profile.id, profile);
            });
        }
      
        // Join sessions with profiles manually
        const attendanceData = sessions.map((session: any) => {
            // Find matching profile using user_id from sessions and id from profiles
            const profile = profileMap.get(session.user_id);
            
            const loginTime = session.login_time;
            const logoutTime = session.logout_time;
            const attendanceDate = session.session_date || (loginTime ? loginTime.split('T')[0] : null);
            
            // Determine shift based on login and logout times
            const shiftInfo = determineShift(loginTime, logoutTime);
            const shift = shiftInfo.shift;
            const shiftInTime = shiftInfo.shiftInTime;
            const shiftOutTime = shiftInfo.shiftOutTime;
            
            // Calculate shift in datetime
            const shiftInDateTime = attendanceDate && shiftInTime 
                ? `${attendanceDate}T${shiftInTime}:00`
                : null;
            
            // Calculate shift out datetime - handle shifts that span midnight
            let shiftOutDateTime = null;
            if (attendanceDate && shiftOutTime && loginTime) {
                const loginDate = new Date(loginTime);
                const loginHour = loginDate.getHours();
                const loginMinute = loginDate.getMinutes();
                const loginSecond = loginDate.getSeconds();
                const loginTimeMinutes = loginHour * 60 + loginMinute + loginSecond / 60;
                
                // Parse shift out time to minutes
                const [outHour, outMinute, outSecond] = shiftOutTime.split(':').map(Number);
                const shiftOutTimeMinutes = outHour * 60 + outMinute + outSecond / 60;
                
                // Shifts that span midnight: Night (22:00-06:00) and Evening (18:00-02:00)
                if (shift === "Night") {
                    // Night shift: 22:00 - 06:00
                    if (loginTimeMinutes >= 1320) {
                        // Login between 22:00-23:59, shift ends next day at 06:00
                        const nextDay = new Date(attendanceDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const nextDayStr = nextDay.toISOString().split('T')[0];
                        shiftOutDateTime = `${nextDayStr}T${shiftOutTime}:00`;
                    } else {
                        // Login between 00:00-05:59, shift ends same day at 06:00
                        shiftOutDateTime = `${attendanceDate}T${shiftOutTime}:00`;
                    }
                } else if (shift === "Evening") {
                    // Evening shift: 18:00 - 02:00
                    if (loginTimeMinutes >= 1080) {
                        // Login between 18:00-23:59, shift ends next day at 02:00
                        const nextDay = new Date(attendanceDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const nextDayStr = nextDay.toISOString().split('T')[0];
                        shiftOutDateTime = `${nextDayStr}T${shiftOutTime}:00`;
                    } else {
                        // Login between 00:00-01:59, shift ends same day at 02:00
                        shiftOutDateTime = `${attendanceDate}T${shiftOutTime}:00`;
                    }
                } else {
                    // All other shifts end same day
                    shiftOutDateTime = `${attendanceDate}T${shiftOutTime}:00`;
                }
            }
            
            // Calculate total time worked (login to logout)
            const totalWorkedMinutes = loginTime && logoutTime
                ? calculateTimeDifferenceInMinutes(loginTime, logoutTime)
                : 0;

            // Determine status, work duration, and overtime based on hours worked
            let status = "Absent";
            let workDuration = "00:00:00";
            let overtime = "00:00:00";
            
            if (loginTime) {
                if (totalWorkedMinutes >= 480) { // 8+ hours = 480 minutes
                    // Present: Work time = 8 hours, OT = remaining time
                    status = "Present";
                    workDuration = "08:00:00";
                    const overtimeMinutes = totalWorkedMinutes - 480;
                    overtime = minutesToTimeString(overtimeMinutes);
                } else if (totalWorkedMinutes >= 270) { // 4.5-7.99 hours = 270-479 minutes
                    // Half Day: Work time = 4.5 hours, OT = remaining time
                    status = "Half Day";
                    workDuration = "04:30:00";
                    const overtimeMinutes = totalWorkedMinutes - 270; // 4.5 hours = 270 minutes
                    overtime = minutesToTimeString(overtimeMinutes);
                } else { // Less than 4.5 hours
                    // Absent: Work time = 0, OT = all time worked
                    status = "Absent";
                    workDuration = "00:00:00";
                    overtime = minutesToTimeString(totalWorkedMinutes);
                }
            } else {
                // No login time
                status = "Absent";
                workDuration = "00:00:00";
                overtime = "00:00:00";
            }
            
            const totalDuration = minutesToTimeString(totalWorkedMinutes);

            let lateBy = "00:00:00";
            if(loginTime && shiftInDateTime) {
                const loginDate = new Date(loginTime);
                const shiftStartDate = new Date(shiftInDateTime);
                if(loginDate > shiftStartDate) {
                    // Late by = loginTime - shiftInDateTime
                    lateBy = calculateTimeDifference(shiftInDateTime, loginTime);
                }
            }

            let earlyBy = "00:00:00";
            if(logoutTime && shiftOutDateTime) {
                const logoutDate = new Date(logoutTime);
                const shiftEndDate = new Date(shiftOutDateTime);
                if(logoutDate < shiftEndDate) {
                    earlyBy = calculateLateEarly(logoutTime, shiftOutDateTime);
                }
            }

            const punchRecords = [];
            if(loginTime) {
                punchRecords.push(`${formatTime(loginTime)}:in(TD)`);
            }
            if(logoutTime) {
                punchRecords.push(`${formatTime(logoutTime)}:out(TD)`);
            }
            const punchRecordsStr = punchRecords.length > 0 ? punchRecords.join(',') : '';

            return {
                id: session.id,
                employee_id: session.user_id,
                name: profile?.name || 'Unknown',
                department: profile?.role || 'Unknown',
                employee_name: profile?.name || 'Unknown',
                role: profile?.role || 'Unknown',
                attendance_date: attendanceDate ? formatDate(attendanceDate) : 'Unknown',
                in_time: formatTime(loginTime),
                out_time: formatTime(logoutTime),
                shift: shift,
                shift_in_time: shiftInTime,
                shift_out_time: shiftOutTime,
                work_duration: workDuration,
                ot: overtime,
                total_duration: totalDuration,
                late_by: lateBy,
                early_going_by: earlyBy,
                status: status,
                punch_records: punchRecordsStr,
            };
        });

        // -------- Aggregate per employee + date for summary fields --------
        const parseHHMMSSToMinutes = (time: string | null | undefined) => {
            if (!time || typeof time !== "string" || time === "N/A") return 0;
            const parts = time.split(":").map(Number);
            if (parts.length < 2 || parts.some(isNaN)) return 0;
            const [hours, minutes, seconds] = [parts[0], parts[1], parts[2] ?? 0];
            return hours * 60 + minutes + Math.floor(seconds / 60);
        };

        type DayKey = string;
        const dayAggregates = new Map<
            DayKey,
            { totalWorkingMinutes: number; firstInMinutes: number | null; lastOutMinutes: number | null }
        >();

        attendanceData.forEach((row: any) => {
            const key: DayKey = `${row.employee_id || row.employee_name || ""}_${row.attendance_date || ""}`;
            if (!dayAggregates.has(key)) {
                dayAggregates.set(key, { totalWorkingMinutes: 0, firstInMinutes: null, lastOutMinutes: null });
            }
            const agg = dayAggregates.get(key)!;

            // Per-session working minutes come from total_duration
            agg.totalWorkingMinutes += parseHHMMSSToMinutes(row.total_duration);

            const inM = parseHHMMSSToMinutes(row.in_time);
            const outM = parseHHMMSSToMinutes(row.out_time);

            if (inM > 0) {
                agg.firstInMinutes = agg.firstInMinutes === null ? inM : Math.min(agg.firstInMinutes, inM);
            }
            if (outM > 0) {
                agg.lastOutMinutes = agg.lastOutMinutes === null ? outM : Math.max(agg.lastOutMinutes, outM);
            }
        });

        const enhancedAttendance = attendanceData.map((row: any) => {
            const key: DayKey = `${row.employee_id || row.employee_name || ""}_${row.attendance_date || ""}`;
            const agg = dayAggregates.get(key);

            if (!agg || agg.firstInMinutes === null || agg.lastOutMinutes === null || agg.lastOutMinutes <= agg.firstInMinutes) {
                return {
                    ...row,
                    total_working_time: minutesToTimeString(0),
                    total_time_spent: minutesToTimeString(0),
                    idle_time: minutesToTimeString(0),
                };
            }

            const totalWorking = agg.totalWorkingMinutes;
            const totalTimeSpent = agg.lastOutMinutes - agg.firstInMinutes;
            const idle = Math.max(totalTimeSpent - totalWorking, 0);

            return {
                ...row,
                total_working_time: minutesToTimeString(totalWorking),
                total_time_spent: minutesToTimeString(totalTimeSpent),
                idle_time: minutesToTimeString(idle),
            };
        });

        return NextResponse.json(enhancedAttendance);
    } catch(error) {
        console.error("API error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}