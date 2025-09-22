import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import luaIcon from '../assets/lua-icon.png';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@/lib/api';

/**
 * @description
 * Renders a page for the user to request a password reset link.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setMessage('Se um e-mail cadastrado for encontrado, um link para redefinição de senha será enviado.');
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
        <h1>Esqueci Minha Senha</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Digite seu e-mail"
              disabled={loading}
            />
          </div>
          
          {error && <p className="resultado desfavoravel" style={{ marginBottom: '20px' }}>{error}</p>}
          {message && <p className="resultado favoravel" style={{ marginBottom: '20px' }}>{message}</p>}
          
          <Button type="submit" className="btn" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
          </Button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Lembrou sua senha?{' '}
          <Link to="/" style={{ color: 'var(--cor-destaque)' }}>
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
