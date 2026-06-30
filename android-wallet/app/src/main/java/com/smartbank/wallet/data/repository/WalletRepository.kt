package com.smartbank.wallet.data.repository

import com.smartbank.wallet.data.local.SessionStore
import com.smartbank.wallet.data.remote.AuthResponse
import com.smartbank.wallet.data.remote.BalanceResponse
import com.smartbank.wallet.data.remote.LoginRequest
import com.smartbank.wallet.data.remote.RegisterRequest
import com.smartbank.wallet.data.remote.SmartBankApi
import com.smartbank.wallet.data.remote.TransactionDto
import com.smartbank.wallet.data.remote.TransactionsResponse
import com.smartbank.wallet.data.remote.TransferRequest
import com.smartbank.wallet.data.remote.TransferResponse
import com.smartbank.wallet.data.remote.TopUpRequest
import com.smartbank.wallet.data.remote.UpdateProfileRequest
import com.smartbank.wallet.data.remote.UpdateSecurityRequest
import com.smartbank.wallet.data.remote.WalletLookupResponse
import java.math.BigDecimal
import java.util.UUID
import retrofit2.Response

class WalletRepository(
    private val api: SmartBankApi,
    private val sessionStore: SessionStore,
) {
    val authToken = sessionStore.authToken

    suspend fun register(
        name: String,
        email: String,
        password: String,
        walletPin: String,
    ): Response<AuthResponse> {
        val response = api.register(
            RegisterRequest(
                name = name,
                email = email,
                password = password,
                walletPin = walletPin,
            ),
        )
        return response
    }

    suspend fun login(email: String, password: String): Response<AuthResponse> {
        val response = api.login(LoginRequest(email = email, password = password))
        response.body()?.resolvedToken()?.let { sessionStore.saveAuthToken(it) }
        return response
    }

    suspend fun logout() {
        sessionStore.clear()
    }

    suspend fun getBalance(): Response<BalanceResponse> {
        return api.getBalance(authorization = bearerToken())
    }

    suspend fun getTransactions(): Response<TransactionsResponse> {
        return api.getTransactions(authorization = bearerToken())
    }

    suspend fun lookupWallet(accountNumber: String): Response<WalletLookupResponse> {
        return api.lookupWallet(
            authorization = bearerToken(),
            accountNumber = accountNumber,
        )
    }

    suspend fun transfer(
        toAccountNumber: String,
        amount: BigDecimal,
        description: String?,
        walletPin: String,
        idempotencyKey: String = UUID.randomUUID().toString(),
    ): Response<TransferResponse> {
        return api.transfer(
            authorization = bearerToken(),
            idempotencyKey = idempotencyKey,
            walletPin = walletPin,
            request = TransferRequest(
                toAccountNumber = toAccountNumber,
                amount = amount,
                description = description,
            ),
        )
    }

    suspend fun topUp(
        amount: BigDecimal,
        walletPin: String,
        idempotencyKey: String = UUID.randomUUID().toString(),
    ): Response<TransferResponse> {
        return api.topUp(
            authorization = bearerToken(),
            idempotencyKey = idempotencyKey,
            walletPin = walletPin,
            request = TopUpRequest(amount = amount),
        )
    }

    suspend fun payPaymentRequest(
        paymentRequestId: String,
        walletPin: String,
        idempotencyKey: String = UUID.randomUUID().toString(),
    ): Response<TransferResponse> {
        return api.payPaymentRequest(
            authorization = bearerToken(),
            idempotencyKey = idempotencyKey,
            walletPin = walletPin,
            paymentRequestId = paymentRequestId,
        )
    }

    suspend fun updateProfile(name: String, phone: String?): Response<com.smartbank.wallet.data.remote.BasicMessageResponse> {
        return api.updateProfile(
            authorization = bearerToken(),
            request = UpdateProfileRequest(name = name, phone = phone),
        )
    }

    suspend fun updatePassword(password: String): Response<com.smartbank.wallet.data.remote.BasicMessageResponse> {
        return api.updateSecurity(
            authorization = bearerToken(),
            request = UpdateSecurityRequest(password = password),
        )
    }

    suspend fun updatePin(pin: String): Response<com.smartbank.wallet.data.remote.BasicMessageResponse> {
        return api.updateSecurity(
            authorization = bearerToken(),
            request = UpdateSecurityRequest(pin = pin),
        )
    }

    private suspend fun bearerToken(): String {
        val token = sessionStore.currentToken()
            ?: error("User is not authenticated.")
        return "Bearer $token"
    }
}

private fun AuthResponse.resolvedToken(): String? {
    return token ?: accessToken ?: data?.token ?: data?.accessToken
}
