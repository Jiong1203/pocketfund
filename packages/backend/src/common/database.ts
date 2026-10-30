import { Client, type QueryResult, type QueryResultRow } from "pg";

// One client per request/cron run. Hyperdrive pools the real connections, so connecting is cheap.
// The connection is opened lazily so routes that never touch the DB (e.g. /health) skip it.
export class DatabaseService {
  private client: Client | null = null;
  private connecting: Promise<Client> | null = null;

  public constructor(private readonly connectionString: string) {}

  public async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    const client = await this.getClient();
    return client.query<T>(sql, params);
  }

  public async close(): Promise<void> {
    if (!this.connecting) return;
    const client = await this.connecting.catch(() => null);
    this.client = null;
    this.connecting = null;
    await client?.end();
  }

  private getClient(): Promise<Client> {
    if (this.client) return Promise.resolve(this.client);
    if (!this.connecting) {
      const client = new Client({ connectionString: this.connectionString });
      this.connecting = client.connect().then(() => {
        this.client = client;
        return client;
      });
    }
    return this.connecting;
  }
}
