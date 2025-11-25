import { JsonEmailRepository, JsonPromptRepository, JsonDraftRepository } from "./repos/json";
import { IEmailRepository, IPromptRepository, IDraftRepository } from "./repos/types";

class Database {
  private static instance: Database;
  public emails: IEmailRepository;
  public prompts: IPromptRepository;
  public drafts: IDraftRepository;

  private constructor() {
    // In the future, we can switch based on env var
    this.emails = new JsonEmailRepository();
    this.prompts = new JsonPromptRepository();
    this.drafts = new JsonDraftRepository();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

export const db = Database.getInstance();
