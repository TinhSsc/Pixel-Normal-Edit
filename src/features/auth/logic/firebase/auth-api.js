import { auth } from './config.js';
import { t } from '../../../../i18n/i18n.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw handleAuthError(error);
  }
}

export async function registerWithEmail(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
      // Refresh user object
      await userCredential.user.reload();
    }
    return auth.currentUser;
  } catch (error) {
    throw handleAuthError(error);
  }
}

export async function loginWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    const driveToken = credential ? credential.accessToken : null;
    return { user: userCredential.user, driveToken };
  } catch (error) {
    throw handleAuthError(error);
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error);
  }
}

export async function logoutUser() {
  await auth.signOut();
}

function handleAuthError(error) {
  const code = error.code;
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
    return new Error(t('auth.errEmailOrPassword') || 'Email hoặc mật khẩu không chính xác.');
  }
  if (code === 'auth/email-already-in-use') {
    return new Error(t('auth.errEmailInUse') || 'Email này đã được sử dụng.');
  }
  if (code === 'auth/weak-password') {
    return new Error(t('auth.errWeakPassword') || 'Mật khẩu quá yếu, vui lòng chọn mật khẩu mạnh hơn.');
  }
  if (code === 'auth/invalid-email') {
    return new Error(t('auth.errInvalidEmail') || 'Định dạng email không hợp lệ.');
  }
  if (code === 'auth/popup-closed-by-user') {
    return new Error(t('auth.errGoogleCancelled') || 'Đăng nhập bằng Google đã bị hủy.');
  }
  return new Error(error.message || t('auth.errDefault') || 'Có lỗi xảy ra khi xác thực.');
}
