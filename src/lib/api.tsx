import { supabase } from './supabaseClient';

export interface UpdatePasswordData {
  password: string;
  accessToken: string;
}

export async function updateUserPassword(data: { password: string }): Promise<any> {
  const { password } = data;

  const { data: responseData, error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    const errorMessage = error.message || "Ocorreu um erro ao atualizar sua senha.";
    throw new Error(errorMessage);
  }

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
