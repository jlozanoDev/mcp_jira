export function createMockJiraRepository() {
    return {
        searchJql: async (_params) => [],
        getAssignedIssues: async (_projectKey, _status, _limit) => [],
        getIssueDetails: async (_issueKey) => ({ id: "", key: "", summary: "", description: null, status: "", statusCategory: "", priority: "", assignee: null, reporter: null, projectKey: "", projectName: "", issueType: "", labels: [], created: "", updated: "", dueDate: null, epicKey: null, parent: null, subtasks: [], comments: [], links: [], timeOriginalEstimate: null, timeRemainingEstimate: null, timeSpent: null }),
        createIssue: async (_params) => ({ key: "TEST-1", id: "100" }),
        createSubtask: async (_parentIssueKey, _summary, _description) => ({ key: "TEST-2", id: "101" }),
        updateIssue: async (_issueKey, _fields) => { },
        assignIssue: async (_issueKey, _accountId) => { },
        addComment: async (_issueKey, _body) => ({ id: "1", author: { accountId: "user1", displayName: "Test User", emailAddress: "test@test.com", active: true }, body: _body, created: new Date().toISOString(), updated: new Date().toISOString() }),
        getTransitions: async (_issueKey) => [{ id: "11", name: "In Progress", toStatus: "In Progress", toStatusCategory: "In Progress" }, { id: "21", name: "Done", toStatus: "Done", toStatusCategory: "Done" }],
        transitionIssue: async (_issueKey, _transitionId) => { },
        getActiveSprintIssues: async (_boardId, _status) => [],
    };
}
export function createMockTempoRepository() {
    return {
        logTime: async (params) => ({
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
        getUserWorklogs: async (_fromDate, _toDate) => [
            { id: 1, issueKey: "TEST-1", timeSpentSeconds: 3600, description: "Test work", startDate: "2025-01-01", startTime: "10:00:00", author: { accountId: "user1", displayName: "Test User", emailAddress: "test@test.com", active: true }, createdAt: "", updatedAt: "" },
        ],
    };
}
//# sourceMappingURL=repositories.js.map