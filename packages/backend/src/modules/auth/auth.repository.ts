import type { DatabaseService } from "../../common/database";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

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

  public async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.db.query("update users set password_hash = $2 where id = $1", [
      userId,
      passwordHash
    ]);
  }
}
