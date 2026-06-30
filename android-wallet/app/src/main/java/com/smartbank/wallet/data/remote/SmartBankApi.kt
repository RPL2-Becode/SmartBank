package com.smartbank.wallet.data.remote

import com.google.gson.annotations.SerializedName
import java.math.BigDecimal
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.PUT
import retrofit2.http.Query

interface SmartBankApi {
    @POST("api/wallet/v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/wallet/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("api/wallet/v1/wallets/me/balance")
    suspend fun getBalance(
        @Header("Authorization") authorization: String,
    ): Response<BalanceResponse>

    @GET("api/wallet/v1/wallets/me/transactions")
    suspend fun getTransactions(
        @Header("Authorization") authorization: String,
    ): Response<TransactionsResponse>

    @GET("api/wallet/v1/wallets/lookup")
    suspend fun lookupWallet(
        @Header("Authorization") authorization: String,
        @Query("account_number") accountNumber: String,
    ): Response<WalletLookupResponse>

    @POST("api/wallet/v1/transfers")
    suspend fun transfer(
        @Header("Authorization") authorization: String,
        @Header("Idempotency-Key") idempotencyKey: String,
        @Header("X-Wallet-Pin") walletPin: String,
        @Body request: TransferRequest,
    ): Response<TransferResponse>

    @POST("api/wallet/v1/wallets/me/topup")
    suspend fun topUp(
        @Header("Authorization") authorization: String,
        @Header("Idempotency-Key") idempotencyKey: String,
        @Header("X-Wallet-Pin") walletPin: String,
        @Body request: TopUpRequest,
    ): Response<TransferResponse>

    @POST("api/wallet/v1/payment-requests/{id}/pay")
    suspend fun payPaymentRequest(
        @Header("Authorization") authorization: String,
        @Header("Idempotency-Key") idempotencyKey: String,
        @Header("X-Wallet-Pin") walletPin: String,
        @Path("id") paymentRequestId: String,
    ): Response<TransferResponse>

    @PUT("api/wallet/v1/wallets/me/profile")
    suspend fun updateProfile(
        @Header("Authorization") authorization: String,
        @Body request: UpdateProfileRequest,
    ): Response<BasicMessageResponse>

    @PUT("api/wallet/v1/wallets/me/security")
    suspend fun updateSecurity(
        @Header("Authorization") authorization: String,
        @Body request: UpdateSecurityRequest,
    ): Response<BasicMessageResponse>
}

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    @SerializedName("pin") val walletPin: String,
)

data class LoginRequest(
    val email: String,
    val password: String,
)

data class AuthResponse(
    val message: String? = null,
    val token: String? = null,
    @SerializedName(value = "access_token", alternate = ["accessToken"]) val accessToken: String? = null,
    val data: AuthData? = null,
    val user: UserDto? = null,
)

data class AuthData(
    val token: String? = null,
    @SerializedName(value = "access_token", alternate = ["accessToken"]) val accessToken: String? = null,
    @SerializedName(value = "refresh_token", alternate = ["refreshToken"]) val refreshToken: String? = null,
    val user: UserDto? = null,
)

data class UserDto(
    val id: String? = null,
    val name: String? = null,
    val email: String? = null,
    @SerializedName("account_number") val accountNumber: String? = null,
)

data class BalanceResponse(
    val balance: BigDecimal? = null,
    @SerializedName("available_balance") val availableBalance: BigDecimal? = null,
    @SerializedName("hold_balance") val holdBalance: BigDecimal? = null,
    @SerializedName("account_number") val accountNumber: String? = null,
    @SerializedName("holder_name") val holderName: String? = null,
    val currency: String? = null,
    val data: BalanceData? = null,
)

data class BalanceData(
    val balance: BigDecimal? = null,
    @SerializedName("available_balance") val availableBalance: BigDecimal? = null,
    @SerializedName("hold_balance") val holdBalance: BigDecimal? = null,
    @SerializedName("account_number") val accountNumber: String? = null,
    @SerializedName("holder_name") val holderName: String? = null,
    val currency: String? = null,
)

data class TransactionsResponse(
    val transactions: List<TransactionDto>? = null,
    val data: List<TransactionDto>? = null,
)

data class TransactionDto(
    val id: String? = null,
    val type: String? = null,
    val amount: BigDecimal? = null,
    val status: String? = null,
    val description: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("counterparty_name") val counterpartyName: String? = null,
    @SerializedName("counterparty_account_number") val counterpartyAccountNumber: String? = null,
)

data class WalletLookupResponse(
    val data: WalletLookupDto? = null,
    val wallet: WalletLookupDto? = null,
)

data class WalletLookupDto(
    val name: String? = null,
    @SerializedName("account_number") val accountNumber: String? = null,
)

data class TransferRequest(
    @SerializedName("to_account_number") val toAccountNumber: String,
    val amount: BigDecimal,
    @SerializedName("note") val description: String? = null,
)

data class TopUpRequest(
    val amount: BigDecimal,
)

data class UpdateProfileRequest(
    val name: String,
    val phone: String? = null,
)

data class UpdateSecurityRequest(
    val password: String? = null,
    val pin: String? = null,
)

data class TransferResponse(
    val message: String? = null,
    @SerializedName("transaction_id") val transactionId: String? = null,
    val data: TransactionDto? = null,
)

data class BasicMessageResponse(
    val message: String? = null,
)
