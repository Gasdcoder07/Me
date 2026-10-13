import type { IconName } from '@/components/icons/Icon';
import type { CredentialCategory, LoginCategory } from '@/types/vault';

// Shared by the vault rows, the credential detail and the form, so all three name and draw a category the same way.
export const credentialCategoryIcon: Record<CredentialCategory, IconName> = {
  identity: 'id',
  banks: 'bank',
  access: 'key',
};

export const credentialCategoryLabel: Record<CredentialCategory, string> = {
  identity: 'Identidad',
  banks: 'Bancos',
  access: 'Accesos',
};

export const credentialSecretLabel: Record<CredentialCategory, string> = {
  identity: 'Dato',
  banks: 'Contraseña',
  access: 'Contraseña',
};

export const credentialUsernameLabel: Record<LoginCategory, string> = {
  banks: 'Usuario',
  access: 'Correo o usuario',
};
