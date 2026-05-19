import axios, { AxiosInstance, AxiosError } from "axios";
import type { IJiraRepository, JqlSearchParams, CreateIssueParams } from "../domain/interfaces.js";
import type { JiraIssue, Transition, Sprint, JiraComment } from "../domain/entities.js";
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError, RateLimitError, AppError } from "./errors.js";

export class JiraClient implements IJiraRepository {
  private api: AxiosInstance;
  private agileApi: AxiosInstance;

  constructor(baseUrl: string, email: string, apiToken: string) {
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
    const headers = {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    this.api = axios.create({
      baseURL: baseUrl.replace(/\/$/, "") + "/rest/api/3",
      headers,
      timeout: 30000,
    });

    this.agileApi = axios.create({
      baseURL: baseUrl.replace(/\/$/, "") + "/rest/agile/1.0",
      headers,
      timeout: 30000,
    });

    this.api.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => this.handleError(error, "Jira"),
    );

    this.agileApi.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => this.handleError(error, "Jira"),
    );
  }

  private handleError(error: AxiosError, source: string): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown> | undefined;
      const messages = data?.errorMessages || data?.message || error.message;
      const msg = Array.isArray(messages) ? messages.join("; ") : String(messages);

      switch (status) {
        case 401: throw new AuthenticationError(msg, source);
        case 403: throw new AuthorizationError(msg, source);
        case 404: throw new NotFoundError(msg, source);
        case 429: throw new RateLimitError(msg, source);
        default: throw new AppError(msg, status, source);
      }
    }
    throw new AppError(error.message, undefined, source);
  }

  async searchJql(params: JqlSearchParams): Promise<JiraIssue[]> {
    const { jql, limit = 50, fields } = params;
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = Math.min(limit, 100);

    while (startAt < limit) {
      const body: Record<string, unknown> = {
        jql,
        maxResults: Math.min(limit - startAt, maxResults),
        startAt,
      };
      if (fields && fields.length > 0) {
        body.fields = fields;
      }

      const { data } = await this.api.post("/search/jql", body);

      for (const issue of data.issues as Record<string, unknown>[]) {
        allIssues.push(this.mapIssue(issue));
      }

      if (data.issues.length === 0 || data.issues.length < maxResults) break;
      startAt += data.issues.length;
    }

    return allIssues;
  }

  async getAssignedIssues(projectKey?: string, status?: string, limit = 20): Promise<JiraIssue[]> {
    let jql = "assignee = currentUser() AND resolution = Unresolved";
    if (projectKey) jql += ` AND project = "${projectKey}"`;
    if (status) jql += ` AND status = "${status}"`;
    jql += " ORDER BY priority DESC, updated DESC";
    return this.searchJql({ jql, limit });
  }

  async getIssueDetails(issueKey: string): Promise<JiraIssue> {
    const { data } = await this.api.get(`/issue/${issueKey}`, {
      params: {
        expand: "renderedFields,transitions,comments,subtasks,issuelinks",
      },
    });
    return this.mapIssue(data);
  }

  async createIssue(params: CreateIssueParams): Promise<{ key: string; id: string }> {
    const fields: Record<string, unknown> = {
      project: { key: params.projectKey },
      summary: params.summary,
      description: params.description ? { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: params.description }] }] } : undefined,
      issuetype: { name: params.issueType },
    };

    if (params.priority) fields.priority = { name: params.priority };
    if (params.labels && params.labels.length > 0) fields.labels = params.labels;
    if (params.epicKey) fields.customfield_10014 = params.epicKey;

    const { data } = await this.api.post("/issue", { fields });
    return { key: data.key as string, id: data.id as string };
  }

  async createSubtask(parentIssueKey: string, summary: string, description: string): Promise<{ key: string; id: string }> {
    const { data: parent } = await this.api.get(`/issue/${parentIssueKey}`, {
      params: { fields: "project,issuetype" },
    });
    const parentFields = parent.fields as Record<string, unknown>;
    const projectKey = (parentFields.project as Record<string, unknown>).key as string;

    const fields: Record<string, unknown> = {
      project: { key: projectKey },
      summary,
      description: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: description }] }] },
      issuetype: { name: "Subtask" },
      parent: { key: parentIssueKey },
    };

    const { data } = await this.api.post("/issue", { fields });
    return { key: data.key as string, id: data.id as string };
  }

  async updateIssue(issueKey: string, fields: Record<string, unknown>): Promise<void> {
    await this.api.put(`/issue/${issueKey}`, { fields });
  }

  async assignIssue(issueKey: string, accountId: string | null): Promise<void> {
    const body = accountId ? { accountId } : { accountId: null };
    await this.api.put(`/issue/${issueKey}/assignee`, body);
  }

  async addComment(issueKey: string, body: string): Promise<JiraComment> {
    const { data } = await this.api.post(`/issue/${issueKey}/comment`, {
      body: {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: body }] }],
      },
    });
    return this.mapComment(data);
  }

  async getTransitions(issueKey: string): Promise<Transition[]> {
    const { data } = await this.api.get(`/issue/${issueKey}/transitions`);
    return (data.transitions as Record<string, unknown>[]).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      toStatus: (t.to as Record<string, unknown>).name as string,
      toStatusCategory: ((t.to as Record<string, unknown>).statusCategory as Record<string, unknown>).name as string,
    }));
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    await this.api.post(`/issue/${issueKey}/transitions`, {
      transition: { id: transitionId },
    });
  }

  async getActiveSprintIssues(boardId: number, status?: string): Promise<JiraIssue[]> {
    const { data: sprintsData } = await this.agileApi.get(`/board/${boardId}/sprint`, {
      params: { state: "active" },
    });

    const sprints = sprintsData.values as Record<string, unknown>[];
    if (sprints.length === 0) return [];

    const sprintId = sprints[0].id as number;
    let jql = `sprint = ${sprintId}`;
    if (status) jql += ` AND status = "${status}"`;

    return this.searchJql({ jql, limit: 100 });
  }

  private mapIssue(data: Record<string, unknown>): JiraIssue {
    const fields = data.fields as Record<string, unknown> | undefined;
    const f = (name: string) => (fields ? (fields[name] as Record<string, unknown> | undefined) : undefined);
    const s = (name: string) => (fields ? (fields[name] as string | undefined) : undefined);

    const statusObj = f("status");
    const priorityObj = f("priority");
    const assigneeObj = f("assignee");
    const reporterObj = f("reporter");
    const projectObj = f("project");
    const issueTypeObj = f("issuetype");
    const parentObj = f("parent");
    const timeTracking = f("timetracking");

    return {
      id: data.id as string,
      key: data.key as string,
      summary: s("summary") || "",
      description: s("description") || null,
      status: (statusObj?.name as string) || "",
      statusCategory: ((statusObj?.statusCategory as Record<string, unknown>)?.name as string) || "",
      priority: (priorityObj?.name as string) || "None",
      assignee: assigneeObj ? this.mapUser(assigneeObj) : null,
      reporter: reporterObj ? this.mapUser(reporterObj) : null,
      projectKey: (projectObj?.key as string) || "",
      projectName: (projectObj?.name as string) || "",
      issueType: (issueTypeObj?.name as string) || "",
      labels: (fields?.labels as string[]) || [],
      created: s("created") || "",
      updated: s("updated") || "",
      dueDate: s("duedate") || null,
      epicKey: s("customfield_10014") || null,
      parent: parentObj ? { key: parentObj.key as string, summary: (parentObj.fields as Record<string, unknown>)?.summary as string || "" } : null,
      subtasks: ((fields?.subtasks as Record<string, unknown>[]) || []).map((st) => ({
        key: st.key as string,
        summary: ((st.fields as Record<string, unknown>)?.summary as string) || "",
        status: (((st.fields as Record<string, unknown>)?.status as Record<string, unknown>)?.name as string) || "",
      })),
      comments: ((fields?.comment as Record<string, unknown>)?.comments as Record<string, unknown>[])?.map((c) => this.mapComment(c)) || [],
      links: ((fields?.issuelinks as Record<string, unknown>[]) || []).map((l) => ({
        type: ((l.type as Record<string, unknown>)?.name as string) || (l.type as string) || "",
        outwardIssue: l.outwardIssue ? { key: (l.outwardIssue as Record<string, unknown>).key as string, summary: ((l.outwardIssue as Record<string, unknown>).fields as Record<string, unknown>)?.summary as string } : undefined,
        inwardIssue: l.inwardIssue ? { key: (l.inwardIssue as Record<string, unknown>).key as string, summary: ((l.inwardIssue as Record<string, unknown>).fields as Record<string, unknown>)?.summary as string } : undefined,
      })),
      timeOriginalEstimate: (timeTracking?.originalEstimate as string) || null,
      timeRemainingEstimate: (timeTracking?.remainingEstimate as string) || null,
      timeSpent: (timeTracking?.timeSpent as string) || null,
    };
  }

  private mapUser(data: Record<string, unknown>): JiraIssue["assignee"] {
    if (!data) return null;
    return {
      accountId: data.accountId as string,
      displayName: data.displayName as string,
      emailAddress: data.emailAddress as string,
      active: data.active as boolean,
    };
  }

  private mapComment(data: Record<string, unknown>): JiraComment {
    const authorObj = data.author as Record<string, unknown> | undefined;
    const updateAuthorObj = data.updateAuthor as Record<string, unknown> | undefined;
    return {
      id: data.id as string,
      author: authorObj ? this.mapUser(authorObj)! : (updateAuthorObj ? this.mapUser(updateAuthorObj)! : { accountId: "", displayName: "Unknown", emailAddress: "", active: false }),
      body: ((data.body as Record<string, unknown>)?.content as Record<string, unknown>[])?.map((c) =>
        ((c.content as Record<string, unknown>[]) || []).map((t) => t.text as string).join("")
      ).join("\n") || "",
      created: data.created as string,
      updated: data.updated as string,
    };
  }
}
