package com.smartbank.wallet.ui.auth

import com.google.gson.JsonParser
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartbank.wallet.data.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(
    private val walletRepository: WalletRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            runCatching {
                walletRepository.login(email = email, password = password)
            }.onSuccess { response ->
                _uiState.value = AuthUiState(
                    isAuthenticated = response.isSuccessful,
                    successMessage = if (response.isSuccessful) {
                        "Login berhasil."
                    } else {
                        null
                    },
                    errorMessage = response.errorMessage(),
                )
            }.onFailure { error ->
                _uiState.value = AuthUiState(errorMessage = error.message)
            }
        }
    }

    fun register(name: String, email: String, password: String, walletPin: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            runCatching {
                walletRepository.register(
                    name = name,
                    email = email,
                    password = password,
                    walletPin = walletPin,
                )
            }.onSuccess { response ->
                _uiState.value = AuthUiState(
                    isAuthenticated = false,
                    registrationSucceeded = response.isSuccessful,
                    successMessage = if (response.isSuccessful) {
                        "Registrasi berhasil. Silakan login dengan akun baru."
                    } else {
                        null
                    },
                    errorMessage = response.errorMessage(),
                )
            }.onFailure { error ->
                _uiState.value = AuthUiState(errorMessage = error.message)
            }
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(
            errorMessage = null,
            successMessage = null,
            registrationSucceeded = false,
        )
    }
}

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val registrationSucceeded: Boolean = false,
    val successMessage: String? = null,
    val errorMessage: String? = null,
)

private fun retrofit2.Response<*>.errorMessage(): String? {
    if (isSuccessful) return null
    val raw = errorBody()?.string().orEmpty()
    if (raw.isBlank()) return "Permintaan gagal. Periksa data lalu coba lagi."

    return runCatching {
        val json = JsonParser.parseString(raw).asJsonObject
        json["error"]?.asJsonObject?.get("message")?.asString
            ?: json["message"]?.asString
    }.getOrNull() ?: raw.take(160)
}
