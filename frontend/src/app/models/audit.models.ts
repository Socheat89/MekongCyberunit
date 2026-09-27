export interface AuditLog {
  id: number;
  userId?: number | null;
  username?: string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  description: string;
  detailsJson?: string | null;
  ipAddress?: string | null;
  createdAtUtc: string;
}
