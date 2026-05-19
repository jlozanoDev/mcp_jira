import type { IJiraRepository } from "../domain/interfaces.js";
import type { Transition } from "../domain/entities.js";

export class GetTransitionsUseCase {
  constructor(private repo: IJiraRepository) {}

  async execute(input: { issueKey: string }): Promise<Transition[]> {
    return this.repo.getTransitions(input.issueKey);
  }
}
