import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { createMockJiraRepository, createMockTempoRepository } from "./__mocks__/repositories.js";
import { SearchJqlUseCase } from "../src/usecases/SearchJqlUseCase.js";
import { GetAssignedIssuesUseCase } from "../src/usecases/GetAssignedIssuesUseCase.js";
import { GetIssueDetailsUseCase } from "../src/usecases/GetIssueDetailsUseCase.js";
import { CreateIssueUseCase } from "../src/usecases/CreateIssueUseCase.js";
import { CreateSubtaskUseCase } from "../src/usecases/CreateSubtaskUseCase.js";
import { UpdateIssueUseCase } from "../src/usecases/UpdateIssueUseCase.js";
import { AssignIssueUseCase } from "../src/usecases/AssignIssueUseCase.js";
import { AddCommentUseCase } from "../src/usecases/AddCommentUseCase.js";
import { GetTransitionsUseCase } from "../src/usecases/GetTransitionsUseCase.js";
import { TransitionIssueUseCase } from "../src/usecases/TransitionIssueUseCase.js";
import { GetActiveSprintIssuesUseCase } from "../src/usecases/GetActiveSprintIssuesUseCase.js";
import { LogTimeUseCase } from "../src/usecases/LogTimeUseCase.js";
import { GetUserWorklogsUseCase } from "../src/usecases/GetUserWorklogsUseCase.js";
describe("Jira Use Cases", () => {
    let jiraRepo;
    before(() => {
        jiraRepo = createMockJiraRepository();
    });
    it("SearchJqlUseCase - delegates JQL search", async () => {
        const uc = new SearchJqlUseCase(jiraRepo);
        const result = await uc.execute({ jql: "project = TEST", limit: 10, fields: ["summary", "status"] });
        assert.ok(Array.isArray(result));
    });
    it("GetAssignedIssuesUseCase - filters by project and status", async () => {
        const uc = new GetAssignedIssuesUseCase(jiraRepo);
        const result = await uc.execute({ projectKey: "TEST", status: "In Progress", limit: 5 });
        assert.ok(Array.isArray(result));
    });
    it("GetIssueDetailsUseCase - returns issue by key", async () => {
        const uc = new GetIssueDetailsUseCase(jiraRepo);
        const result = await uc.execute({ issueKey: "TEST-1" });
        assert.ok(typeof result.key === "string");
    });
    it("CreateIssueUseCase - creates and returns key+id", async () => {
        const uc = new CreateIssueUseCase(jiraRepo);
        const result = await uc.execute({ projectKey: "TEST", summary: "Test", description: "Desc", issueType: "Task" });
        assert.equal(result.key, "TEST-1");
        assert.equal(result.id, "100");
    });
    it("CreateSubtaskUseCase - creates subtask", async () => {
        const uc = new CreateSubtaskUseCase(jiraRepo);
        const result = await uc.execute({ parentIssueKey: "TEST-1", summary: "Sub", description: "Desc" });
        assert.equal(result.key, "TEST-2");
    });
    it("UpdateIssueUseCase - updates issue fields", async () => {
        const uc = new UpdateIssueUseCase(jiraRepo);
        await uc.execute({ issueKey: "TEST-1", fields: { summary: "Updated" } });
        assert.ok(true);
    });
    it("AssignIssueUseCase - assigns and unassigns", async () => {
        const uc = new AssignIssueUseCase(jiraRepo);
        await uc.execute({ issueKey: "TEST-1", accountId: "user123" });
        await uc.execute({ issueKey: "TEST-1", accountId: null });
        assert.ok(true);
    });
    it("AddCommentUseCase - adds comment", async () => {
        const uc = new AddCommentUseCase(jiraRepo);
        const result = await uc.execute({ issueKey: "TEST-1", commentBody: "Hello" });
        assert.equal(result.body, "Hello");
    });
    it("GetTransitionsUseCase - returns transitions list", async () => {
        const uc = new GetTransitionsUseCase(jiraRepo);
        const result = await uc.execute({ issueKey: "TEST-1" });
        assert.ok(result.length >= 2);
        assert.equal(result[0].name, "In Progress");
    });
    it("TransitionIssueUseCase - transitions issue", async () => {
        const uc = new TransitionIssueUseCase(jiraRepo);
        await uc.execute({ issueKey: "TEST-1", transitionId: "11" });
        assert.ok(true);
    });
    it("GetActiveSprintIssuesUseCase - returns sprint issues", async () => {
        const uc = new GetActiveSprintIssuesUseCase(jiraRepo);
        const result = await uc.execute({ boardId: 1 });
        assert.ok(Array.isArray(result));
    });
});
describe("Tempo Use Cases", () => {
    let tempoRepo;
    before(() => {
        tempoRepo = createMockTempoRepository();
    });
    it("LogTimeUseCase - logs time and returns worklog", async () => {
        const uc = new LogTimeUseCase(tempoRepo);
        const result = await uc.execute({ issueKey: "TEST-1", timeSpentSeconds: 3600, startDate: "2025-01-01", description: "Work" });
        assert.equal(result.issueKey, "TEST-1");
        assert.equal(result.timeSpentSeconds, 3600);
    });
    it("GetUserWorklogsUseCase - retrieves worklogs", async () => {
        const uc = new GetUserWorklogsUseCase(tempoRepo);
        const result = await uc.execute({ fromDate: "2025-01-01", toDate: "2025-01-31" });
        assert.ok(result.length > 0);
        assert.equal(result[0].issueKey, "TEST-1");
    });
});
//# sourceMappingURL=use-cases.test.js.map