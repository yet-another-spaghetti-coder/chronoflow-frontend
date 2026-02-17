"use client";

import * as React from "react";
import { useParams } from "react-router-dom";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getAttendeeDashboard } from "@/api/attendeeApi";

function fmt(dt?: string | null) {
  if (!dt) return "-";
  const d = new Date(dt);
  return Number.isNaN(d.getTime()) ? dt : d.toLocaleString();
}

const chartConfig = {
  count: { label: "Count" },
  checkedIn: { label: "Checked-in", color: "var(--chart-1)" },
  nonCheckedIn: { label: "Not checked-in", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function EventDashboardPage() {
  const { id } = useParams(); // from /event/:id/dashboard

  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);

  async function load(p: number) {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAttendeeDashboard(id, p, pageSize);
      setData(res);
      setPage(p);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [
      {
        status: "checkedIn",
        count: data.summary.checkedIn,
        fill: "var(--color-checkedIn)",
      },
      {
        status: "nonCheckedIn",
        count: data.summary.nonCheckedIn,
        fill: "var(--color-nonCheckedIn)",
      },
    ];
  }, [data]);

  const total = data?.attendees?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-4 space-y-4">
      <div className="text-xl font-semibold">Event Dashboard</div>

      {error && (
        <div className="border rounded-md p-3 text-sm">
          {error}
          <Button
            className="ml-3"
            variant="outline"
            onClick={() => load(page)}
            disabled={loading}
          >
            Retry
          </Button>
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : null}

      {data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Pie chart */}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Check-in Overview</CardTitle>
              <CardDescription>
                Total: {data.summary.checkedIn + data.summary.nonCheckedIn}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-70"
              >
                <PieChart>
                  <Pie data={chartData} dataKey="count" />
                  <ChartLegend
                    content={<ChartLegendContent nameKey="status" />}
                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/2 *:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent list */}
          <Card>
            <CardHeader>
              <CardTitle>Not checked-in (Most recent)</CardTitle>
              <CardDescription>Newest registrations first</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-md border overflow-auto">
                <Table className="min-w-180">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.attendees.items.length ? (
                      data.attendees.items.map((a: any, idx: number) => (
                        <TableRow key={`${a.email ?? "row"}-${idx}`}>
                          <TableCell className="font-medium">
                            {a.name ?? "-"}
                          </TableCell>
                          <TableCell>{a.email ?? "-"}</TableCell>
                          <TableCell>{a.mobile ?? "-"}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {fmt(a.createTime)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Everyone is checked in 🎉
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page} / {totalPages} · {total} pending
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => load(page - 1)}
                    disabled={loading || page <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => load(page + 1)}
                    disabled={loading || page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
