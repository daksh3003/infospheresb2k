import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SHIFTS, getShiftByName, isShiftActive } from "@/lib/shifts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function calculateTimeDifference(start: string, end: string): string {
    if(!start || !end) return "00:00";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const timeDiff = endTime.getTime() - startTime.getTime();
    
    // Ensure non-negative time difference
    if (timeDiff < 0) return "00:00";
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function calculateLateEarly(actual: string, expected: string): string {
    if(!actual || !expected) return "00:00";
    const actualTime = new Date(actual);
    const expectedTime = new Date(expected);
    const timeDiff = expectedTime.getTime() - actualTime.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatTime(timestamp: string | null): string {
    if(!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: string | null): string {
    if(!timestamp) return "Not set";
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function determineShift(loginTime: string | null, logoutTime: string | null): { shift: string; shiftInTime: string; shiftOutTime: string } {
    // Default values
    let shift = "General";
    let shiftInTime = "10:00";
    let shiftOutTime = "19:00";
    
    if (!loginTime) {
        return { shift, shiftInTime, shiftOutTime };
    }
    
    const loginDate = new Date(loginTime);
    const loginHour = loginDate.getHours();
    const loginMinute = loginDate.getMinutes();
    const loginTimeMinutes = loginHour * 60 + loginMinute;
    
    // Use shared shifts definitions
    const shifts = SHIFTS;
    
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
        shiftInTime = "10:00";
        shiftOutTime = "19:00";
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

            // Check if user has an active assigned shift
            let shift: string;
            let shiftInTime: string;
            let shiftOutTime: string;

            const storedShift = profile?.shift;
            const storedStart = profile?.shift_start_date;
            const storedEnd = profile?.shift_end_date;

            if (storedShift && isShiftActive(storedStart, storedEnd)) {
                const shiftDef = getShiftByName(storedShift);
                if (shiftDef) {
                    shift = shiftDef.name;
                    shiftInTime = shiftDef.startTime;
                    shiftOutTime = shiftDef.endTime;
                } else {
                    // Invalid stored shift name, fall back to auto-detection
                    const shiftInfo = determineShift(loginTime, logoutTime);
                    shift = shiftInfo.shift;
                    shiftInTime = shiftInfo.shiftInTime;
                    shiftOutTime = shiftInfo.shiftOutTime;
                }
            } else {
                // No active assigned shift, fall back to auto-detection
                const shiftInfo = determineShift(loginTime, logoutTime);
                shift = shiftInfo.shift;
                shiftInTime = shiftInfo.shiftInTime;
                shiftOutTime = shiftInfo.shiftOutTime;
            }
            
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
                const loginTimeMinutes = loginHour * 60 + loginMinute;
                
                // Parse shift out time to minutes
                const [outHour, outMinute] = shiftOutTime.split(':').map(Number);
                const shiftOutTimeMinutes = outHour * 60 + outMinute;
                
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
            
            // Calculate work duration (total time from login to logout)
            const workDuration = loginTime && logoutTime
                ? calculateTimeDifference(loginTime, logoutTime)
                : "00:00";
            
            // Calculate overtime as time worked beyond shift end time
            // Overtime = logout_time - shift_out_time (only if logout is after shift end)
            let overtime = "00:00";
            if (logoutTime && shiftOutDateTime && loginTime) {
                const logoutDate = new Date(logoutTime);
                const shiftEndDate = new Date(shiftOutDateTime);
                const loginDate = new Date(loginTime);
                
                // Ensure we're comparing dates correctly - normalize to same date context
                // For shifts that span midnight, we need to handle date boundaries properly
                if (shift === "Night" || shift === "Evening") {
                    // For shifts spanning midnight, if logout is on a different calendar day than shift end,
                    // we need to check if logout is actually after the shift end time
                    const logoutDateOnly = logoutTime.split('T')[0];
                    const shiftEndDateOnly = shiftOutDateTime.split('T')[0];
                    
                    // If logout is on the same day or next day as shift end, compare times
                    if (logoutDateOnly === shiftEndDateOnly || 
                        (new Date(logoutDateOnly).getTime() - new Date(shiftEndDateOnly).getTime()) === 86400000) {
                        // Same day or next day - compare times
                        if (logoutDate > shiftEndDate) {
                            overtime = calculateTimeDifference(shiftOutDateTime, logoutTime);
                        }
                    } else if (logoutDateOnly < shiftEndDateOnly) {
                        // Logout is before shift end date - this shouldn't happen, but handle gracefully
                        overtime = "00:00";
                    } else {
                        // Logout is more than one day after shift end - calculate normally
                        if (logoutDate > shiftEndDate) {
                            overtime = calculateTimeDifference(shiftOutDateTime, logoutTime);
                        }
                    }
                } else {
                    // For regular shifts, simple comparison
                    if (logoutDate > shiftEndDate) {
                        overtime = calculateTimeDifference(shiftOutDateTime, logoutTime);
                    }
                }
                
                // Sanity check: Overtime should never exceed work duration
                // Parse work duration and overtime to minutes for comparison
                const [workHours, workMins] = workDuration.split(':').map(Number);
                const workTotalMins = workHours * 60 + workMins;
                
                const [otHours, otMins] = overtime.split(':').map(Number);
                const otTotalMins = otHours * 60 + otMins;
                
                // Calculate shift duration
                const [shiftInH, shiftInM] = shiftInTime.split(':').map(Number);
                const [shiftOutH, shiftOutM] = shiftOutTime.split(':').map(Number);
                let shiftDurationMins = 0;
                
                if (shift === "Night" || shift === "Evening") {
                    // For shifts spanning midnight: (24:00 - shiftIn) + shiftOut
                    shiftDurationMins = (24 * 60 - (shiftInH * 60 + shiftInM)) + (shiftOutH * 60 + shiftOutM);
                } else {
                    // Regular shift: shiftOut - shiftIn
                    shiftDurationMins = (shiftOutH * 60 + shiftOutM) - (shiftInH * 60 + shiftInM);
                }
                
                // Overtime should be: max(0, workDuration - shiftDuration)
                // But also ensure it doesn't exceed what we calculated from logout time
                const expectedOvertimeMins = Math.max(0, workTotalMins - shiftDurationMins);
                const calculatedOvertimeMins = otTotalMins;
                
                // Use the minimum of calculated overtime and expected overtime
                // Also ensure overtime never exceeds work duration (safety check)
                const finalOvertimeMins = Math.min(calculatedOvertimeMins, expectedOvertimeMins, workTotalMins);
                
                if (finalOvertimeMins !== otTotalMins) {
                    const finalHours = Math.floor(finalOvertimeMins / 60);
                    const finalMins = finalOvertimeMins % 60;
                    overtime = `${String(finalHours).padStart(2, '0')}:${String(finalMins).padStart(2, '0')}`;
                }
            }
            
            const totalDuration = workDuration;

            let lateBy = "00:00";
            if(loginTime && shiftInDateTime) {
                const loginDate = new Date(loginTime);
                const shiftStartDate = new Date(shiftInDateTime);
                if(loginDate > shiftStartDate) {
                    // Late by = loginTime - shiftInDateTime (intime - shiftintime)
                    lateBy = calculateTimeDifference(shiftInDateTime, loginTime);
                }
            }

            let earlyBy = "00:00";
            if(logoutTime && shiftOutDateTime) {
                const logoutDate = new Date(logoutTime);
                const shiftEndDate = new Date(shiftOutDateTime);
                if(logoutDate < shiftEndDate) {
                    earlyBy = calculateLateEarly(logoutTime, shiftOutDateTime);
                }
            }
            
            const status = loginTime ? "Present" : "Absent";

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
                department: profile?.role || 'Unknown',
                employee_id: profile?.id || session.user_id || 'Unknown',
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

        return NextResponse.json(attendanceData);
    } catch(error) {
        console.error("API error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}