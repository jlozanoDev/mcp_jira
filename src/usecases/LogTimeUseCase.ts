import type { ITempoRepository, LogTimeParams } from "../domain/interfaces.js";
import type { Worklog } from "../domain/entities.js";

export class LogTimeUseCase {
  constructor(private repo: ITempoRepository) {}

  async execute(params: LogTimeParams): Promise<Worklog> {
    return this.repo.logTime(params);
  }
}
