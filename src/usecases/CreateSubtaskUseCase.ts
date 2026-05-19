import type { IJiraRepository } from "../domain/interfaces.js";

export class CreateSubtaskUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { parentIssueKey: string; summary: string; description: string }): Promise<{ key: string; id: string }> {
    return this.repo.createSubtask(input.parentIssueKey, input.summary, input.description);
  }
}
