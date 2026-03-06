import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

@Injectable()
export class AuthRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async createUser(email: string, passwordHash: string): Promise<UserRow> {
    const result = await this.db.query<UserRow>(
      `
      insert into users (email, password_hash)
      values ($1, $2)
      returning id, email, password_hash, created_at
      `,
      [email.toLowerCase(), passwordHash]
    );
    return result.rows[0];
  }

  public async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      `
      select id, email, password_hash, created_at
      from users
      where email = $1
      limit 1
      `,
      [email.toLowerCase()]
    );
    return result.rows[0] ?? null;
  }
}
