import type { IJiraRepository } from "../domain/interfaces.js";
import type { JiraIssue } from "../domain/entities.js";

export interface GetAssignedIssuesInput {
  projectKey?: string;
  status?: string;
  limit?: number;
}

export class GetAssignedIssuesUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: GetAssignedIssuesInput): Promise<JiraIssue[]> {
    return this.repo.getAssignedIssues(input.projectKey, input.status, input.limit);
  }
}
