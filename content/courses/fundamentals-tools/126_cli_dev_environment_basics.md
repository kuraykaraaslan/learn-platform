# 126. Command Line & Development Environment Basics

## What It Is
The command line, environment variables, and package managers are the load-bearing, rarely-discussed layer underneath every `npm run dev`. `PATH` is just a list of directories the shell searches, in order, when you type a bare command name — "command not found" almost always means "not in any directory listed in PATH," and "wrong version ran" almost always means an earlier PATH entry shadowed the one you wanted.

Environment variables are the standard way to inject configuration without hardcoding it — a `.env` file (loaded by a tool like `dotenv` or natively by the framework) sets them for local dev, while CI/production inject them through the platform's own secret/config mechanism. The `.env` file itself should never be committed; `.env.example` (same keys, placeholder values) documents what's needed without leaking anything.

Piping and redirection (`|`, `>`, `>>`) let you compose small single-purpose tools instead of writing a one-off script — `grep`, `find`, `xargs`, and `sort` combined cover a surprising fraction of "quick script" needs.

## Key Concepts
- **PATH**: ordered list of directories searched for executables; order determines which version of a duplicate-named tool runs
- **Environment variables**: process-scoped config, set via shell export, `.env` files, or the platform's secret manager
- **`.env` vs `.env.example`**: real file is gitignored and holds secrets; example file is committed and documents required keys
- **Piping (`|`) and redirection (`>`, `>>`)**: compose small tools instead of writing bespoke scripts
- **Shell profile files** (`.bashrc`, `.zshrc`): where PATH and aliases get customized per-user
- **Process management**: `ps`, `kill`, `lsof -i :PORT` to find and stop a process holding a port

## Example Code
```bash
# Find all TODO comments in TS files modified in the last day, one command composed of small tools
find . -name "*.ts" -mtime -1 -not -path "*/node_modules/*" \
  | xargs grep -l "TODO" \
  | sort

# Diagnose "command not found" or "wrong version ran"
which node        # shows which PATH entry is actually being used
echo $PATH | tr ':' '\n'   # print PATH one directory per line

# Find and kill whatever is holding port 3000
lsof -i :3000
kill -9 $(lsof -t -i:3000)
```

```bash
# .env.example — committed, documents required config with placeholder values
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-local-env
```

## When to Use
- Setting up a new project locally — start from `.env.example`, never copy a teammate's real `.env`
- Writing a one-off data cleanup or log-scanning task — check if composed shell tools solve it before writing a script
- Debugging "works locally, fails in CI" — the answer is very often a missing env var or a PATH difference

## Common Mistakes
- Committing `.env` with real secrets (always `.gitignore` it, always keep `.env.example` in sync)
- Hardcoding absolute local paths (`/Users/name/project/...`) instead of relative paths or env vars
- Assuming a globally-installed CLI version matches what CI uses instead of pinning it in the project
- Not knowing `lsof -i :PORT` exists, and restarting the whole machine to free up a port instead

## Further Reading
- MIT's "The Missing Semester of Your CS Education" (missing.semester.mit.edu) — shell, environment, tools
- `man bash` / `man zshbuiltins` for the shell you actually use
- The Twelve-Factor App, section III (Config) — twelve-factor.net
