package com.smartbank.wallet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.smartbank.wallet.ui.AppViewModel
import com.smartbank.wallet.ui.SmartBankViewModelFactory
import com.smartbank.wallet.ui.auth.AuthScreen
import com.smartbank.wallet.ui.auth.AuthViewModel
import com.smartbank.wallet.ui.dashboard.DashboardScreen
import com.smartbank.wallet.ui.dashboard.DashboardViewModel
import com.smartbank.wallet.ui.theme.SmartBankWalletTheme
import com.smartbank.wallet.ui.theme.WalletPrimary
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val appContainer = (application as SmartBankWalletApplication).appContainer
        val viewModelFactory = SmartBankViewModelFactory(appContainer.walletRepository)

        setContent {
            SmartBankWalletTheme {
                SmartBankWalletApp(viewModelFactory = viewModelFactory)
            }
        }
    }
}

@Composable
private fun SmartBankWalletApp(
    viewModelFactory: SmartBankViewModelFactory,
) {
    val appViewModel: AppViewModel = viewModel(factory = viewModelFactory)
    val appUiState by appViewModel.uiState.collectAsState()
    var showSplash by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        delay(1100)
        showSplash = false
    }

    Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            when {
                showSplash -> {
                    SmartBankSplashScreen()
                }

                appUiState.isCheckingSession -> {
                    SmartBankSplashScreen()
                }

                appUiState.isAuthenticated -> {
                    val dashboardViewModel: DashboardViewModel = viewModel(factory = viewModelFactory)
                    DashboardScreen(viewModel = dashboardViewModel)
                }

                else -> {
                    val authViewModel: AuthViewModel = viewModel(factory = viewModelFactory)
                    AuthScreen(viewModel = authViewModel)
                }
            }
        }
    }
}

@Composable
private fun SmartBankSplashScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(WalletPrimary),
    ) {
        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.AccountBalance,
                    contentDescription = "Smart Bank",
                    tint = WalletPrimary,
                    modifier = Modifier.size(58.dp),
                )
            }
        }
        Text(
            text = "Smart Bank",
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 74.dp),
            color = Color.White,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium,
        )
        Text(
            text = "SmartBank Wallet tersinkron",
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 46.dp),
            color = Color.White.copy(alpha = 0.78f),
            style = MaterialTheme.typography.bodySmall,
        )
    }
}
