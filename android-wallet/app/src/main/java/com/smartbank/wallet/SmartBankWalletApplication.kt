package com.smartbank.wallet

import android.app.Application
import com.smartbank.wallet.di.AppContainer

class SmartBankWalletApplication : Application() {
    lateinit var appContainer: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        appContainer = AppContainer(this)
    }
}
