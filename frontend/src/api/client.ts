import axios from 'axios';
import { GameChoice } from '../types/game';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60초 타임아웃 (Ollama AI 생성 시간 고려)
});

export interface GameResponse {
  response: string;
  characterId: string;
  gameState: any;
  choices?: GameChoice;
}

export const sendMessage = async (characterId: string, message: string): Promise<GameResponse> => {
  try {
    const res = await client.post('/game/chat', { characterId, message });
    return res.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

export const getGameState = async (characterId: string) => {
  try {
    const res = await client.get(`/game/state/${characterId}`);
    return res.data.data;
  } catch (error) {
    console.error('API error:', error);
    return null;
  }
};

export const clearCharacter = async (characterId: string) => {
  try {
    await client.post(`/game/clear/${characterId}`);
  } catch (error) {
    console.error('API error:', error);
  }
};
