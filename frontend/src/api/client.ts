import { getStoredToken as utilsGetStoredToken, storeSession as utilsStoreSession, clearSession as utilsClearSession } from "../utils";
import type { 
  LoginResponse, 
  RegisterResponse, 
  User, 
  UserRole,
  LedgerEntry, 
  PaymentRequest 
} from "../types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://127.0.0.1:5000/smartbank";

// Re-export so other modules and tests can read the resolved base URL.
export { API_BASE_URL };

// Helper function to get the authorization header
function getAuthHeaders(): HeadersInit {
  const token = utilsGetStoredToken();
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
    utilsStoreSession(data.token, data.user);
    return data;
  },
  
  async register(userId: string | undefined, name: string, password: string, role: UserRole): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, name, password, role }),
    });
    
    const data = await handleResponse<RegisterResponse>(response);
    utilsStoreSession(data.token, data.user);
    return data;
  },
  
  // User data
  async getBalanceData(): Promise<{ balance: number; loan: number; history: any[] }> {
    const response = await fetch(`${API_BASE_URL}/balance`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const res = await handleResponse<{ status: string; data: { balance: number; loan: number; history: any[] } }>(response);
    return res.data;
  },
  
  async getLedger(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/ledger`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const res = await handleResponse<{ status: string; data: any[] }>(response);
    return res.data;
  },
  
  async getPaymentRequests(): Promise<PaymentRequest[]> {
    // Derived in frontend, return empty by default from API
    return [];
  },

  async transfer(toUserId: string, amount: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/transfer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ toUserId, amount }),
    });
    return await handleResponse<any>(response);
  },

  async requestLoan(amount: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/loan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount }),
    });
    return await handleResponse<any>(response);
  },

  async payLoan(installmentId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/loan/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ installmentId }),
    });
    return await handleResponse<any>(response);
  },
  
  // Session management
  clearSession() {
    utilsClearSession();
  },
  
  // Get current token (for debugging/testing)
  getStoredToken() {
    return utilsGetStoredToken();
  }
};

// Export convenience functions for direct use
export const api = apiClient;
export const login = apiClient.login;
export const register = apiClient.register;
export const getBalanceData = apiClient.getBalanceData;
export const getLedger = apiClient.getLedger;
export const getPaymentRequests = apiClient.getPaymentRequests;