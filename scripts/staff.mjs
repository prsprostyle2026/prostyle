// Manage staff users who can sign in to /bill.
//
//   npm run staff -- list
//   npm run staff -- add <username> [password]
//   npm run staff -- password <username> [password]
//   npm run staff -- disable <username>      (can't sign in; kept in the database)
//   npm run staff -- enable <username>
//   npm run staff -- remove <username>
//   npm run staff -- make-root <username>    (can manage other staff in the app)
//   npm run staff -- remove-root <username>
//   npm run staff -- import-env              (copies BILL_USERS from .env.local)
//
// If the password is left out, you are asked for it.
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import pg from "pg";

const scryptAsync = promisify(scrypt);
const N = 16384, R = 8, P = 1, KEYLEN = 64;

// Format read by verifyPassword() in lib/auth.ts.
async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

const USERNAME_RE = /^[a-z0-9._-]{2,32}$/;
function checkUsername(raw) {
  const name = String(raw ?? "").trim().toLowerCase();
  if (!USERNAME_RE.test(name)) {
    throw new Error("Username must be 2-32 characters: letters, numbers, dot, dash or underscore.");
  }
  return name;
}

function checkPassword(password) {
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");
  return password;
}

async function askPassword() {
  if (!process.stdin.isTTY) throw new Error("Give the password as an argument (no terminal to ask in).");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const first = await rl.question("New password: ");
    const second = await rl.question("Repeat password: ");
    if (first !== second) throw new Error("Passwords do not match.");
    return first;
  } finally {
    rl.close();
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}

const [command, arg1, arg2] = process.argv.slice(2);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  switch (command) {
    case "list": {
      const { rows } = await db.query(
        "SELECT username, active, is_root, created_at FROM staff_users ORDER BY username",
      );
      if (!rows.length) return console.log("No staff users yet. Add one with: npm run staff -- add <username>");
      for (const u of rows) {
        console.log(
          `${u.username.padEnd(20)} ${u.active ? "active  " : "disabled"}  ${u.is_root ? "root " : "staff"}  added ${u.created_at.toISOString().slice(0, 10)}`,
        );
      }
      return;
    }
    case "add": {
      const name = checkUsername(arg1);
      const hash = await hashPassword(checkPassword(arg2 ?? (await askPassword())));
      const { rowCount } = await db.query(
        "INSERT INTO staff_users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
        [name, hash],
      );
      if (!rowCount) throw new Error(`"${name}" already exists. Use "password" to change their password.`);
      return console.log(`Added ${name}.`);
    }
    case "password": {
      const name = checkUsername(arg1);
      const hash = await hashPassword(checkPassword(arg2 ?? (await askPassword())));
      const { rowCount } = await db.query(
        "UPDATE staff_users SET password_hash = $2, updated_at = now() WHERE username = $1",
        [name, hash],
      );
      if (!rowCount) throw new Error(`No user named "${name}".`);
      return console.log(`Password changed for ${name}.`);
    }
    case "disable":
    case "enable": {
      const name = checkUsername(arg1);
      const { rowCount } = await db.query(
        "UPDATE staff_users SET active = $2, updated_at = now() WHERE username = $1",
        [name, command === "enable"],
      );
      if (!rowCount) throw new Error(`No user named "${name}".`);
      return console.log(`${name} is now ${command === "enable" ? "enabled" : "disabled"}.`);
    }
    case "make-root":
    case "remove-root": {
      const name = checkUsername(arg1);
      const { rowCount } = await db.query(
        "UPDATE staff_users SET is_root = $2, updated_at = now() WHERE username = $1",
        [name, command === "make-root"],
      );
      if (!rowCount) throw new Error(`No user named "${name}".`);
      return console.log(`${name} is ${command === "make-root" ? "now a root user" : "no longer a root user"}.`);
    }
    case "remove": {
      const name = checkUsername(arg1);
      const { rowCount } = await db.query("DELETE FROM staff_users WHERE username = $1", [name]);
      if (!rowCount) throw new Error(`No user named "${name}".`);
      return console.log(`Removed ${name}.`);
    }
    case "import-env": {
      const entries = (process.env.BILL_USERS ?? "").split(",").filter((e) => e.includes(":"));
      if (!entries.length) return console.log("BILL_USERS is empty; nothing to import.");
      for (const entry of entries) {
        const i = entry.indexOf(":");
        const rawName = entry.slice(0, i).trim();
        const password = entry.slice(i + 1).trim();
        let name;
        try {
          name = checkUsername(rawName);
        } catch (err) {
          console.log(`Skipped "${rawName}": ${err.message}`);
          continue;
        }
        if (!password) {
          console.log(`Skipped ${name}: empty password.`);
          continue;
        }
        const { rowCount } = await db.query(
          "INSERT INTO staff_users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
          [name, await hashPassword(password)],
        );
        console.log(rowCount ? `Imported ${name}.` : `Skipped ${name}: already in the database.`);
      }
      return;
    }
    default:
      console.log(
        "Usage: npm run staff -- <list | add <user> [pw] | password <user> [pw] | disable <user> | enable <user> | remove <user> | make-root <user> | remove-root <user> | import-env>",
      );
      process.exitCode = command ? 1 : 0;
  }
}

try {
  await db.connect();
  await run();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
