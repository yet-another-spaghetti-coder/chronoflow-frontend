import { useMemo } from "react"

import { IconCalendarEvent, IconClockHour4, IconListCheck, IconUsersGroup } from "@tabler/icons-react"

import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DataTable } from "./components/data-table"
import { SectionCards, type SummaryMetric } from "./components/section-cards"
import { SiteHeader } from "./components/site-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrgEvents } from "@/hooks/events/useOrgEvents"
import type { OrgEvent } from "@/lib/validation/schema"

export function buildMetrics(events: OrgEvent[]): SummaryMetric[] {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const totalEvents = events.length
  const activeEvents = events.filter((event) => event.status === 1).length

  const upcomingSoon = events.filter(
    (event) =>
      event.startTime.getTime() > now.getTime() &&
      event.startTime.getTime() <= sevenDaysFromNow.getTime()
  )

  const nextEvent = events
    .filter((event) => event.startTime.getTime() > now.getTime())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0]

  const totalParticipants = events.reduce(
    (sum, event) => sum + (event.joiningParticipants ?? 0),
    0
  )
  const eventsWithParticipants = events.filter(
    (event) => (event.joiningParticipants ?? 0) > 0
  ).length

  const openTasks = events.reduce(
    (sum, event) => sum + (event.taskStatus?.remaining ?? 0),
    0
  )
  const eventsWithOpenTasks = events.filter(
    (event) => (event.taskStatus?.remaining ?? 0) > 0
  ).length

  return [
    {
      title: "Total Events",
      description: "Published, planned, and in-progress events across the organisation.",
      icon: <IconCalendarEvent className="size-4" />,
      value: totalEvents.toString(),
      badge:
        totalEvents === 0
          ? "No events yet"
          : `${activeEvents} active right now`,
      badgeTone: activeEvents > 0 ? "up" : undefined,
    },
    {
      title: "Starting Soon",
      description: "Events beginning within the next 7 days that need final checks.",
      icon: <IconClockHour4 className="size-4" />,
      value: upcomingSoon.length.toString(),
      badge: nextEvent
        ? `Next: ${nextEvent.name} • ${nextEvent.startTime.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}`
        : "No upcoming events",
    },
    {
      title: "Registrations",
      description: "Confirmed participants across all scheduled events.",
      icon: <IconUsersGroup className="size-4" />,
      value: totalParticipants.toString(),
      badge:
        eventsWithParticipants === 0
          ? "No participants yet"
          : `Across ${eventsWithParticipants} events`,
      badgeClassName: "text-[#6366f1]",
    },
    {
      title: "Open Tasks",
      description: "Outstanding tasks that still need attention before events go live.",
      icon: <IconListCheck className="size-4" />,
      value: openTasks.toString(),
      badge:
        openTasks === 0
          ? "All tasks completed"
          : `Present in ${eventsWithOpenTasks} events`,
      badgeTone: openTasks === 0 ? "up" : "down",
    },
  ]
}

export default function OrganiserDashboardPage() {
  const { events, loading, error } = useOrgEvents(true)

  const metrics = useMemo(() => buildMetrics(events), [events])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <Skeleton className="h-14 w-2/5 max-w-sm" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-8">
        <SiteHeader />
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-destructive">
          Failed to load organiser dashboard: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
      <SiteHeader />
      <SectionCards metrics={metrics} />
      <ChartAreaInteractive events={events} />
      <DataTable events={events} />
    </div>
  )
}
