package com.smartbank.wallet.ui.dashboard

import com.google.gson.JsonParser
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartbank.wallet.data.remote.BalanceResponse
import com.smartbank.wallet.data.remote.TransactionDto
import com.smartbank.wallet.data.repository.WalletRepository
import java.math.BigDecimal
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.Response

class DashboardViewModel(
    private val walletRepository: WalletRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            runCatching {
                val balanceResponse = walletRepository.getBalance()
                val transactionsResponse = walletRepository.getTransactions()
                val transactionsBody = transactionsResponse.body()
                val sessionExpired = balanceResponse.isAuthError() || transactionsResponse.isAuthError()
                if (sessionExpired) {
                    walletRepository.logout()
                }

                DashboardUiState(
                    balance = balanceResponse.body(),
                    transactions = transactionsBody?.transactions ?: transactionsBody?.data.orEmpty(),
                    errorMessage = when {
                        sessionExpired -> "Sesi login berakhir. Silakan login kembali."
                        !balanceResponse.isSuccessful -> balanceResponse.errorMessage()
                        !transactionsResponse.isSuccessful -> transactionsResponse.errorMessage()
                        else -> null
                    },
                )
            }.onSuccess { state ->
                _uiState.value = state
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message,
                )
            }
        }
    }

    fun transfer(
        toAccountNumber: String,
        amount: BigDecimal,
        description: String?,
        walletPin: String,
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            runCatching {
                walletRepository.transfer(
                    toAccountNumber = toAccountNumber,
                    amount = amount,
                    description = description,
                    walletPin = walletPin,
                )
            }.onSuccess { response ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    lastTransferSucceeded = response.isSuccessful,
                    successMessage = if (response.isSuccessful) "Dana berhasil dikirim." else null,
                    errorMessage = response.errorMessage(),
                )
                if (response.isSuccessful) {
                    refresh()
                }
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message,
                )
            }
        }
    }

    fun topUp(
        amount: BigDecimal,
        walletPin: String,
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            runCatching {
                walletRepository.topUp(amount = amount, walletPin = walletPin)
            }.onSuccess { response ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successMessage = if (response.isSuccessful) "Top up berhasil diproses." else null,
                    errorMessage = response.errorMessage(),
                )
                if (response.isSuccessful) {
                    refresh()
                }
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message,
                )
            }
        }
    }

    fun payQris(
        paymentRequestId: String,
        walletPin: String,
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            runCatching {
                walletRepository.payPaymentRequest(
                    paymentRequestId = paymentRequestId,
                    walletPin = walletPin,
                )
            }.onSuccess { response ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successMessage = if (response.isSuccessful) "Pembayaran QRIS berhasil." else null,
                    errorMessage = response.errorMessage(),
                )
                if (response.isSuccessful) {
                    refresh()
                }
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message,
                )
            }
        }
    }

    fun updateProfile(name: String, phone: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            runCatching {
                walletRepository.updateProfile(name = name, phone = phone)
            }.onSuccess { response ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successMessage = if (response.isSuccessful) "Profil berhasil diperbarui." else null,
                    errorMessage = response.errorMessage(),
                )
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = error.message)
            }
        }
    }

    fun updatePassword(password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            runCatching {
                walletRepository.updatePassword(password = password)
            }.onSuccess { response ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successMessage = if (response.isSuccessful) "Password berhasil diperbarui." else null,
                    errorMessage = response.errorMessage(),
                )
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = error.message)
            }
        }
    }

    fun updatePin(pin: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            runCatching {
                walletRepository.updatePin(pin = pin)
            }.onSuccess { response ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successMessage = if (response.isSuccessful) "PIN berhasil diperbarui." else null,
                    errorMessage = response.errorMessage(),
                )
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = error.message)
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            walletRepository.logout()
        }
    }
}

data class DashboardUiState(
    val isLoading: Boolean = false,
    val balance: BalanceResponse? = null,
    val transactions: List<TransactionDto> = emptyList(),
    val lastTransferSucceeded: Boolean = false,
    val successMessage: String? = null,
    val errorMessage: String? = null,
)

private fun Response<*>.isAuthError(): Boolean = code() == 401 || code() == 403

private fun Response<*>.errorMessage(): String? {
    if (isSuccessful) return null
    val raw = errorBody()?.string().orEmpty()
    if (raw.isBlank()) return "Permintaan gagal. Silakan coba lagi."

    return runCatching {
        val json = JsonParser.parseString(raw).asJsonObject
        json["error"]?.asJsonObject?.get("message")?.asString
            ?: json["message"]?.asString
    }.getOrNull() ?: raw.take(140)
}
