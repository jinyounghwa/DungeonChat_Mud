import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let apiClient: AxiosInstance | null = null;

export function initializeApiClient(accessToken?: string) {
  apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  return apiClient;
}

export function getApiClient() {
  if (!apiClient) {
    return initializeApiClient();
  }
  return apiClient;
}

export function setAuthToken(accessToken: string) {
  const client = getApiClient();
  client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
}

// Auth APIs
export async function registerUser(
  email: string,
  password: string,
  username: string,
) {
  const client = getApiClient();
  const response = await client.post('/auth/register', {
    email,
    password,
    username,
  });
  return response.data;
}

export async function loginUser(email: string, password: string) {
  const client = getApiClient();
  const response = await client.post('/auth/login', {
    email,
    password,
  });
  return response.data;
}

export async function logoutUser() {
  const client = getApiClient();
  const response = await client.post('/auth/logout');
  return response.data;
}

// Character APIs
export async function createCharacter(
  name: string,
  characterClass: 'warrior' | 'mage' | 'thief',
) {
  const client = getApiClient();
  const response = await client.post('/characters', {
    name,
    class: characterClass,
  });
  return response.data;
}

export async function getCharacter(characterId: string) {
  const client = getApiClient();
  const response = await client.get(`/characters/${characterId}`);
  return response.data;
}

// Battle APIs
export async function startBattle(characterId: string) {
  const client = getApiClient();
  const response = await client.post('/battles/start', { characterId });
  return response.data;
}

export async function attackInBattle(battleId: string) {
  const client = getApiClient();
  const response = await client.post(`/battles/${battleId}/attack`);
  return response.data;
}

export async function defendInBattle(battleId: string) {
  const client = getApiClient();
  const response = await client.post(`/battles/${battleId}/defend`);
  return response.data;
}

export async function escapeFromBattle(battleId: string) {
  const client = getApiClient();
  const response = await client.post(`/battles/${battleId}/escape`);
  return response.data;
}

export async function finishBattle(battleId: string) {
  const client = getApiClient();
  const response = await client.post(`/battles/${battleId}/finish`);
  return response.data;
}

// Game Chat API
export async function sendChatMessage(characterId: string, message: string) {
  const client = getApiClient();
  const response = await client.post('/game/chat', {
    characterId,
    message,
  });
  return response.data;
}
