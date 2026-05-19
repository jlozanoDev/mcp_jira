import type { IJiraRepository } from "../domain/interfaces.js";
import type { JiraIssue } from "../domain/entities.js";

export class GetIssueDetailsUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { issueKey: string }): Promise<JiraIssue> {
    return this.repo.getIssueDetails(input.issueKey);
  }
}
