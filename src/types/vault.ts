export type CredentialCategory = 'identity' | 'banks' | 'access';

// Categories that sign in somewhere, so they have a username and a password.
export type LoginCategory = Exclude<CredentialCategory, 'identity'>;

// "all" plus every category, so the selector and the data share one list of values.
export type VaultFilter = 'all' | CredentialCategory;

// Only non-secret fields. The secret (password, or the identity datum) lives in SecureStore, keyed by `id`.
type CredentialBase = {
  id: string;
  title: string;
};

// Identidad: a title and one datum. The datum is secret, so it is not on the row.
export type IdentityCredential = CredentialBase & {
  category: 'identity';
};

// Bancos and accesos: the username is visible in the list, the password is in SecureStore.
export type LoginCredential = CredentialBase & {
  category: LoginCategory;
  username: string;
};

export type Credential = IdentityCredential | LoginCredential;
