import { useEffect, useRef } from 'react';
import { decodeGoogleCredential } from '../js/auth/google-jwt.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let isGoogleIdInitialized = false;

// Renders the official Google Identity Services button.
// Calls onCredential({ googleId, email, name, picture }) once the user picks an account.
export default function GoogleButton({ onCredential }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID || !window.google?.accounts?.id) return;

    if (!isGoogleIdInitialized) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          onCredential(decodeGoogleCredential(response.credential));
        },
      });
      isGoogleIdInitialized = true;
    }

    window.google.accounts.id.renderButton(divRef.current, {
      theme: 'outline',
      size: 'large',
      width: 280,
    });
  }, [onCredential]);

  if (!CLIENT_ID) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Thiếu VITE_GOOGLE_CLIENT_ID trong .env</p>;
  }

  return <div ref={divRef}></div>;
}
