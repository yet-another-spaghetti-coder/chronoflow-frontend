import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberDashboardGroup } from "@/lib/validation/schema";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const GROUP_STATUS_META: Record<number, { label: string; className: string }> = {
  0: { label: "Active", className: "border-emerald-200 text-emerald-600" },
  1: { label: "Inactive", className: "border-amber-200 text-amber-600" },
};

type GroupsSpotlightProps = {
  groups: MemberDashboardGroup[];
};

export function GroupsSpotlight({ groups }: GroupsSpotlightProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Group Participation</CardTitle>
        <p className="text-sm text-muted-foreground">
          See which teams you&apos;re embedded in and the events they support.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You&apos;re not assigned to any groups yet. Once organisers add you to a team,
            it will show up here.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group) => {
              const event = group.event;
              const start = event.startTime ? DATE_FORMATTER.format(event.startTime) : null;
              const end = event.endTime ? DATE_FORMATTER.format(event.endTime) : null;
              const statusBadge = GROUP_STATUS_META[group.status] ?? null;
              const leadName = group.leadUserName?.trim() || null;
              const leadDisplay = leadName ?? "Not set";

              return (
                <div
                  key={group.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card/60 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {group.name}
                      </h3>
                      {statusBadge ? (
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">Leader: {leadDisplay}</p>
                  </div>

                  <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-sm text-muted-foreground">
                    <dt className="font-medium text-foreground">Event</dt>
                    <dd className="text-foreground">{event.name}</dd>
                    {event.location ? (
                      <>
                        <dt>Location</dt>
                        <dd>{event.location}</dd>
                      </>
                    ) : null}
                    {start ? (
                      <>
                        <dt>Starts</dt>
                        <dd>{start}</dd>
                      </>
                    ) : null}
                    {end ? (
                      <>
                        <dt>Ends</dt>
                        <dd>{end}</dd>
                      </>
                    ) : null}
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
