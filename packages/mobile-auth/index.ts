export type LoginRole = "CLIENT" | "DRIVER";
export interface LoginAccount {
  id: string;
  email: string;
  passwordHash: string;
  role: LoginRole;
}

export function authenticateSession<Role extends LoginRole>(
  accounts: readonly LoginAccount[],
  email: string,
  passwordHash: string,
  audience: Role,
): { id: string; role: Role } {
  const account = accounts.find(
    (candidate) =>
      candidate.role === audience &&
      candidate.email.trim().toLowerCase() === email.trim().toLowerCase() &&
      candidate.passwordHash === passwordHash,
  );
  if (!account) throw Error("Correo o contraseña incorrectos.");
  return { id: account.id, role: audience };
}
