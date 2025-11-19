"use client";

import { useEffect, useState, useMemo } from "react";
import { CalendarRange, CalendarClock, Trash2 } from "lucide-react";
import { Category, TimetableEvent } from "@/lib/types";
import {
  fetchTimetableEvents,
  createTimetableEvent,
  deleteTimetableEvent,
  getDayNumber,
} from "@/lib/supabase-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const categoryOptions: Category[] = ["Uni", "Work", "Personal"];

const categoryColors: Record<Category, string> = {
  Uni: "bg-blue-500",
  Work: "bg-amber-500",
  Personal: "bg-green-500",
};

export default function TimetablePage() {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: null,
    eventTitle: "",
  });

  const [newEvent, setNewEvent] = useState<{
    title: string;
    dayOfWeek: string;
    start_time: string;
    end_time: string;
    category: Category;
    location: string;
  }>({
    title: "",
    dayOfWeek: "Monday",
    start_time: "09:00",
    end_time: "10:00",
    category: "Uni",
    location: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const data = await fetchTimetableEvents();
    setEvents(data);
    setLoading(false);
  }

  const grouped = useMemo(() => {
    return dayOptions.map((day, dayIndex) => ({
      day,
      events: events
        .filter((event) => event.day === dayIndex)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }));
  }, [events]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newEvent.title.trim()) return;

    setSubmitting(true);

    const success = await createTimetableEvent({
      title: newEvent.title.trim(),
      day: getDayNumber(newEvent.dayOfWeek),
      start_time: newEvent.start_time,
      end_time: newEvent.end_time,
      category: newEvent.category,
      location: newEvent.location.trim() || undefined,
    });

    if (success) {
      await loadEvents();
      setNewEvent((prev) => ({ ...prev, title: "", location: "" }));
    }

    setSubmitting(false);
  };

  const handleDeleteClick = (event: TimetableEvent) => {
    setDeleteConfirm({
      isOpen: true,
      eventId: event.id,
      eventTitle: event.title,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.eventId) return;

    const success = await deleteTimetableEvent(deleteConfirm.eventId);
    
    if (success) {
      await loadEvents();
    }

    setDeleteConfirm({ isOpen: false, eventId: null, eventTitle: "" });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, eventId: null, eventTitle: "" });
  };

  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="subtle">Weekly timetable</p>
          <h1 className="section-title text-2xl">Week View</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <CalendarRange className="h-4 w-4" />
          <span className="pill bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
            Classes
          </span>
          <span className="pill bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-200">
            Work
          </span>
          <span className="pill bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-200">
            Personal
          </span>
        </div>
      </header>

      <section className="card p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add New Event</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-7">
          <input
            className="input md:col-span-2"
            placeholder="Event title"
            value={newEvent.title}
            required
            disabled={submitting}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />
          <select
            className="input"
            value={newEvent.dayOfWeek}
            disabled={submitting}
            onChange={(e) => setNewEvent({ ...newEvent, dayOfWeek: e.target.value })}
          >
            {dayOptions.map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            className="input"
            value={newEvent.start_time}
            disabled={submitting}
            onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
          />
          <input
            type="time"
            className="input"
            value={newEvent.end_time}
            disabled={submitting}
            onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
          />
          <select
            className="input"
            value={newEvent.category}
            disabled={submitting}
            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as Category })}
          >
            {categoryOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Location (optional)"
            value={newEvent.location}
            disabled={submitting}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />
          <button type="submit" className="btn-primary md:w-auto" disabled={submitting}>
            {submitting ? "Adding..." : "Add event"}
          </button>
        </form>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="min-w-[900px] grid grid-cols-7 gap-3">
              {dayOptions.map((day) => (
                <div key={day} className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <div className="min-h-[520px] rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-w-[900px] grid grid-cols-7 gap-3">
              {grouped.map(({ day, events }) => (
                <div key={day} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {day}
                    <span className="subtle">{events.length} events</span>
                  </div>
                  <div className="min-h-[520px] rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`rounded-xl p-3 text-white shadow-sm flex flex-col gap-1 ${
                          categoryColors[event.category]
                        }`}
                        title={event.title}
                      >
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span className="truncate pr-2">{truncateText(event.title)}</span>
                          <CalendarClock className="h-4 w-4 opacity-80 flex-shrink-0" />
                        </div>
                        <span className="text-xs opacity-90">
                          {event.start_time} - {event.end_time}
                        </span>
                        {event.location && (
                          <span className="text-xs opacity-90 truncate" title={event.location}>
                            {truncateText(event.location, 30)}
                          </span>
                        )}
                        <button
                          type="button"
                          className="text-xs underline underline-offset-2 text-left hover:opacity-80 transition-opacity flex items-center gap-1 mt-1"
                          onClick={() => handleDeleteClick(event)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <p className="subtle text-center py-8">No events</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteConfirm.eventTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
