🗂️ Project Setup & Planning
Task	Owner	Notes
☐ Create an issue or project card titled Refactor: <Goal>	—	Capture background, risks, acceptance criteria
☐ Define Done in the issue description	—	Include functional tests, performance, security, docs
☐ Sketch module boundaries (whiteboard / diagram)	—	Identify new folders, interfaces, env vars
☐ Decide branch name (feature/<goal-slug>)	—	All work happens here until PR

🐳 Docker & Environment
Dockerfile.dev (runtime identical to prod, plus dev tooling)

docker-compose.yml

yaml
Copy
Edit
services:
  app:
    build: .
    env_file: .env
    volumes:
      - .:/src
    command: npm run dev    # or vite, nodemon, etc.
  test:
    build: .
    env_file: .env.test
    command: npm test
.env.example – document all secrets & config keys.

Makefile / npm scripts

make
Copy
Edit
up:      docker compose up -d --build
test:    docker compose run --rm test
lint:    docker compose run --rm app npm run lint
Verify docker compose up app starts & the health-check passes.

🔁 AI-Assistant Workflow Loop
Repeat for each checklist item inside the issue.

Step	What the agent does	Your checkpoint
A. Context	Agent receives entire playbook, repo root, and target file list.	Confirm it understood scope.
B. Plan	Agent proposes sub-tasks & diffs (“I’ll create X, modify Y”).	Approve or adjust.
C. Implement	Writes code only for that sub-task.	Run make test && make lint.
D. Verify	Agent (or CI) runs unit & integration tests.	If green, continue; else fix.
E. Commit	git add -p + conventional commit message:
feat(api): move FRED key to headers	Push to remote.
F. Next sub-task ➜	Loop until the checklist box is ticked.	

🧪 Testing Matrix
Layer	Tool	Minimum Coverage
Unit	Jest / Vitest	90 % on new modules
Integration	Supertest / curl in CI	Key paths work under Docker
Static	ESLint, Prettier	No lint errors
Security	npm audit --production, gitleaks	Zero criticals

🔐 Secret Handling Rules
Never commit raw keys – only reference process.env.X.

Add a git pre-commit hook (husky) to grep for patterns like api_key= or -----BEGIN.

CI step: gitleaks detect --exit-code 1.

🏗️ CI Pipeline (GitHub Actions example)
yaml
Copy
Edit
name: CI
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: docker compose -f docker-compose.yml --profile test up --build --exit-code-from test
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint
  leak-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2
📥 Pull-Request Template
md
Copy
Edit
### Summary
Moves FRED API key from URL to request header.

### Checklist
- [x] Docker builds & runs locally
- [x] New env vars documented
- [x] Unit tests added
- [x] CI green
- [x] No secrets in diff (`gitleaks`)

### Screenshots / Evidence
<attach test run or curl example>
🚀 Merge & Post-Merge
Squash-merge ➜ main

Tag release: vYY.MM.DD-<short>

Rotate any keys that were previously exposed.

Deploy via your CD pipeline or docker compose up -d --pull always.

Close issue with link to commit & release notes.