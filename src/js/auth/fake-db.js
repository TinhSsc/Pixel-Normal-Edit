// Fake "database" backed by localStorage. Replace with real backend API later.
// Stores users keyed by email: { name, email, password, googleId, picture }
const DB_KEY = 'pixel-edit-users-db';

function readDb() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || {};
  } catch {
    return {};
  }
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db, null, 2));
}

export function findUserByEmail(email) {
  const db = readDb();
  return db[email.toLowerCase()] || null;
}

export function saveUser(user) {
  const db = readDb();
  db[user.email.toLowerCase()] = { ...db[user.email.toLowerCase()], ...user };
  writeDb(db);
  return db[user.email.toLowerCase()];
}

// Downloads the current fake DB as a JSON file, for inspection/debugging.
export function exportDbToFile() {
  const db = readDb();
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users-db.json';
  a.click();
  URL.revokeObjectURL(url);
}
