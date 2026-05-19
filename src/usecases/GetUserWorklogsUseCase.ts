import type { ITempoRepository } from "../domain/interfaces.js";
import type { Worklog } from "../domain/entities.js";

export class GetUserWorklogsUseCase {
  constructor(private repo: ITempoRepository) {}

  async execute(input: { fromDate: string; toDate: string }): Promise<Worklog[]> {
    return this.repo.getUserWorklogs(input.fromDate, input.toDate);
  }
}
