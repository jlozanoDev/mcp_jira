import type { IJiraRepository, ITempoRepository, JqlSearchParams, CreateIssueParams, LogTimeParams } from "../../src/domain/interfaces.js";
import type { JiraIssue, Transition, Worklog, JiraComment } from "../../src/domain/entities.js";

export function createMockJiraRepository(): IJiraRepository {
  return {
    searchJql: async (_params: JqlSearchParams) => [],
    getAssignedIssues: async (_projectKey?: string, _status?: string, _limit?: number) => [],
    getIssueDetails: async (_issueKey: string) => ({ id: "", key: "", summary: "", description: null, status: "", statusCategory: "", priority: "", assignee: null, reporter: null, projectKey: "", projectName: "", issueType: "", labels: [], created: "", updated: "", dueDate: null, epicKey: null, parent: null, subtasks: [], comments: [], links: [], timeOriginalEstimate: null, timeRemainingEstimate: null, timeSpent: null }),
    createIssue: async (_params: CreateIssueParams) => ({ key: "TEST-1", id: "100" }),
    createSubtask: async (_parentIssueKey: string, _summary: string, _description: string) => ({ key: "TEST-2", id: "101" }),
    updateIssue: async (_issueKey: string, _fields: Record<string, unknown>) => {},
    assignIssue: async (_issueKey: string, _accountId: string | null) => {},
    addComment: async (_issueKey: string, _body: string): Promise<JiraComment> => ({ id: "1", author: { accountId: "user1", displayName: "Test User", emailAddress: "test@test.com", active: true }, body: _body, created: new Date().toISOString(), updated: new Date().toISOString() }),
    getTransitions: async (_issueKey: string): Promise<Transition[]> => [{ id: "11", name: "In Progress", toStatus: "In Progress", toStatusCategory: "In Progress" }, { id: "21", name: "Done", toStatus: "Done", toStatusCategory: "Done" }],
    transitionIssue: async (_issueKey: string, _transitionId: string) => {},
    getActiveSprintIssues: async (_boardId: number, _status?: string) => [],
  };
}

export function createMockTempoRepository(): ITempoRepository {
  return {
    logTime: async (params: LogTimeParams): Promise<Worklog> => ({
      id: 1,
      issueKey: params.issueKey,
      timeSpentSeconds: params.timeSpentSeconds,
      description: params.description,
      startDate: params.startDate,
      startTime: "10:00:00",
      author: { accountId: "user1", displayName: "Test User", emailAddress: "test@test.com", active: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    getUserWorklogs: async (_fromDate: string, _toDate: string): Promise<Worklog[]> => [
      { id: 1, issueKey: "TEST-1", timeSpentSeconds: 3600, description: "Test work", startDate: "2025-01-01", startTime: "10:00:00", author: { accountId: "user1", displayName: "Test User", emailAddress: "test@test.com", active: true }, createdAt: "", updatedAt: "" },
    ],
  };
}
