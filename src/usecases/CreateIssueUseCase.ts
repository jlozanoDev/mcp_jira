import type { IJiraRepository, CreateIssueParams } from "../domain/interfaces.js";

export class CreateIssueUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(params: CreateIssueParams): Promise<{ key: string; id: string }> {
    return this.repo.createIssue(params);
  }
}
