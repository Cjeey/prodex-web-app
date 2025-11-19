import { supabase } from "./supabase-client";
import { TimetableEvent } from "./types";
import { toast } from "sonner";

export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000";

export function validateEventTimes(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) {
    return "Start and end times are required";
  }
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  if (start >= end) {
    return "End time must be after start time";
  }
  
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes < 15) {
    return "Event must be at least 15 minutes long";
  }
  
  return null;
}

export async function fetchTimetableEvents(): Promise<TimetableEvent[]> {
  if (!supabase) {
    toast.error("Database connection not available");
    return [];
  }

  const { data, error } = await supabase
    .from("timetable_events")
    .select("*")
    .eq("user_id", MOCK_USER_ID)
    .order("day", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching timetable events:", error);
    toast.error("Failed to load timetable events");
    return [];
  }

  return data || [];
}

export async function createTimetableEvent(
  event: Omit<TimetableEvent, "id" | "created_at" | "user_id">
): Promise<boolean> {
  if (!supabase) {
    toast.error("Database connection not available");
    return false;
  }

  const validationError = validateEventTimes(event.start_time, event.end_time);
  if (validationError) {
    toast.error(validationError);
    return false;
  }

  const { error } = await supabase.from("timetable_events").insert({
    ...event,
    user_id: MOCK_USER_ID,
  });

  if (error) {
    console.error("Error creating timetable event:", error);
    toast.error("Failed to create event");
    return false;
  }

  toast.success("Event created successfully");
  return true;
}

export async function updateTimetableEvent(
  id: string,
  updates: Partial<Omit<TimetableEvent, "id" | "created_at" | "user_id">>
): Promise<boolean> {
  if (!supabase) {
    toast.error("Database connection not available");
    return false;
  }

  if (updates.start_time || updates.end_time) {
    const { data: currentEvent } = await supabase
      .from("timetable_events")
      .select("start_time, end_time")
      .eq("id", id)
      .single();

    const startTime = updates.start_time || currentEvent?.start_time;
    const endTime = updates.end_time || currentEvent?.end_time;

    if (startTime && endTime) {
      const validationError = validateEventTimes(startTime, endTime);
      if (validationError) {
        toast.error(validationError);
        return false;
      }
    }
  }

  const { error } = await supabase
    .from("timetable_events")
    .update(updates)
    .eq("id", id)
    .eq("user_id", MOCK_USER_ID);

  if (error) {
    console.error("Error updating timetable event:", error);
    toast.error("Failed to update event");
    return false;
  }

  toast.success("Event updated successfully");
  return true;
}

export async function deleteTimetableEvent(id: string): Promise<boolean> {
  if (!supabase) {
    toast.error("Database connection not available");
    return false;
  }

  const { error } = await supabase
    .from("timetable_events")
    .delete()
    .eq("id", id)
    .eq("user_id", MOCK_USER_ID);

  if (error) {
    console.error("Error deleting timetable event:", error);
    toast.error("Failed to delete event");
    return false;
  }

  toast.success("Event deleted successfully");
  return true;
}

export function getDayName(day: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[day] || "Unknown";
}

export function getDayNumber(dayName: string): number {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days.indexOf(dayName);
}
