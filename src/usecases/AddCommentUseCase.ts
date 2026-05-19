import type { IJiraRepository } from "../domain/interfaces.js";
import type { JiraComment } from "../domain/entities.js";

export class AddCommentUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { issueKey: string; commentBody: string }): Promise<JiraComment> {
    return this.repo.addComment(input.issueKey, input.commentBody);
  }
}
