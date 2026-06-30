package com.smartbank.wallet.di

import android.content.Context
import com.smartbank.wallet.data.local.SessionStore
import com.smartbank.wallet.data.remote.NetworkModule
import com.smartbank.wallet.data.repository.WalletRepository

class AppContainer(context: Context) {
    private val sessionStore = SessionStore(context.applicationContext)
    private val smartBankApi = NetworkModule.createSmartBankApi()

    val walletRepository = WalletRepository(
        api = smartBankApi,
        sessionStore = sessionStore,
    )
}
