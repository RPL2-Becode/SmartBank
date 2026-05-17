import { getStoredToken, storeSession, clearSession } from "../utils";
import type { 
  LoginResponse, 
  RegisterResponse, 
  User, 
  LedgerEntry, 
  PaymentRequest 
} from "../types";

const API_BASE_URL = "http://localhost:5000/smartbank";

// Helper function to get the authorization header
function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  if (token) {
    return { 
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    };
  }
  return { 'Content-Type': 'application/json' };
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 
      `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
}

// API Client
export const apiClient = {
  // Authentication
  async login(userId: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, password }),
    });
    
    const data = await handleResponse<LoginResponse>(response);
    storeSession(data.token);
    return data;
  },
  
  async register(userId: string, name: string, password: string, role: 'user' | 'admin' | 'developer' | 'insight_readonly'): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, name, password, role }),
    });
    
    const data = await handleResponse<RegisterResponse>(response);
    storeSession(data.token);
    return data;
  },
  
  // User data
  async getBalance(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/user/balance`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse<{ balance: number }>(response);
    return data.balance;
  },
  
  async getLedger(): Promise<LedgerEntry[]> {
    const response = await fetch(`${API_BASE_URL}/user/ledger`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse<LedgerEntry[]>(response);
  },
  
  async getPaymentRequests(): Promise<PaymentRequest[]> {
    const response = await fetch(`${API_BASE_URL}/user/payment-requests`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse<PaymentRequest[]>(response);
  },
  
  // Session management
  clearSession() {
    clearSession();
  },
  
  // Get current token (for debugging/testing)
  getStoredToken() {
    return getStoredToken();
  }
};

// Export convenience functions for direct use
export const login = apiClient.login;
export const register = apiClient.register;
export const getBalance = apiClient.getBalance;
export const getLedger = apiClient.getLedger;
export const getPaymentRequests = apiClient.getPaymentRequests;
export const clearSession = apiClient.clearSession;
export const getStoredToken = apiClient.getStoredToken;