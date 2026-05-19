import type { IJiraRepository } from "../domain/interfaces.js";

export class AssignIssueUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { issueKey: string; accountId: string | null }): Promise<void> {
    return this.repo.assignIssue(input.issueKey, input.accountId);
  }
}
