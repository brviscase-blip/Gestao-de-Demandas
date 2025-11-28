import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Loader2, Lock, User } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Busca na tabela Cadastro_de_Perfil onde 'No' == usuário e 'Se' == senha
      const { data, error } = await supabase
        .from('Cadastro_de_Perfil')
        .select('*')
        .eq('No', username)
        .eq('Se', password)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        onLoginSuccess(data as UserProfile);
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError('Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors duration-300 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-brand-500/30">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ProGestão</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Melhoria Contínua & Projetos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Usuário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-800 dark:text-white transition-all"
                  placeholder="Seu nome de usuário"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-800 dark:text-white transition-all"
                  placeholder="Sua senha de acesso"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Entrando...
              </>
            ) : (
              'Acessar Painel'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Acesso restrito a colaboradores autorizados.
          </p>
        </div>
      </div>
    </div>
  );
};