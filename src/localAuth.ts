export interface ProviderInfo {
  providerId: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: ProviderInfo[];
}

type AuthStateCallback = (user: User | null) => void;

const STORAGE_USERS_KEY = 'savfx_local_auth_users';
const STORAGE_SESSION_KEY = 'savfx_local_auth_session';

const listeners = new Set<AuthStateCallback>();

function loadUsers(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, string>) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildUser(email: string): User {
  const normalized = normalizeEmail(email);
  return {
    uid: `local-${normalized}`,
    email: normalized,
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [
      {
        providerId: 'password',
        displayName: null,
        email: normalized,
        photoURL: null,
      },
    ],
  };
}

function notify() {
  for (const cb of listeners) cb(auth.currentUser);
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.email) return null;
    return buildUser(session.email);
  } catch {
    return null;
  }
}

export const auth: { currentUser: User | null } = {
  currentUser: restoreSession(),
};

export async function signInWithEmailAndPassword(
  _auth: typeof auth,
  email: string,
  password: string
): Promise<{ user: User }> {
  const normalized = normalizeEmail(email);
  const users = loadUsers();
  const storedPassword = users[normalized];

  if (!storedPassword) {
    const error: any = new Error('User not found');
    error.code = 'auth/user-not-found';
    throw error;
  }

  if (storedPassword !== password) {
    const error: any = new Error('Wrong password');
    error.code = 'auth/wrong-password';
    throw error;
  }

  const user = buildUser(normalized);
  auth.currentUser = user;
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({ email: normalized }));
  localStorage.setItem('adminLoggedIn', 'true');
  notify();
  return { user };
}

export async function createUserWithEmailAndPassword(
  _auth: typeof auth,
  email: string,
  password: string
): Promise<{ user: User }> {
  const normalized = normalizeEmail(email);
  const users = loadUsers();

  if (users[normalized]) {
    const error: any = new Error('Email already in use');
    error.code = 'auth/email-already-in-use';
    throw error;
  }

  users[normalized] = password;
  saveUsers(users);

  const user = buildUser(normalized);
  auth.currentUser = user;
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({ email: normalized }));
  localStorage.setItem('adminLoggedIn', 'true');
  notify();
  return { user };
}

export function onAuthStateChanged(
  _auth: typeof auth,
  callback: AuthStateCallback
): () => void {
  listeners.add(callback);
  callback(auth.currentUser);
  return () => {
    listeners.delete(callback);
  };
}

export async function signOut(_auth: typeof auth): Promise<void> {
  auth.currentUser = null;
  localStorage.removeItem(STORAGE_SESSION_KEY);
  localStorage.removeItem('adminLoggedIn');
  notify();
}
