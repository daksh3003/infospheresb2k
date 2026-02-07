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

function normalizeTimeString(time: string | null | undefined): string {
    if (!time) return "00:00:00";
    
    // If already in HH:MM:SS format, return as is
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return time;
    }
    
    // If in HH:MM format, add seconds
    if (time.match(/^\d{1,2}:\d{2}$/)) {
        const parts = time.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
    }
    
    // Try to parse as datetime and extract time
    try {
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
        }
    } catch (e) {
        // If parsing fails, return default
    }
    
    return "00:00:00";
}

function extractTimeFromShiftDate(shiftDate: string | null | undefined): string {
    if (!shiftDate) return "10:00:00"; // Default
    
    // If it's already a time string (HH:MM:SS or HH:MM)
    if (shiftDate.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        // Ensure it has seconds
        const parts = shiftDate.split(':');
        if (parts.length === 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
        }
        return shiftDate;
    }
    
    // Check if it's a date-only string (yyyy-MM-dd) - if so, return default
    // because date-only fields shouldn't be used for time extraction
    if (shiftDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // This is a date-only field, not a time field
        // Return default as we can't extract time from a date
        return "10:00:00";
    }
    
    // If it's a datetime string with time, extract the time portion
    try {
        const date = new Date(shiftDate);
        if (!isNaN(date.getTime())) {
            // Check if the date string actually contains time information
            // If it's just a date, the time will be midnight which might be wrong due to timezone
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            
            // If the time is 00:00:00 or close to midnight, it might be a date-only field
            // Check if the original string contains time info
            if (timeStr === "00:00:00" && !shiftDate.includes('T') && !shiftDate.includes(' ')) {
                // Likely a date-only field, return default
                return "10:00:00";
            }
            
            return timeStr;
        }
    } catch (e) {
        // If parsing fails, return default
    }
    
    return "10:00:00"; // Default fallback
}

function getShiftFromProfile(profile: any, loginTime: string | null): { shift: string; shiftInTime: string; shiftOutTime: string } {
    // Default values for General shift
    let shift = "General";
    let shiftInTime = "10:00:00";
    let shiftOutTime = "19:00:00";
    
    // If no profile, return defaults
    if (!profile) {
        return { shift, shiftInTime, shiftOutTime };
    }
    
    // Use shift from profile if available
    if (profile.shift) {
        shift = String(profile.shift).trim();
    }
    
    // Check if shift_start_date and shift_end_date contain time information
    const startDateStr = profile.shift_start_date ? String(profile.shift_start_date).trim() : "";
    const endDateStr = profile.shift_end_date ? String(profile.shift_end_date).trim() : "";
    
    // Check if these are date-only fields (yyyy-MM-dd) or contain time info
    // Date-only fields don't have time info, so we'll use shift-based defaults
    const isDateOnly = (str: string) => str.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
    const startHasTime = startDateStr && !isDateOnly(startDateStr) && (startDateStr.includes('T') || startDateStr.includes(' ') || startDateStr.match(/^\d{1,2}:\d{2}/));
    const endHasTime = endDateStr && !isDateOnly(endDateStr) && (endDateStr.includes('T') || endDateStr.includes(' ') || endDateStr.match(/^\d{1,2}:\d{2}/));
    
    // Use shift_start_date and shift_end_date from profile ONLY if they contain time information
    // If they're date-only, we'll use shift-based defaults below
    if (startHasTime) {
        shiftInTime = extractTimeFromShiftDate(profile.shift_start_date);
    }
    
    if (endHasTime) {
        shiftOutTime = extractTimeFromShiftDate(profile.shift_end_date);
    }
    
    // If shift is set but times are not provided or are date-only, use defaults based on shift name
    // This ensures General shift uses 10:00:00 - 19:00:00, Night uses 22:00:00 - 06:00:00, etc.
    if (shift && (!startHasTime || !endHasTime)) {
        const shiftName = String(shift).toLowerCase();
        if (shiftName.includes("night")) {
            if (!startHasTime) shiftInTime = "22:00:00";
            if (!endHasTime) shiftOutTime = "06:00:00";
        } else if (shiftName.includes("evening")) {
            if (!startHasTime) shiftInTime = "18:00:00";
            if (!endHasTime) shiftOutTime = "02:00:00";
        } else if (shiftName.includes("afternoon")) {
            if (!startHasTime) shiftInTime = "14:00:00";
            if (!endHasTime) shiftOutTime = "22:00:00";
        } else if (shiftName.includes("middle")) {
            if (!startHasTime) shiftInTime = "11:00:00";
            if (!endHasTime) shiftOutTime = "20:00:00";
        } else {
            // Default: General or Day shift (10am to 7pm)
            if (!startHasTime) shiftInTime = "10:00:00";
            if (!endHasTime) shiftOutTime = "19:00:00";
        }
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
            .select("id, name, email, role, shift, shift_start_date, shift_end_date")
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
            
            // Get shift information from profile
            const shiftInfo = getShiftFromProfile(profile, loginTime);
            const shift = shiftInfo.shift;
            const shiftInTime = normalizeTimeString(shiftInfo.shiftInTime);
            const shiftOutTime = normalizeTimeString(shiftInfo.shiftOutTime);
            
            // Calculate shift in datetime
            const shiftInDateTime = attendanceDate && shiftInTime 
                ? `${attendanceDate}T${shiftInTime}`
                : null;
            
            // Calculate shift out datetime - handle shifts that span midnight
            let shiftOutDateTime = null;
            if (attendanceDate && shiftOutTime && shiftInTime && loginTime) {
                const loginDate = new Date(loginTime);
                const loginHour = loginDate.getHours();
                const loginMinute = loginDate.getMinutes();
                const loginSecond = loginDate.getSeconds();
                const loginTimeMinutes = loginHour * 60 + loginMinute + loginSecond / 60;
                
                // Parse shift times to minutes
                const [inHour, inMinute, inSecond] = shiftInTime.split(':').map(Number);
                const shiftInTimeMinutes = inHour * 60 + inMinute + inSecond / 60;
                
                const [outHour, outMinute, outSecond] = shiftOutTime.split(':').map(Number);
                const shiftOutTimeMinutes = outHour * 60 + outMinute + outSecond / 60;
                
                // Check if shift spans midnight (end time is earlier than start time)
                const spansMidnight = shiftOutTimeMinutes < shiftInTimeMinutes;
                
                if (spansMidnight) {
                    // Shift spans midnight
                    if (loginTimeMinutes >= shiftInTimeMinutes) {
                        // Login after shift start (e.g., 22:00), shift ends next day
                        const nextDay = new Date(attendanceDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const nextDayStr = nextDay.toISOString().split('T')[0];
                        shiftOutDateTime = `${nextDayStr}T${shiftOutTime}`;
                    } else {
                        // Login before shift start (e.g., 00:00-05:59), shift ends same day
                        shiftOutDateTime = `${attendanceDate}T${shiftOutTime}`;
                    }
                } else {
                    // Shift does not span midnight, ends same day
                    shiftOutDateTime = `${attendanceDate}T${shiftOutTime}`;
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
                shift: shift || 'General',
                shift_in_time: normalizeTimeString(shiftInTime),
                shift_out_time: normalizeTimeString(shiftOutTime),
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