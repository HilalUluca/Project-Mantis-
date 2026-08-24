export type RiskCategory = 'contract' | 'financial' | 'dependency' | 'workplace';
export type RiskSeverity = 'High' | 'Medium' | 'Low' | 'Critical';

export interface RiskFinding {
  id: string;
  documentId: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  description: string;
  status: 'Open' | 'In Review' | 'Resolved';
  detectedAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: string;
  path: string;
  processedAt: string;
  status: 'Verified' | 'Pending' | 'Anomaly' | 'Analyzing';
}

export interface TeamEvent {
  id: string;
  employeeName: string;
  department: string;
  eventType: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  level: 'SYS' | 'AI' | 'WARN' | 'ERROR';
  message: string;
  timestamp: string;
  sourceModule: string;
}