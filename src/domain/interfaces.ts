import type { JiraIssue, Transition, Sprint, Worklog, JiraUser, JiraComment } from "./entities.js";

export interface JqlSearchParams {
  jql: string;
  limit?: number;
  fields?: string[];
}

export interface CreateIssueParams {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
  priority?: string;
  labels?: string[];
  epicKey?: string;
}

export interface UpdateIssueParams {
  issueKey: string;
  fields: Record<string, unknown>;
}

export interface LogTimeParams {
  issueKey: string;
  timeSpentSeconds: number;
  startDate: string;
  description: string;
}

export interface IJiraRepository {
  searchJql(params: JqlSearchParams): Promise<JiraIssue[]>;
  getAssignedIssues(projectKey?: string, status?: string, limit?: number): Promise<JiraIssue[]>;
  getIssueDetails(issueKey: string): Promise<JiraIssue>;
  createIssue(params: CreateIssueParams): Promise<{ key: string; id: string }>;
  createSubtask(parentIssueKey: string, summary: string, description: string): Promise<{ key: string; id: string }>;
  updateIssue(issueKey: string, fields: Record<string, unknown>): Promise<void>;
  assignIssue(issueKey: string, accountId: string | null): Promise<void>;
  addComment(issueKey: string, body: string): Promise<JiraComment>;
  getTransitions(issueKey: string): Promise<Transition[]>;
  transitionIssue(issueKey: string, transitionId: string): Promise<void>;
  getActiveSprintIssues(boardId: number, status?: string): Promise<JiraIssue[]>;
}

export interface ITempoRepository {
  logTime(params: LogTimeParams): Promise<Worklog>;
  getUserWorklogs(fromDate: string, toDate: string): Promise<Worklog[]>;
}
