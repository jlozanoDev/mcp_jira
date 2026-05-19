import type { IJiraRepository } from "../domain/interfaces.js";

export class TransitionIssueUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { issueKey: string; transitionId: string }): Promise<void> {
    return this.repo.transitionIssue(input.issueKey, input.transitionId);
  }
}
