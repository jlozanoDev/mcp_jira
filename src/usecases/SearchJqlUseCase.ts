import type { IJiraRepository, JqlSearchParams } from "../domain/interfaces.js";
import type { JiraIssue } from "../domain/entities.js";

export class SearchJqlUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(params: JqlSearchParams): Promise<JiraIssue[]> {
    return this.repo.searchJql(params);
  }
}
