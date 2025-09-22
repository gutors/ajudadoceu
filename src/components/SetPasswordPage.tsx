import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import luaIcon from '../assets/lua-icon.png';
import { Eye, EyeOff } from 'lucide-react';
import { updateUserPassword } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';

/**
 * @description
 * Renders a page for the user to set their password, styled to match the login page.
 */
export function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // When the page loads, Supabase client detects the recovery token in the URL
    // and fires a PASSWORD_RECOVERY event. We listen for that to enable the form.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (session) {
          // This event confirms the user is in the recovery flow.
          // The session is now active, and they can update their password.
          setIsSessionReady(true);
        }
      }
    });

    // It's good practice to also check for errors passed in the URL hash.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'Ocorreu um erro na autenticação.');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!isSessionReady) {
      setError('Sessão de autenticação não encontrada. O link pode ter expirado.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await updateUserPassword({ password });

      setMessage('Senha definida com sucesso! Você será redirecionado em breve.');
      
      setTimeout(() => {
        window.location.assign('/'); // Recarrega a aplicação na raiz
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '20px' }}>
      <header>
        <a href="/" className="logo">
          <img src={luaIcon} alt="Lua" width="40" height="40" />
          Ajuda do <span>Céu</span>
        </a>
      </header>

      <div className="consulta-card" style={{ margin: '20px' }}>
        <h1>Crie sua Senha</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua nova senha (mín. 6 caracteres)"
                disabled={loading || !!message || !isSessionReady}
                className="pr-10" // Adiciona espaço para o ícone
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 py-2 text-muted-foreground hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
          </div>
          <div className="form-group">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirme sua nova senha"
                disabled={loading || !!message || !isSessionReady}
                className="pr-10" // Adiciona espaço para o ícone
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 py-2 text-muted-foreground hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
          </div>
          
          {error && <p className="resultado desfavoravel" style={{ marginBottom: '20px' }}>{error}</p>}
          {message && <p className="resultado favoravel" style={{ marginBottom: '20px' }}>{message}</p>}
          
          <Button type="submit" className="btn" disabled={loading || !isSessionReady || !!message}>
            {loading ? 'Salvando...' : 'Salvar Senha e Acessar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
