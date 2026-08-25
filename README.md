# Kumon Centre Management — Production V1 Starter

This package is the first production migration of the approved prototype. It adds a MySQL schema, Node/Express server, server-side capacity rules, API endpoints, and an importer for the current prototype data.

## Important

The included `public/` interface is the approved prototype. In this V1 starter it is still using `public/data.js` for its visible UI. The database/API runs alongside it so you can verify the imported data before we switch every UI action to the API. Do not launch with real student data on a public host yet.

## 1. Install prerequisites on macOS

Open Terminal.

### Homebrew
If `brew --version` works, continue. Otherwise install Homebrew from its official website.

### Node.js
```bash
brew install node
node --version
npm --version
```

### MySQL
```bash
brew install mysql
brew services start mysql
mysql --version
```

## 2. Create a dedicated MySQL account

Open MySQL:
```bash
mysql -u root
```

Run these commands inside the MySQL prompt. Replace `YOUR_STRONG_PASSWORD` with a password you choose:
```sql
CREATE USER IF NOT EXISTS 'kumon_app'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON kumon_centre.* TO 'kumon_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3. Configure the project

Unzip the project and enter the folder:
```bash
cd ~/Downloads/kumon-production-v1
```

Install packages:
```bash
npm install
```

Create your private environment file:
```bash
cp .env.example .env
```

Open `.env` in VS Code or a text editor and set:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=kumon_app
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_NAME=kumon_centre
SESSION_SECRET=PUT_A_LONG_RANDOM_SECRET_HERE
NODE_ENV=development
```

Do not upload `.env` to GitHub. It is already included in `.gitignore`.

## 4. Create the database tables

```bash
npm run db:init
```

Expected result:
`Database schema created.`

## 5. Import the approved prototype student data

```bash
npm run db:import
```

The importer groups the current schedule rows by student name, creates one student record, creates enrolments, and creates allocations. Interactive raw times such as 4:10, 4:50, 5:35 and 6:20 are mapped to their main centre timeslot while preserving the original raw time.

IMPORTANT: the source currently identifies students by name. Before real launch, Student IDs should be imported from the original centre data so two different students with the same name cannot be merged.

## 6. Start the system

```bash
npm run dev
```

Open:
`http://localhost:3000`

Do not open `index.html` directly anymore. The Node server should serve the application.

## 7. Verify the API

Open these in the browser while the server is running:

- `/api/health` — should return database connected.
- `/api/students` — database student list.
- `/api/capacity?day=Monday&time=3:45%20pm` — capacity for a session.
- `/api/waitlist`
- `/api/absences`
- `/api/audit-log`

Example capacity response contains English `/28`, Math `/41` with its three-level breakdown, and Interactive `/5`.

## 8. What is already enforced on the server

- Valid centre days/times: Mon/Thu 3:45, 4:30, 5:15, 6:00; Tue/Fri 3:45 only.
- English capacity: 28.
- Math capacity: one shared pool of 41 across 3A-A, B-D and E+.
- Interactive capacity: 5.
- Reserved allocations count toward capacity.
- Allocation move endpoint checks capacity inside a database transaction and writes an audit entry.

## 9. Database design

- `students`: one person, one record.
- `enrolments`: English, Math and/or Interactive; Math level is stored here.
- `allocations`: day/time/section placements.
- `absences`: start/return dates and temporary/extended classification.
- `waitlist` + `waitlist_requirements`: requested session and required sections.
- `audit_log`: permanent change history.
- `users`: future authenticated staff accounts.

## 10. Safe development workflow

Before making structural changes, back up the database:
```bash
mysqldump -u kumon_app -p kumon_centre > kumon_backup.sql
```

To restore:
```bash
mysql -u kumon_app -p kumon_centre < kumon_backup.sql
```

For development only, to completely reset the database:
```bash
npm run db:reset
npm run db:init
npm run db:import
```

## 11. Next migration step

Once the database import is verified, replace the frontend's `data.js` reads/writes with `/api/...` calls. Do this feature-by-feature: Dashboard read data first, then Students, Schedule, Waitlist, Absences, mutations, and Audit Log. After that, add authentication and deployment configuration.

## Before real launch

Do not use GitHub Pages for the production application. Do not place real student information in a public GitHub repository. Production deployment needs HTTPS, private environment variables, database backups, authenticated users, authorization, server-side validation, secure sessions, and a privacy/security review appropriate for student information.
