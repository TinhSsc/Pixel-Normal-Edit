import { auth } from './firebase/config.js';
import { logoutUser } from './firebase/auth-api.js';

const SESSION_KEY = 'pixel-edit-current-user';

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      picture: user.photoURL || null
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function logout() {
  await logoutUser();
  localStorage.removeItem(SESSION_KEY);
}

// Subscribe to Firebase Auth state
auth.onAuthStateChanged((user) => {
  setCurrentUser(user);
});

