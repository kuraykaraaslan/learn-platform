import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { loadSeed, MAX_SEED_BYTES } from './course_content.seeds';

describe('loadSeed', () => {
  it('reads the real tenant_members seed used by the P10 pilot lessons', () => {
    const sql = loadSeed('tenant_members');
    expect(sql).toContain('CREATE TABLE tenants');
    expect(sql).toContain('generate_series');
  });

  it('throws for a seed name with no matching file', () => {
    expect(() => loadSeed('does-not-exist')).toThrow(/does not exist/);
  });
});

describe('loadSeed size cap', () => {
  const seedsDir = path.join(process.cwd(), 'content', '_runtime', 'seeds');
  const tmpName = `__test-oversized-${process.pid}`;
  const tmpPath = path.join(seedsDir, `${tmpName}.sql`);

  afterEach(() => {
    if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath);
  });

  it('throws when a seed file exceeds the 50 KB cap', () => {
    fs.writeFileSync(tmpPath, 'x'.repeat(MAX_SEED_BYTES + 1));
    expect(() => loadSeed(tmpName)).toThrow(/over the .*-byte cap/);
  });

  it('accepts a seed file exactly at the cap', () => {
    fs.writeFileSync(tmpPath, `-- ${'x'.repeat(MAX_SEED_BYTES - 4)}`);
    expect(() => loadSeed(tmpName)).not.toThrow();
  });
});
