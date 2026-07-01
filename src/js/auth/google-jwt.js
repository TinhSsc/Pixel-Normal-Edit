// Decodes the JWT credential returned by Google Identity Services.
// NOTE: this does not verify the signature — fine for client-only demo,
// but a real backend must verify the token before trusting it.
export function decodeGoogleCredential(credential) {
  const payload = credential.split('.')[1];
  const json = decodeURIComponent(
    atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
  const data = JSON.parse(json);
  return {
    googleId: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}
