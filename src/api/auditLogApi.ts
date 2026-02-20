import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";

export type AuditLog = {
  id: number;
  traceId: string;
  userId: number;
  userIp: string;
  userAgent: string;
  module: string;
  operation: string;
  type: number;
  method: string;
  requestUrl: string;
  requestBody: string;
  targetType: string;
  targetId: string;
  beforeData: string;
  afterData: string;
  resultCode: number;
  resultMsg: string;
  duration: number;
  extra: string;
  createTime: string;
};

export type AuditLogQuery = {
  userId?: number;
  module?: string;
  type?: number;
  operation?: string;
  targetType?: string;
  startTime?: string;
  endTime?: string;
  pageNo?: number;
  pageSize?: number;
};

export type AuditLogPage = {
  list: AuditLog[];
  total: number;
};

export async function getAuditLogs(
  params: AuditLogQuery
): Promise<AuditLogPage> {
  const res = await http.get("/users/audit-logs", { params });
  return unwrap<AuditLogPage>(res.data);
}
