export enum Role {
  PUBLIC = 'PUBLIC',
  VOLUNTEER = 'VOLUNTEER',
  ADMIN = 'ADMIN'
}

export enum IssueType {
  MEDICAL = 'MEDICAL',
  FIRE = 'FIRE',
  CROWD = 'CROWD',
  SUPPLIES = 'SUPPLIES',
  OTHER = 'OTHER'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  RESOLVED = 'RESOLVED'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Report {
  id: string;
  type: IssueType;
  description: string;
  location: Coordinates;
  status: ReportStatus;
  timestamp: number;
  assignedVolunteerId?: string;
  aiSeverityScore?: number; // 1-10
  locationContext?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  location: Coordinates;
  isOnline: boolean;
  currentTaskId?: string;
  hasNewAssignment?: boolean;
  skills: string[];
}

export interface Prediction {
  id: string;
  location: Coordinates;
  radius: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AiSummary {
  summary: string;
  urgentCount: number;
  trend: string;
}

export type NotificationType = 'alert' | 'info' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

export type AlertTone = 'default' | 'chime' | 'siren' | 'silent';

export interface VolunteerSettings {
  newTaskTone: AlertTone;
  criticalAlertTone: AlertTone;
}