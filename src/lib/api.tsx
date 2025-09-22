import { supabase } from './supabaseClient';

// Client API Key para acesso as EdgeFunctions
const clientApiKey = import.meta.env.VITE_CLIENT_API_KEY

export interface UpdatePasswordData {
  password: string;
  accessToken: string;
}

export async function updateUserPassword(data: UpdatePasswordData): Promise<any> {
  const { password, accessToken } = data;

  // Set the session for this request
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: '' // Refresh token is not needed here
  });

  if (sessionError) {
    throw new Error(sessionError.message || "Ocorreu um erro ao autenticar.");
  }

  const { data: responseData, error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    const errorMessage = error.message || "Ocorreu um erro ao atualizar sua senha.";
    throw new Error(errorMessage);
  }

  // Clear the session after the password is updated
  await supabase.auth.signOut();

  return responseData;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://applua.fengshuiedecoracao.com.br/set-password',
  });

  if (error) {
    throw new Error(error.message || "Ocorreu um erro ao solicitar a redefinição de senha.");
  }
}
