import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuditLogs,
  type AuditLog,
  type AuditLogQuery,
} from "@/api/auditLogApi";

export type UseAuditLogsType = {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

export function useAuditLogs(params: AuditLogQuery): UseAuditLogsType {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auditLogs", params],
    queryFn: () => getAuditLogs(params),
    refetchOnWindowFocus: false,
  });

  const onRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
  };

  return {
    logs: query.data?.list ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading || query.isFetching,
    error: query.error ? query.error.message : null,
    onRefresh,
  };
}
