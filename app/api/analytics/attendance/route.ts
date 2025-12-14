import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
            
            // Determine shift based on login time
            // If login time is after 6pm (18:00) or before 8am (08:00), it's Night shift, otherwise Day shift
            let shift = "Day";
            let shiftInTime = "09:00";
            let shiftOutTime = "18:00";
            
            if (loginTime) {
                const loginDate = new Date(loginTime);
                const loginHour = loginDate.getHours();
                
                if (loginHour >= 18 || loginHour < 8) {
                    // Night shift: starts at 18:00, ends at 08:00 next day
                    // This covers both:
                    // - Login between 18:00-23:59 (6 PM - 11:59 PM)
                    // - Login between 00:00-07:59 (12 AM - 7:59 AM, continuation of previous night shift)
                    shift = "Night";
                    shiftInTime = "18:00";
                    shiftOutTime = "08:00";
                } else {
                    // Day shift: starts at 09:00, ends at 18:00
                    // Login between 08:00-17:59 (8 AM - 5:59 PM)
                    shift = "Day";
                    shiftInTime = "09:00";
                    shiftOutTime = "18:00";
                }
            }
            
            // For night shift, shift out time is next day
            const shiftInDateTime = attendanceDate && shiftInTime 
                ? `${attendanceDate}T${shiftInTime}:00`
                : null;
            
            // Calculate shift out datetime - for night shift, it depends on login time
            let shiftOutDateTime = null;
            if (attendanceDate && shiftOutTime && loginTime) {
                if (shift === "Night") {
                    const loginDate = new Date(loginTime);
                    const loginHour = loginDate.getHours();
                    
                    if (loginHour >= 18) {
                        // Login between 18:00-23:59, shift ends next day at 08:00
                        const nextDay = new Date(attendanceDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const nextDayStr = nextDay.toISOString().split('T')[0];
                        shiftOutDateTime = `${nextDayStr}T${shiftOutTime}:00`;
                    } else {
                        // Login between 00:00-07:59, shift ends same day at 08:00
                        // (This is continuation of previous night shift that started at 18:00 previous day)
                        shiftOutDateTime = `${attendanceDate}T${shiftOutTime}:00`;
                    }
                } else {
                    // Day shift ends same day
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
            if (logoutTime && shiftOutDateTime) {
                const logoutDate = new Date(logoutTime);
                const shiftEndDate = new Date(shiftOutDateTime);
                
                // Calculate overtime if logout is after shift end time
                if (logoutDate > shiftEndDate) {
                    overtime = calculateTimeDifference(shiftOutDateTime, logoutTime);
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