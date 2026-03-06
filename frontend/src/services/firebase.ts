import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

let configured = false;

class FirebaseAuthService {
  configure(webClientId?: string) {
    if (!webClientId) {
      console.warn('No Google Web Client ID provided — Firebase auth disabled');
      return;
    }

    try {
      GoogleSignin.configure({ webClientId });
      configured = true;
    } catch (error) {
      console.warn('Google Sign-In configuration failed:', error);
      configured = false;
    }
  }

  isConfigured(): boolean {
    return configured;
  }

  async signInWithGoogle(): Promise<{ idToken: string; user: any }> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error('No ID token returned from Google Sign-In');
    }

    const credential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(credential);

    // Get the Firebase ID token to send to our backend
    const firebaseIdToken = await userCredential.user.getIdToken();

    return {
      idToken: firebaseIdToken,
      user: {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        uid: userCredential.user.uid,
      },
    };
  }

  async signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ idToken: string; user: any }> {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName });
    const firebaseIdToken = await userCredential.user.getIdToken();

    return {
      idToken: firebaseIdToken,
      user: {
        email: userCredential.user.email,
        displayName,
        uid: userCredential.user.uid,
      },
    };
  }

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ idToken: string; user: any }> {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const firebaseIdToken = await userCredential.user.getIdToken();

    return {
      idToken: firebaseIdToken,
      user: {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        uid: userCredential.user.uid,
      },
    };
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Google sign out may fail if not signed in
    }
    try {
      await auth().signOut();
    } catch {
      // Firebase sign out may fail if not signed in
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
