import type { IJiraRepository } from "../domain/interfaces.js";

export class UpdateIssueUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { issueKey: string; fields: Record<string, unknown> }): Promise<void> {
    return this.repo.updateIssue(input.issueKey, input.fields);
  }
}
