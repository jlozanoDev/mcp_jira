#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { JiraClient } from "./JiraClient.js";
import { TempoClient } from "./TempoClient.js";
import { SearchJqlUseCase } from "../usecases/SearchJqlUseCase.js";
import { GetAssignedIssuesUseCase } from "../usecases/GetAssignedIssuesUseCase.js";
import { GetIssueDetailsUseCase } from "../usecases/GetIssueDetailsUseCase.js";
import { CreateIssueUseCase } from "../usecases/CreateIssueUseCase.js";
import { CreateSubtaskUseCase } from "../usecases/CreateSubtaskUseCase.js";
import { UpdateIssueUseCase } from "../usecases/UpdateIssueUseCase.js";
import { AssignIssueUseCase } from "../usecases/AssignIssueUseCase.js";
import { AddCommentUseCase } from "../usecases/AddCommentUseCase.js";
import { GetTransitionsUseCase } from "../usecases/GetTransitionsUseCase.js";
import { TransitionIssueUseCase } from "../usecases/TransitionIssueUseCase.js";
import { GetActiveSprintIssuesUseCase } from "../usecases/GetActiveSprintIssuesUseCase.js";
import { LogTimeUseCase } from "../usecases/LogTimeUseCase.js";
import { GetUserWorklogsUseCase } from "../usecases/GetUserWorklogsUseCase.js";
import { formatError } from "./errors.js";

function parseDuration(duration: string): number {
  const regex = /^\s*(?:(\d+)\s*h(?:ours?|r)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?\s*$/i;
  const match = duration.match(regex);
  if (!match || (!match[1] && !match[2])) {
    throw new Error(`Invalid duration format: "${duration}". Use format like "2h 30m" or "45m"`);
  }
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 3600 + minutes * 60;
}

const env = (name: string): string => {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
};

async function main() {
  const jiraBaseUrl = env("JIRA_BASE_URL");
  const jiraEmail = env("JIRA_USER_EMAIL");
  const jiraToken = env("JIRA_API_TOKEN");
  const tempoToken = env("TEMPO_API_TOKEN");

  const jiraClient = new JiraClient(jiraBaseUrl, jiraEmail, jiraToken);
  const tempoClient = new TempoClient(tempoToken);

  const searchJql = new SearchJqlUseCase(jiraClient);
  const getAssignedIssues = new GetAssignedIssuesUseCase(jiraClient);
  const getIssueDetails = new GetIssueDetailsUseCase(jiraClient);
  const createIssue = new CreateIssueUseCase(jiraClient);
  const createSubtask = new CreateSubtaskUseCase(jiraClient);
  const updateIssue = new UpdateIssueUseCase(jiraClient);
  const assignIssue = new AssignIssueUseCase(jiraClient);
  const addComment = new AddCommentUseCase(jiraClient);
  const getTransitions = new GetTransitionsUseCase(jiraClient);
  const transitionIssue = new TransitionIssueUseCase(jiraClient);
  const getActiveSprintIssues = new GetActiveSprintIssuesUseCase(jiraClient);
  const logTime = new LogTimeUseCase(tempoClient);
  const getUserWorklogs = new GetUserWorklogsUseCase(tempoClient);

  const server = new McpServer(
    { name: "mcp-jira-tempo", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool("jira_search_jql", {
    description: `Execute an advanced JQL (Jira Query Language) search.
Use this as the primary query tool to find issues by project, status, assignee, text, or any Jira field.
Examples: "project = PROJ AND status = 'In Progress'", "assignee = currentUser() ORDER BY priority DESC"`,
    inputSchema: z.object({
      jql: z.string().describe("Jira Query Language expression"),
      limit: z.number().optional().default(50).describe("Maximum results to return"),
      fields: z.array(z.string()).optional().describe("Fields to return (e.g. summary, status, assignee). Empty returns all."),
    }),
  }, async (args) => {
    const result = await searchJql.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("jira_get_assigned_issues", {
    description: `List issues assigned to the current user that are unresolved, sorted by priority.
Use this to see your own workload or what needs attention. Optionally filter by project or status.`,
    inputSchema: z.object({
      projectKey: z.string().optional().describe("Optional project key to filter (e.g. PROJ)"),
      status: z.string().optional().describe("Optional status to filter (e.g. 'In Progress')"),
      limit: z.number().optional().default(20).describe("Maximum results to return"),
    }),
  }, async (args) => {
    const result = await getAssignedIssues.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("jira_get_issue_details", {
    description: `Get full detail of a single issue including description, comments, subtasks, linked issues, and current status.
Use this when you need comprehensive information about a specific task.`,
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
    }),
  }, async (args) => {
    const result = await getIssueDetails.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("jira_create_issue", {
    description: `Create a new issue (Task, Bug, Story, Epic, etc.) in a Jira project.
Supports setting summary, description, priority, labels, and optionally linking to an epic.`,
    inputSchema: z.object({
      projectKey: z.string().describe("Project key (e.g. PROJ)"),
      summary: z.string().describe("Issue summary / title"),
      description: z.string().describe("Detailed description in plain text"),
      issueType: z.string().describe("Issue type name (e.g. Task, Bug, Story, Epic)"),
      priority: z.string().optional().describe("Priority name (e.g. Highest, High, Medium, Low, Lowest)"),
      labels: z.array(z.string()).optional().describe("Labels to apply"),
      epicKey: z.string().optional().describe("Epic key to link this issue to (e.g. PROJ-50)"),
    }),
  }, async (args) => {
    const result = await createIssue.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("jira_create_subtask", {
    description: `Create a subtask under an existing parent issue. Inherits the project from the parent.
Use this to break down work into smaller, actionable pieces.`,
    inputSchema: z.object({
      parentIssueKey: z.string().describe("Parent issue key (e.g. PROJ-123)"),
      summary: z.string().describe("Subtask summary / title"),
      description: z.string().describe("Subtask detailed description"),
    }),
  }, async (args) => {
    const result = await createSubtask.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("jira_update_issue", {
    description: `Update fields on an existing issue. Supports any Jira field including custom fields.
Pass field values as Jira API expects them (e.g. priority as {"name":"High"}, labels as string[]).`,
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key to update (e.g. PROJ-123)"),
      updateFields: z.object({}).passthrough().describe("Field values to update. Example: {\"summary\":\"New title\", \"priority\":{\"name\":\"High\"}}"),
    }),
  }, async (args) => {
    await updateIssue.execute({ issueKey: args.issueKey, fields: args.updateFields });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, issueKey: args.issueKey }, null, 2) }] };
  });

  server.registerTool("jira_assign_issue", {
    description: `Assign an issue to a user by their Atlassian account ID, or unassign it.
Pass "null" (as string) to unassign the issue.`,
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
      accountId: z.string().describe("Atlassian account ID of the user, or 'null' to unassign"),
    }),
  }, async (args) => {
    const accountId = args.accountId === "null" ? null : args.accountId;
    await assignIssue.execute({ issueKey: args.issueKey, accountId });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, issueKey: args.issueKey, assigned: accountId ? "yes" : "unassigned" }, null, 2) }] };
  });

  server.registerTool("jira_add_comment", {
    description: `Add a plain text comment to a Jira issue. Comments are appended to the issue's comment thread.
Use this for updates, questions, or sharing information with the team.`,
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
      commentBody: z.string().describe("Comment text in plain text format"),
    }),
  }, async (args) => {
    const result = await addComment.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("jira_get_transitions", {
    description: `Get all valid state transitions for an issue based on its current status and project workflow.
Use this before jira_transition_issue to find available transition IDs and names.`,
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
    }),
  }, async (args) => {
    const result = await getTransitions.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("jira_transition_issue", {
    description: `Transition an issue to a new status. Provide the transition ID (from jira_get_transitions) or a transition name like "In Progress", "Done", "Blocked".
If transitionName is given, the server auto-resolves it to a valid transition ID.`,
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key (e.g. PROJ-123)"),
      transitionId: z.string().optional().describe("Transition ID from jira_get_transitions"),
      transitionName: z.string().optional().describe("Transition name as alternative to ID (e.g. 'In Progress', 'Done')"),
    }),
  }, async (args) => {
    let transitionId = args.transitionId;
    if (!transitionId && args.transitionName) {
      const transitions = await getTransitions.execute({ issueKey: args.issueKey });
      const match = transitions.find(
        (t) => t.name.toLowerCase() === args.transitionName!.toLowerCase()
          || t.toStatus.toLowerCase() === args.transitionName!.toLowerCase(),
      );
      if (!match) {
        const available = transitions.map((t) => `"${t.name}"`).join(", ");
        throw new Error(`Transition "${args.transitionName}" not found. Available: ${available}`);
      }
      transitionId = match.id;
    }
    if (!transitionId) throw new Error("transitionId or transitionName is required");
    await transitionIssue.execute({ issueKey: args.issueKey, transitionId });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, issueKey: args.issueKey }, null, 2) }] };
  });

  server.registerTool("jira_get_active_sprint_issues", {
    description: `Get all issues in the currently active sprint of a board.
Requires the Board ID (numeric, found in the Jira board URL). Use for sprint planning and progress tracking.`,
    inputSchema: z.object({
      boardId: z.number().int().describe("Jira board ID (numeric, from the board URL)"),
      status: z.string().optional().describe("Optional status filter (e.g. 'In Progress')"),
    }),
  }, async (args) => {
    const result = await getActiveSprintIssues.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("tempo_log_time", {
    description: `Log work hours against a Jira issue using Tempo Timesheets.
Supports either timeSpentSeconds or a human-readable duration string like "2h 30m".`,
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key to log time against (e.g. PROJ-123)"),
      timeSpentSeconds: z.number().optional().describe("Time spent in seconds (alternative to duration)"),
      duration: z.string().optional().describe("Human-readable duration (e.g. '2h 30m', '45m'). Alternative to timeSpentSeconds."),
      startDate: z.string().describe("Date of work in YYYY-MM-DD format"),
      description: z.string().describe("Description of the work performed"),
    }),
  }, async (args) => {
    let timeSpentSeconds: number;
    if (args.timeSpentSeconds !== undefined && args.timeSpentSeconds > 0) {
      timeSpentSeconds = args.timeSpentSeconds;
    } else if (args.duration) {
      timeSpentSeconds = parseDuration(args.duration);
    } else {
      throw new Error("Either timeSpentSeconds or duration (e.g. '2h 30m') is required");
    }
    const result = await logTime.execute({ issueKey: args.issueKey, timeSpentSeconds, startDate: args.startDate, description: args.description });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("tempo_get_user_worklogs", {
    description: `Retrieve your worklogs within a date range from Tempo Timesheets.
Use this to verify logged hours, check what was worked on, or prepare time reports.`,
    inputSchema: z.object({
      fromDate: z.string().describe("Start date in YYYY-MM-DD format"),
      toDate: z.string().describe("End date in YYYY-MM-DD format"),
    }),
  }, async (args) => {
    const result = await getUserWorklogs.execute(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Jira Tempo server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
