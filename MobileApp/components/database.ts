import * as SQLite from "expo-sqlite";

let db: any;
export const setupDatabase = async () => {
  db = await SQLite.openDatabaseAsync("data");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY NOT NULL,
      alias TEXT,
      host TEXT,
      port INTEGER,
      key TEXT,
      lastMortify INTEGER,
      status INTEGER,
      nonReadMessage0 INTEGER,
      nonReadMessage1 INTEGER,
      nonReadMessage2 INTEGER,
      nonReadMessage3 INTEGER
    );
  `);
};

export const getDB = () => db;
