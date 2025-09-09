import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type MemberPrefill = {
  event_id: string;
  member_id: string;
  eventName: string;
  email: string;
  role: string;
};

export function useMemberInvite() {
  const [params] = useSearchParams();
  const [prefill, setPrefill] = useState<MemberPrefill | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lookup = useCallback(async (event_id: string, member_id: string) => {
    setLoading(true);
    setErr(null);
    try {
      //   const res = await getTenantMemberInfo({ event_id, member_id });

      await new Promise((res) => setTimeout(res, 500)); // simulate latency
      const res = {
        data: {
          eventName: "Sample Event",
          email: "member@example.com",
          role: "Staff",
        },
      };

      const { eventName, email, role } = res.data;
      const p: MemberPrefill = { event_id, member_id, eventName, email, role };
      setPrefill(p);
      return p;
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Lookup failed";
      setErr(msg);
      setPrefill(null);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const eid = params.get("event_id");
    const mid = params.get("member_id");
    if (!eid || !mid) return;

    (async () => {
      try {
        await lookup(eid, mid);
      } catch {}
    })();
  }, [params, lookup]);

  const fromInviteLink = !!(params.get("event_id") && params.get("member_id"));

  return { prefill, loading, err, lookup, fromInviteLink };
}
