package com.smartbank.wallet.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartbank.wallet.data.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AppViewModel(
    walletRepository: WalletRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(AppUiState())
    val uiState: StateFlow<AppUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            walletRepository.authToken.collect { token ->
                _uiState.value = AppUiState(
                    isCheckingSession = false,
                    isAuthenticated = !token.isNullOrBlank(),
                )
            }
        }
    }
}

data class AppUiState(
    val isCheckingSession: Boolean = true,
    val isAuthenticated: Boolean = false,
)
