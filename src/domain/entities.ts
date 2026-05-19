export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  active: boolean;
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string;
  created: string;
  updated: string;
}

export interface JiraIssueLink {
  type: string;
  outwardIssue?: { key: string; summary: string };
  inwardIssue?: { key: string; summary: string };
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string | null;
  status: string;
  statusCategory: string;
  priority: string;
  assignee: JiraUser | null;
  reporter: JiraUser | null;
  projectKey: string;
  projectName: string;
  issueType: string;
  labels: string[];
  created: string;
  updated: string;
  dueDate: string | null;
  epicKey: string | null;
  parent: { key: string; summary: string } | null;
  subtasks: { key: string; summary: string; status: string }[];
  comments: JiraComment[];
  links: JiraIssueLink[];
  timeOriginalEstimate: string | null;
  timeRemainingEstimate: string | null;
  timeSpent: string | null;
}

export interface Transition {
  id: string;
  name: string;
  toStatus: string;
  toStatusCategory: string;
}

export interface Sprint {
  id: number;
  name: string;
  state: string;
  boardId: number;
  startDate: string;
  endDate: string;
  goal: string;
}

export interface Worklog {
  id: number;
  issueKey: string;
  timeSpentSeconds: number;
  description: string;
  startDate: string;
  startTime: string;
  author: JiraUser;
  createdAt: string;
  updatedAt: string;
}
