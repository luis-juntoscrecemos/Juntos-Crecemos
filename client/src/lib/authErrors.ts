const SUPABASE_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Email not confirmed': 'Tu correo electrónico aún no ha sido confirmado',
  'User not found': 'No se encontró una cuenta con ese correo',
  'Too many requests': 'Demasiados intentos. Intenta de nuevo más tarde',
  'User already registered': 'Ya existe una cuenta con este correo electrónico',
  'A user with this email address has already been registered': 'Ya existe una cuenta con este correo electrónico',
  'Signup requires a valid password': 'La contraseña no cumple los requisitos mínimos',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
};

export function translateAuthError(message: string, fallback = 'Credenciales inválidas'): string {
  if (!message) return fallback;
  for (const [key, value] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (message.includes(key)) return value;
  }
  return fallback;
}
