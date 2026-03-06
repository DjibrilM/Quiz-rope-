import { Logger } from '@nestjs/common';

const logger = new Logger('FirebaseConfig');

let firebaseApp: any = null;
export let isFirebaseConfigured = false;

export function initializeFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn(
      'Missing Firebase configuration — auth will use mock mode. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
    isFirebaseConfigured = false;
    return null;
  }

  try {
    const admin = require('firebase-admin');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    isFirebaseConfigured = true;
    logger.log('Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase initialization failed:', error.message);
    isFirebaseConfigured = false;
    return null;
  }
}

export function getFirebaseApp() {
  return firebaseApp;
}
