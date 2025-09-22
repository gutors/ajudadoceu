import { supabase } from './supabaseClient';

// Client API Key para acesso as EdgeFunctions
const clientApiKey = import.meta.env.VITE_CLIENT_API_KEY

export interface UpdatePasswordData {
  password: string;
  accessToken: string;
}

export async function updateUserPassword(data: UpdatePasswordData): Promise<any> {
  const { password, accessToken } = data;

  const { data: responseData, error } = await supabase.functions.invoke('set-user-password', {
    body: { password },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (error) {
    const errorMessage = error.context?.body?.error || error.message || "Ocorreu um erro ao atualizar sua senha.";
    throw new Error(errorMessage);
  }

  return responseData;
}
