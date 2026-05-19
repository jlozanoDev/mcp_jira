import axios, { AxiosInstance, AxiosError } from "axios";
import type { ITempoRepository, LogTimeParams } from "../domain/interfaces.js";
import type { Worklog } from "../domain/entities.js";
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError, RateLimitError, AppError } from "./errors.js";

export class TempoClient implements ITempoRepository {
  private api: AxiosInstance;

  constructor(apiToken: string) {
    this.api = axios.create({
      baseURL: "https://api.tempo.io/4",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });

    this.api.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => this.handleError(error),
    );
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown> | undefined;
      const msg = (data?.message as string) || (data?.error as string) || error.message;

      switch (status) {
        case 401: throw new AuthenticationError(msg, "Tempo");
        case 403: throw new AuthorizationError(msg, "Tempo");
        case 404: throw new NotFoundError(msg, "Tempo");
        case 429: throw new RateLimitError(msg, "Tempo");
        default: throw new AppError(msg, status, "Tempo");
      }
    }
    throw new AppError(error.message, undefined, "Tempo");
  }

  async logTime(params: LogTimeParams): Promise<Worklog> {
    const { data } = await this.api.post("/worklogs", {
      issueKey: params.issueKey,
      timeSpentSeconds: params.timeSpentSeconds,
      startDate: params.startDate,
      startTime: "10:00:00",
      description: params.description,
    });
    return this.mapWorklog(data);
  }

  async getUserWorklogs(fromDate: string, toDate: string): Promise<Worklog[]> {
    const allWorklogs: Worklog[] = [];
    let offset = 0;

    while (true) {
      const { data } = await this.api.get("/worklogs", {
        params: { from: fromDate, to: toDate, offset, limit: 100 },
      });

      const results = data.results as Record<string, unknown>[];
      for (const wl of results) {
        allWorklogs.push(this.mapWorklog(wl));
      }

      if (results.length < 100) break;
      offset += results.length;
    }

    return allWorklogs;
  }

  private mapWorklog(data: Record<string, unknown>): Worklog {
    const authorObj = data.author as Record<string, unknown> | undefined;
    return {
      id: data.id as number,
      issueKey: data.issueKey as string || ((data.issue as Record<string, unknown>)?.key as string) || "",
      timeSpentSeconds: data.timeSpentSeconds as number,
      description: data.description as string || "",
      startDate: data.startDate as string,
      startTime: data.startTime as string || "10:00:00",
      author: {
        accountId: authorObj?.accountId as string || "",
        displayName: authorObj?.displayName as string || "Unknown",
        emailAddress: authorObj?.emailAddress as string || "",
        active: true,
      },
      createdAt: data.createdAt as string || "",
      updatedAt: data.updatedAt as string || "",
    };
  }
}
