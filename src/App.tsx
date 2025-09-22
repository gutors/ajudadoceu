import { supabase } from './lib/supabaseClient';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AstrologicalData, DailyData, LFCPeriod, MercurioRetrogrado, Eclipse } from './types';
import luaIcon from './assets/lua-icon.png';
import { SetPasswordPage } from './components/SetPasswordPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';

// Dados astrológicos diários completos (serão carregados de um JSON)
let dadosDiarios: AstrologicalData | null = null;

// Função para carregar os dados astrológicos diários
async function carregarDados(): Promise<void> {
  try {
    const response = await fetch("/dados_diarios_completos.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: AstrologicalData = await response.json();
    dadosDiarios = data;
    console.log("Dados astrológicos diários carregados com sucesso");
  } catch (error) {
    console.error("Erro ao carregar dados astrológicos diários:", error);
    alert("Erro ao carregar os dados astrológicos. Tente recarregar a página.");
    // Em um ambiente de produção, você pode querer usar dados de fallback aqui
  }
}

// Função para obter emoji/símbolo para cada fase da lua
function getFaseLuaEmoji(fase: string): string {
  switch (fase.toLowerCase()) {
    case 'nova': return '🌑';
    case 'crescente': return '🌓';
    case 'cheia': return '🌕';
    case 'minguante': return '🌗';
    default: return '';
  }
}

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>('consulta');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [resultadoConsulta, setResultadoConsulta] = useState<{ message: string; isFavorable: boolean } | null>(null);
  const [detalhesAstrologicos, setDetalhesAstrologicos] = useState<DailyData | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [user, setUser] = useState(null);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const session = supabase.auth.getSession();
    setUser(session?.user ?? null);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignUp(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.');
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    carregarDados().then(() => {
      // Inicializar com o mês atual (se dentro do range) ou Jan 2025
      const hoje = new Date();
      if (hoje.getFullYear() < 2025 || (hoje.getFullYear() === 2026 && hoje.getMonth() > 2)) {
        setCurrentYear(2025);
        setCurrentMonth(0);
      } else {
        setCurrentYear(hoje.getFullYear());
        setCurrentMonth(hoje.getMonth());
      }
      // Define a data inicial para a consulta como a data atual ou 01/01/2025 se fora do range
      const initialDate = new Date();
      if (initialDate.getFullYear() < 2025 || (initialDate.getFullYear() === 2026 && initialDate.getMonth() > 2)) {
        setSelectedDate('2025-01-01');
      } else {
        setSelectedDate(initialDate.toISOString().split('T')[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'calendario' && dadosDiarios) {
      // Atualizar calendário quando a aba muda para calendário ou dados são carregados
      // A lógica de geração do calendário será um componente separado ou função renderizadora
    }
  }, [activeTab, currentMonth, currentYear, dadosDiarios]);

  const openTab = (tabName: string) => {
    setActiveTab(tabName);
  };

  const verificarData = (dateInput: string) => {
    if (!dateInput || !dadosDiarios) {
      setResultadoConsulta({ message: "Selecione uma data válida ou recarregue a página.", isFavorable: false });
      setDetalhesAstrologicos(null);
      return;
    }

    const dadosDoDia = dadosDiarios[dateInput];

    if (!dadosDoDia) {
      setResultadoConsulta({ message: "Não há dados astrológicos para esta data.", isFavorable: false });
      setDetalhesAstrologicos(null);
      return;
    }

    const temLFC = dadosDoDia.lfc && dadosDoDia.lfc.length > 0;

    if (temLFC) {
      const horarios = dadosDoDia.lfc.map(p => `${p.inicio} às ${p.fim}`).join(', ');
      setResultadoConsulta({ message: `Lua Fora de Curso: ${horarios}`, isFavorable: false });
    } else {
      setResultadoConsulta({ message: "Dia FAVORÁVEL", isFavorable: true });
    }

    setDetalhesAstrologicos(dadosDoDia);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    verificarData(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verificarData(selectedDate);
  };

  const renderCalendario = () => {
    if (!dadosDiarios) return null;

    const calendarioDias: JSX.Element[] = [];
    const primeiroDia = new Date(currentYear, currentMonth, 1);
    const ultimoDia = new Date(currentYear, currentMonth + 1, 0);
    const totalDias = ultimoDia.getDate();

    // Adicionar espaços vazios para os dias antes do primeiro dia do mês
    for (let i = 0; i < primeiroDia.getDay(); i++) {
      calendarioDias.push(<div key={`empty-${i}`} className="calendario-dia"></div>);
    }

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    for (let dia = 1; dia <= totalDias; dia++) {
      const dataStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      const dadosDoDia = dadosDiarios[dataStr];

      let diaClasses = "calendario-dia dia-mes";
      let titleText = "";
      let faseLuaEmoji = '';

      if (dataStr === hojeStr) {
        diaClasses += " dia-hoje";
      }

      if (dadosDoDia) {
        if (dadosDoDia.lfc && dadosDoDia.lfc.length > 0) {
          diaClasses += " dia-lfc";
          const horarios = dadosDoDia.lfc.map(p => `${p.inicio}-${p.fim}`).join(', ');
          titleText += `Lua Fora de Curso: ${horarios}`;
        } else {
          diaClasses += " dia-favoravel";
        }

        if (dadosDoDia.fase_lua) {
          faseLuaEmoji = getFaseLuaEmoji(dadosDoDia.fase_lua);
          if (titleText) titleText += " | ";
          titleText += `Lua ${dadosDoDia.fase_lua}`;
        }

        if (dadosDoDia.mercurio_retrogrado && dadosDoDia.mercurio_retrogrado.status) {
          diaClasses += " dia-mercurio-retro";
          if (titleText) titleText += " | ";
          titleText += `Mercúrio Retrógrado`;
        }

        if (dadosDoDia.eclipse) {
          diaClasses += " dia-eclipse";
          if (titleText) titleText += " | ";
          titleText += `Eclipse ${dadosDoDia.eclipse.tipo}`;
        }
      } else {
        diaClasses += " dia-invalido";
      }

      calendarioDias.push(
        <div
          key={dataStr}
          className={diaClasses}
          title={titleText}
          onClick={() => {
            setSelectedDate(dataStr);
            verificarData(dataStr);
            openTab('consulta');
          }}
        >
          {dia}
          {faseLuaEmoji && <span className="fase-lua-indicator">{faseLuaEmoji}</span>}
        </div>
      );
    }

    return (
      <div className="calendario-grid">
        <div className="calendario-dia dia-semana">D</div>
        <div className="calendario-dia dia-semana">S</div>
        <div className="calendario-dia dia-semana">T</div>
        <div className="calendario-dia dia-semana">Q</div>
        <div className="calendario-dia dia-semana">Q</div>
        <div className="calendario-dia dia-semana">S</div>
        <div className="calendario-dia dia-semana">S</div>
        {calendarioDias}
      </div>
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => {
      let newMonth = prevMonth - 1;
      let newYear = currentYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      // Limitar navegação ao período com dados (Jan 2025 - Mar 2026)
      if (newYear < 2025 || (newYear === 2025 && newMonth < 0)) {
        newYear = 2025;
        newMonth = 0;
      }
      setCurrentYear(newYear);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      let newMonth = prevMonth + 1;
      let newYear = currentYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      // Limitar navegação ao período com dados (Jan 2025 - Mar 2026)
      if (newYear > 2026 || (newYear === 2026 && newMonth > 2)) {
        newYear = 2026;
        newMonth = 2;
      }
      setCurrentYear(newYear);
      return newMonth;
    });
  };

  if (!user) {
    return (
      <div className="container">
        <header>
          <a href="#" className="logo">
            <img src={luaIcon} alt="Lua" width="40" height="40" />
            Ajuda do <span>Céu</span>
          </a>
        </header>
        <div className="consulta-card" style={{ margin: '20px' }}>
          {isLoginView ? (
            <div>
              <h1>Login</h1>
              <form onSubmit={handleSignIn}>
                <div className="form-group">
                  <label htmlFor="login-email">Email:</label>
                  <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Senha:</label>
                  <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn">Entrar</button>
                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <Link to="/forgot-password" style={{ color: 'var(--cor-destaque)' }}>
                    Esqueci minha senha
                  </Link>
                </p>
              </form>
            </div>
          ) : (
            <div>
              <h1>Cadastro</h1>
              <form onSubmit={handleSignUp}>
                <div className="form-group">
                  <label htmlFor="register-name">Nome:</label>
                  <input type="text" id="register-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="register-email">Email:</label>
                  <input type="email" id="register-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="register-password">Senha:</label>
                  <input type="password" id="register-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn">Cadastrar</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                Já tem uma conta?{' '}
                <a href="#" onClick={() => setIsLoginView(true)} style={{ color: 'var(--cor-destaque)' }}>
                  Faça login
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <a href="#" className="logo">
          <img src={luaIcon} alt="Lua" width="40" height="40" />
          Ajuda do <span>Céu</span>
        </a>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'consulta' ? 'active' : ''}`} onClick={() => openTab('consulta')}>Consulta</button>
        <button className={`tab ${activeTab === 'calendario' ? 'active' : ''}`} onClick={() => openTab('calendario')}>Calendário</button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => openTab('info')}>Como usar o App</button>
        <button className="tab" onClick={handleSignOut}>Sair</button>
      </div>

      <div id="consulta" className={`tab-content ${activeTab === 'consulta' ? 'active' : ''}`}>
        <div className="consulta-card">
          <h1>Verificar Dia</h1>
          <form id="consulta-form" onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="date-input">Selecione uma data:</label>
              <input type="date" id="date-input" min="2025-01-01" max="2026-03-31" value={selectedDate} onChange={handleDateChange} required />
            </div>
            <button type="submit" className="btn" id="check-button">Verificar</button>
          </form>
          {resultadoConsulta && (
            <div className={`resultado ${resultadoConsulta.isFavorable ? 'favoravel' : 'desfavoravel'}`}>
              {resultadoConsulta.message}
            </div>
          )}
          {detalhesAstrologicos && (
            <div id="detalhes-astrologicos">
              <h3>Detalhes Astrológicos</h3>
              <div className="detalhe-item">
                <strong>Fase da Lua:</strong> {getFaseLuaEmoji(detalhesAstrologicos.fase_lua)} {detalhesAstrologicos.fase_lua || 'N/A'}
              </div>
              <div className="detalhe-item">
                <strong>Lua Fora de Curso:</strong> {detalhesAstrologicos.lfc && detalhesAstrologicos.lfc.length > 0
                  ? `Sim (${detalhesAstrologicos.lfc.map(p => `${p.inicio} às ${p.fim}`).join(', ')})`
                  : 'Não'}
              </div>
              <div className="detalhe-item">
                <strong>Mercúrio Retrógrado:</strong> {detalhesAstrologicos.mercurio_retrogrado && detalhesAstrologicos.mercurio_retrogrado.status
                  ? `Sim (${detalhesAstrologicos.mercurio_retrogrado.periodo})`
                  : 'Não'}
              </div>
              {detalhesAstrologicos.outros_retrogrados && detalhesAstrologicos.outros_retrogrados.length > 0 && (
                <div className="detalhe-item">
                  <strong>Outros Retrógrados:</strong> {detalhesAstrologicos.outros_retrogrados.join(', ')}
                </div>
              )}
              {detalhesAstrologicos.transitos && detalhesAstrologicos.transitos.length > 0 && (
                <div className="detalhe-item">
                  <strong>Trânsitos Importantes:</strong> {detalhesAstrologicos.transitos.join(', ')}
                </div>
              )}
              {detalhesAstrologicos.eclipse && (
                <div className="detalhe-item">
                  <strong>Eclipse:</strong> {detalhesAstrologicos.eclipse.tipo} às {detalhesAstrologicos.eclipse.horario}. {detalhesAstrologicos.eclipse.descricao}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div id="calendario" className={`tab-content ${activeTab === 'calendario' ? 'active' : ''}`}>
        <div className="consulta-card">
          <div className="calendario-header">
            <button id="prev-month" className="btn-nav" onClick={handlePrevMonth}>&lt;</button>
            <h2 id="current-month">{mesesNomes[currentMonth]} {currentYear}</h2>
            <button id="next-month" className="btn-nav" onClick={handleNextMonth}>&gt;</button>
          </div>
          {renderCalendario()}
          <div className="calendario-legenda">
            <div className="legenda-item">
              <div className="legenda-cor cor-favoravel"></div>
              <span>Favorável</span>
            </div>
            <div className="legenda-item">
              <div className="legenda-cor cor-desfavoravel"></div>
              <span>Lua Fora de Curso</span>
            </div>
            <div className="legenda-item">
              <div className="legenda-cor cor-hoje"></div>
              <span>Hoje</span>
            </div>
            <div className="legenda-item">
              <div className="legenda-cor cor-fase-lua"></div>
              <span>Fase da Lua</span>
            </div>
          </div>
        </div>
      </div>

      <div id="info" className={`tab-content ${activeTab === 'info' ? 'active' : ''}`}>
        <div className="info-card">
          <h3>Lua Fora de Curso</h3>
          <p>Período em que a Lua não faz aspectos com outros planetas antes de mudar de signo. <br/> Não é recomendado iniciar projetos importantes ou tomar decisões cruciais.</p>
        </div>

        <div className="info-card">
          <h3>Fases da Lua</h3>
          <p><strong>Lua Nova:</strong> Momento de novos começos</p>
          <p><strong>Lua Crescente:</strong> Período de ação e desenvolvimento</p>
          <p><strong>Lua Cheia:</strong> Auge de energia e manifestação</p>
          <p><strong>Lua Minguante:</strong> Tempo de finalização e reflexão</p>
        </div>

        <div className="info-card">
          <h3>Mercúrio Retrógrado 2025</h3>
          <p>26/02 até 20/03</p>
          <p>15/03 até 07/04</p>
          <p>18/07 até 11/08</p>
          <p>Período para revisar, refletir e ter cuidado com comunicações e contratos.</p>
        </div>

        <div className="info-card">
          <h3>Trânsitos Importantes 2025</h3>
          <p><strong>Plutão em Aquário:</strong> Início de uma nova era voltada ao coletivo, inovação e quebra de paradigmas antigos.</p>
          <p><strong>Júpiter em Gêmeos (até 10/06):</strong> Expansão pela curiosidade, ótimo para estudos e comunicação.</p>
          <p><strong>Urano em Gêmeos (07/07 a 07/11):</strong> Tecnologia e reinvenção das ideias.</p>
        </div>
      </div>

      <footer>
        &copy; 2025 Ajuda do Céu | Baseado no ebook de <span className="author">Letícia Andrade</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
