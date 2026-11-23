# Scheduler

Import `NeuSchedulerComponent` from `@neural-ui/core/scheduler`. Supply a civil `YYYY-MM-DD` anchor, an IANA time zone and events with UTC epoch millisecond timestamps. Week starts on the supplied anchor and includes seven days. The application applies `dateChange`, `viewChange` and `eventChange`, supplies IDs on create, validates conflicts, and persists accepted proposals. Updating an appointment's start through the inline editor is the keyboard-accessible way to move it.

The editor uses civil time in the configured zone. A skipped daylight-saving minute cannot be submitted. An unchanged repeated minute preserves its original instant. Entering a repeated minute for a new appointment uses the earlier instant. Duration is elapsed minutes, including across clock changes. Calendar remains the month/week read-oriented display.

This candidate covers timed appointments. Resources, recurrence and drag-and-drop are future work. A production integration should validate the configured IANA identifier before passing it in and use the same locale/time zone through SSR and hydration.
