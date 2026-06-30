package com.smartbank.wallet.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.smartbank.wallet.data.repository.WalletRepository
import com.smartbank.wallet.ui.auth.AuthViewModel
import com.smartbank.wallet.ui.dashboard.DashboardViewModel

class SmartBankViewModelFactory(
    private val walletRepository: WalletRepository,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(AppViewModel::class.java) -> {
                AppViewModel(walletRepository) as T
            }

            modelClass.isAssignableFrom(AuthViewModel::class.java) -> {
                AuthViewModel(walletRepository) as T
            }

            modelClass.isAssignableFrom(DashboardViewModel::class.java) -> {
                DashboardViewModel(walletRepository) as T
            }

            else -> error("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
