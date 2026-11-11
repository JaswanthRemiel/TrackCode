import 'server-only';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function adminApp() {
  if (getApps().length) return getApps()[0];
  // Verifying ID tokens only needs the project id (public signing keys are fetched by the SDK).
  return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

/** Returns the uid for a valid `Authorization: Bearer <firebase id token>` header, or null. */
export async function verifyRequest(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = await getAuth(adminApp()).verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
