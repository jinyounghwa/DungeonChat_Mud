import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { loginUser } from '../api/client';
import '../styles/LoginPage.css';

export const LoginPage = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const { setUser, setTokens } = useGameStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        setUser(result.data.user);
        setTokens(result.data.accessToken, result.data.refreshToken);
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        onLoginSuccess();
      } else {
        setError(result.error || '로그인 실패');
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🎮 DungeonChat</h1>
          <p>텍스트 MUD 게임</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="login-button"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer">
          <p>계정이 없으신가요?</p>
          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="register-link"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
};
