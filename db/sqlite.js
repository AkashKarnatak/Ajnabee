import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

class SQLite {
  constructor() {}

  async init() {
    this.db = await open({
      filename: './users.db',
      driver: sqlite3.Database,
    })
    await this.db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      feedback TEXT NOT NULL
    );
  `)
  }

  async insertFeedback({ feedback }) {
    await this.db.run(
      'INSERT INTO users (feedback) VALUES (?)',
      feedback
    )
  }
}

const db = new SQLite()
await db.init()

export default db
