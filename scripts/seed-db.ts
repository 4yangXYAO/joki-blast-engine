#!/usr/bin/env ts-node
/* Seed script for development: creates one account, one template, and one scheduled job */
import path from 'path';
import fs from 'fs';
const dbModule = require('../src/db/sqlite.ts');
const AccountsRepo = require('../src/repos/accountsRepo').AccountsRepo;
const TemplatesRepo = require('../src/repos/templatesRepo').TemplatesRepo;
const JobsRepo = require('../src/repos/jobsRepo').JobsRepo;

async function main() {
  const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
  // init (native or sql.js)
  try {
    dbModule.initDatabase(DB_PATH);
    console.log('Using native better-sqlite3');
  } catch (e) {
    console.log('Falling back to sql.js');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await dbModule.initSqlJsDatabase(DB_PATH);
    console.log('Initialized sql.js DB');
  }

  // Ensure migrations applied before inserting seed data
  const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');
  dbModule.runMigrations(MIGRATIONS_DIR);

  const accounts = new AccountsRepo();
  const templates = new TemplatesRepo();
  const jobs = new JobsRepo();

  const acc = accounts.create({ platform: 'mock', display_name: 'dev-account', credentials_encrypted: 'mock' });
  console.log('Created account', acc.id);

  const tpl = templates.create({ name: 'Welcome', content: 'Hello {name}', variables: ['name'], type: 'template' });
  console.log('Created template', tpl.id);

  const job = jobs.create({ account_id: acc.id, platform: 'mock', type: 'post', payload: { template_id: tpl.id, message: 'Hello world' } });
  console.log('Created job', job.id);

  if (dbModule.closeDatabase) dbModule.closeDatabase();
}

main().catch((err) => { console.error(err); process.exit(1); });
