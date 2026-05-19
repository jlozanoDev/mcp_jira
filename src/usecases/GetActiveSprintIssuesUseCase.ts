import type { IJiraRepository } from "../domain/interfaces.js";
import type { JiraIssue } from "../domain/entities.js";

export class GetActiveSprintIssuesUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { boardId: number; status?: string }): Promise<JiraIssue[]> {
    return this.repo.getActiveSprintIssues(input.boardId, input.status);
  }
}
