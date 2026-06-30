package com.smartbank.wallet.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowOutward
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.CurrencyExchange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.VpnKey
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.smartbank.wallet.data.remote.BalanceResponse
import com.smartbank.wallet.data.remote.TransactionDto
import com.smartbank.wallet.ui.auth.collectAsStateWithLifecycleBridge
import com.smartbank.wallet.ui.theme.WalletBg
import com.smartbank.wallet.ui.theme.WalletDebitBg
import com.smartbank.wallet.ui.theme.WalletError
import com.smartbank.wallet.ui.theme.WalletPrimary
import com.smartbank.wallet.ui.theme.WalletPrimaryDark
import com.smartbank.wallet.ui.theme.WalletSuccess
import com.smartbank.wallet.ui.theme.WalletSuccessBg
import com.smartbank.wallet.ui.theme.WalletSurface
import com.smartbank.wallet.ui.theme.WalletTextPrimary
import com.smartbank.wallet.ui.theme.WalletTextSecondary
import com.smartbank.wallet.ui.theme.WalletTextTertiary
import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycleBridge()
    val snackbarHostState = remember { SnackbarHostState() }
    var selectedTab by rememberSaveable { mutableStateOf(DashboardTab.Home) }
    var showTransferDialog by rememberSaveable { mutableStateOf(false) }
    var showPayDialog by rememberSaveable { mutableStateOf(false) }
    var showTopUpDialog by rememberSaveable { mutableStateOf(false) }
    var showEditProfileDialog by rememberSaveable { mutableStateOf(false) }
    var showChangePinDialog by rememberSaveable { mutableStateOf(false) }
    var showChangePasswordDialog by rememberSaveable { mutableStateOf(false) }
    var showHelpDialog by rememberSaveable { mutableStateOf(false) }
    var showLanguageDialog by rememberSaveable { mutableStateOf(false) }
    var selectedLanguage by rememberSaveable { mutableStateOf("Indonesia") }
    var isBalanceVisible by rememberSaveable { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.refresh()
    }

    LaunchedEffect(uiState.errorMessage, uiState.successMessage) {
        uiState.errorMessage?.let { snackbarHostState.showSnackbar(it) }
        uiState.successMessage?.let { snackbarHostState.showSnackbar(it) }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(WalletBg),
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (selectedTab == DashboardTab.Home) {
                item {
                    HomeHeader(
                        balance = uiState.balance,
                        isBalanceVisible = isBalanceVisible,
                        isLoading = uiState.isLoading,
                        onToggleBalance = { isBalanceVisible = !isBalanceVisible },
                        onRefresh = viewModel::refresh,
                        onLogout = viewModel::logout,
                    )
                }
            }

            if (selectedTab == DashboardTab.Home) {
                item {
                    QuickActionPanel(
                        onTransfer = { showTransferDialog = true },
                        onPay = { showPayDialog = true },
                        onTopUp = { showTopUpDialog = true },
                        onHistory = { selectedTab = DashboardTab.Mutasi },
                    )
                }

                item {
                    InsightStrip()
                }
            }

            if (uiState.isLoading) {
                item {
                    LinearProgressIndicator(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 18.dp),
                    )
                }
            }

            when (selectedTab) {
                DashboardTab.Home -> {
                    item {
                        SectionHeader(
                            title = "Aktivitas Terbaru",
                            trailing = "${uiState.transactions.size} transaksi",
                        )
                    }
                    if (uiState.transactions.isEmpty()) {
                        item { EmptyTransactionState() }
                    } else {
                        items(uiState.transactions.take(5)) { transaction ->
                            TransactionItemRow(transaction = transaction)
                        }
                    }
                }

                DashboardTab.Mutasi -> {
                    item {
                        MutasiContent(
                            balance = uiState.balance,
                            transactions = uiState.transactions,
                        )
                    }
                }

                DashboardTab.Inbox -> {
                    item { InboxContent() }
                }

                DashboardTab.Account -> {
                    item {
                        AccountContent(
                            balance = uiState.balance,
                            isLoading = uiState.isLoading,
                            onEditProfile = { showEditProfileDialog = true },
                            onChangePin = { showChangePinDialog = true },
                            onChangePassword = { showChangePasswordDialog = true },
                            onLanguage = { showLanguageDialog = true },
                            onHelp = { showHelpDialog = true },
                            onLogout = viewModel::logout,
                        )
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(112.dp)) }
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp),
        )

        if (showTransferDialog) {
            TransferDialog(
                isLoading = uiState.isLoading,
                onDismiss = { showTransferDialog = false },
                onConfirm = { accountNumber, amount, description, pin ->
                    viewModel.transfer(
                        toAccountNumber = accountNumber,
                        amount = amount,
                        description = description,
                        walletPin = pin,
                    )
                    showTransferDialog = false
                },
            )
        }

        if (showPayDialog) {
            PayQrisDialog(
                isLoading = uiState.isLoading,
                onDismiss = { showPayDialog = false },
                onConfirm = { paymentRequestId, pin ->
                    viewModel.payQris(paymentRequestId = paymentRequestId, walletPin = pin)
                    showPayDialog = false
                },
            )
        }

        if (showTopUpDialog) {
            TopUpDialog(
                isLoading = uiState.isLoading,
                onDismiss = { showTopUpDialog = false },
                onConfirm = { amount, pin ->
                    viewModel.topUp(amount = amount, walletPin = pin)
                    showTopUpDialog = false
                },
            )
        }

        if (showEditProfileDialog) {
            EditProfileDialog(
                isLoading = uiState.isLoading,
                onDismiss = { showEditProfileDialog = false },
                onConfirm = { name, phone ->
                    viewModel.updateProfile(name = name, phone = phone)
                    showEditProfileDialog = false
                },
            )
        }

        if (showChangePinDialog) {
            ChangePinDialog(
                isLoading = uiState.isLoading,
                onDismiss = { showChangePinDialog = false },
                onConfirm = { pin ->
                    viewModel.updatePin(pin = pin)
                    showChangePinDialog = false
                },
            )
        }

        if (showChangePasswordDialog) {
            ChangePasswordDialog(
                isLoading = uiState.isLoading,
                onDismiss = { showChangePasswordDialog = false },
                onConfirm = { password ->
                    viewModel.updatePassword(password = password)
                    showChangePasswordDialog = false
                },
            )
        }

        if (showHelpDialog) {
            HelpCenterDialog(onDismiss = { showHelpDialog = false })
        }

        if (showLanguageDialog) {
            LanguageDialog(
                selectedLanguage = selectedLanguage,
                onDismiss = { showLanguageDialog = false },
                onSelected = { language ->
                    selectedLanguage = language
                    showLanguageDialog = false
                },
            )
        }

        HomeBottomBar(
            modifier = Modifier.align(Alignment.BottomCenter),
            selectedTab = selectedTab,
            onTabSelected = { selectedTab = it },
            onPay = { showPayDialog = true },
        )
    }
}

private enum class DashboardTab {
    Home,
    Mutasi,
    Inbox,
    Account,
}

@Composable
private fun HomeHeader(
    balance: BalanceResponse?,
    isBalanceVisible: Boolean,
    isLoading: Boolean,
    onToggleBalance: () -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(WalletPrimary)
            .padding(start = 18.dp, end = 18.dp, top = 18.dp, bottom = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.AccountBalance,
                    contentDescription = "Smart Bank",
                    tint = WalletPrimary,
                    modifier = Modifier.size(25.dp),
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Smart Bank",
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    text = "SmartBank Wallet tersinkron",
                    color = Color.White.copy(alpha = 0.78f),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            IconButton(onClick = onRefresh, enabled = !isLoading) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Color.White)
            }
            IconButton(onClick = onLogout) {
                Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Logout", tint = Color.White)
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            text = "Saldo Tersedia",
                            color = WalletTextSecondary,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = if (isBalanceVisible) balance.displayAmount() else "••••••••",
                                color = WalletPrimaryDark,
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Medium,
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            IconButton(
                                onClick = onToggleBalance,
                                modifier = Modifier.size(34.dp),
                            ) {
                                Icon(
                                    imageVector = if (isBalanceVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = if (isBalanceVisible) "Sembunyikan saldo" else "Tampilkan saldo",
                                    tint = WalletTextSecondary,
                                    modifier = Modifier.size(20.dp),
                                )
                            }
                        }
                    }
                    Icon(
                        Icons.Default.AccountBalance,
                        contentDescription = null,
                        tint = WalletPrimary,
                        modifier = Modifier.size(28.dp),
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    MiniInfo(label = "Rekening", value = balance.accountNumberText())
                }
            }
        }
    }
}

@Composable
private fun MiniInfo(label: String, value: String) {
    Column(modifier = Modifier.fillMaxWidth(0.48f)) {
        Text(label, color = WalletTextTertiary, style = MaterialTheme.typography.labelSmall)
        Text(
            text = value,
            color = WalletTextPrimary,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun QuickActionPanel(
    onTransfer: () -> Unit,
    onPay: () -> Unit,
    onTopUp: () -> Unit,
    onHistory: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = WalletSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            QuickAction("Kirim", Icons.AutoMirrored.Filled.Send, onTransfer)
            QuickAction("Bayar", Icons.Default.Payment, onPay)
            QuickAction("Top Up", Icons.Default.AccountBalanceWallet, onTopUp)
            QuickAction("Riwayat", Icons.AutoMirrored.Filled.ReceiptLong, onHistory)
        }
    }
}

@Composable
private fun TabIntroCard(title: String, body: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = WalletSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFEAF6FF)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.AccountBalance, contentDescription = null, tint = WalletPrimary)
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(title, color = WalletTextPrimary, style = MaterialTheme.typography.titleMedium)
                Text(body, color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun QuickAction(label: String, icon: ImageVector, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Color(0xFFEAF3FF)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = label, tint = WalletPrimary, modifier = Modifier.size(23.dp))
        }
        Text(label, color = WalletTextPrimary, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun InsightStrip() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF7F2)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(WalletSuccessBg),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.Security, contentDescription = null, tint = WalletSuccess, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text("Transaksi aman", color = WalletTextPrimary, fontWeight = FontWeight.Medium)
                Text(
                    "PIN dan idempotency key dipakai untuk melindungi transaksi finansial.",
                    color = WalletTextSecondary,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}

@Composable
private fun HomeBottomBar(
    modifier: Modifier = Modifier,
    selectedTab: DashboardTab,
    onTabSelected: (DashboardTab) -> Unit,
    onPay: () -> Unit,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.White)
            .padding(horizontal = 18.dp, vertical = 10.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.Center),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BottomNavItem(
                label = "Home",
                icon = Icons.Default.Home,
                selected = selectedTab == DashboardTab.Home,
                onClick = { onTabSelected(DashboardTab.Home) },
            )
            BottomNavItem(
                label = "Mutasi",
                icon = Icons.AutoMirrored.Filled.ReceiptLong,
                selected = selectedTab == DashboardTab.Mutasi,
                onClick = { onTabSelected(DashboardTab.Mutasi) },
            )
            Spacer(modifier = Modifier.width(76.dp))
            BottomNavItem(
                label = "Inbox",
                icon = Icons.Default.MailOutline,
                selected = selectedTab == DashboardTab.Inbox,
                onClick = { onTabSelected(DashboardTab.Inbox) },
            )
            BottomNavItem(
                label = "Akun",
                icon = Icons.Default.Person,
                selected = selectedTab == DashboardTab.Account,
                onClick = { onTabSelected(DashboardTab.Account) },
            )
        }

        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .clip(CircleShape)
                .clickable { onPay() },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                modifier = Modifier
                    .size(68.dp)
                    .clip(CircleShape)
                    .background(WalletPrimary),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.QrCodeScanner,
                    contentDescription = "Pay",
                    tint = Color.White,
                    modifier = Modifier.size(31.dp),
                )
            }
            Text(
                text = "PAY",
                color = WalletPrimary,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

@Composable
private fun BottomNavItem(
    label: String,
    icon: ImageVector,
    selected: Boolean = false,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 6.dp, vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(
            icon,
            contentDescription = label,
            tint = if (selected) WalletPrimary else WalletTextTertiary,
            modifier = Modifier.size(25.dp),
        )
        Text(
            text = label,
            color = if (selected) WalletPrimary else WalletTextTertiary,
            style = MaterialTheme.typography.labelSmall,
        )
    }
}

@Composable
private fun SectionHeader(title: String, trailing: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, color = WalletTextPrimary, style = MaterialTheme.typography.titleMedium)
        Text(trailing, color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun EmptyTransactionState() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = WalletSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(26.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(Icons.AutoMirrored.Filled.ReceiptLong, contentDescription = null, tint = WalletTextTertiary)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Belum ada transaksi", color = WalletTextPrimary, fontWeight = FontWeight.Medium)
            Text("Aktivitas terbaru akan muncul di sini.", color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun MutasiContent(
    balance: BalanceResponse?,
    transactions: List<TransactionDto>,
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .clip(RoundedCornerShape(100.dp))
                .background(Color.White)
                .padding(vertical = 14.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text("Mutasi Transaksi", color = WalletPrimary, fontWeight = FontWeight.Medium)
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = WalletSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Sumber Rekening", color = WalletTextPrimary, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            balance.accountNumberText(),
                            color = WalletPrimary,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Icon(Icons.Default.ChevronRight, contentDescription = null, tint = WalletTextTertiary)
                }
            }
            Button(
                onClick = {},
                modifier = Modifier.height(70.dp),
                colors = ButtonDefaults.buttonColors(containerColor = WalletPrimary),
                shape = RoundedCornerShape(8.dp),
            ) {
                Text("Hari Ini")
            }
        }

        if (transactions.isEmpty()) {
            MutasiEmptyState()
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                transactions.forEach { transaction ->
                    TransactionItemRow(transaction = transaction)
                }
            }
        }
    }
}

@Composable
private fun MutasiEmptyState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp, vertical = 90.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Box(
            modifier = Modifier
                .size(112.dp)
                .clip(CircleShape)
                .background(Color(0xFFEAF6FF)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ReceiptLong,
                contentDescription = null,
                tint = WalletPrimary,
                modifier = Modifier.size(54.dp),
            )
        }
        Text(
            text = "Riwayat mutasi tidak ditemukan. Cari di tanggal lainnya.",
            color = WalletTextPrimary,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 18.dp),
        )
    }
}

@Composable
private fun InboxContent() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SectionHeader(title = "Inbox", trailing = "2 pesan")
        InboxCard(
            title = "QRIS SmartBank aktif",
            body = "Pembayaran QRIS memakai ID payment request dan PIN Wallet.",
        )
        InboxCard(
            title = "Keamanan transaksi",
            body = "Setiap pembayaran menggunakan Idempotency-Key agar transaksi tidak dobel.",
        )
    }
}

@Composable
private fun InboxCard(title: String, body: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = WalletSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFEAF3FF)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.MailOutline, contentDescription = null, tint = WalletPrimary)
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(title, color = WalletTextPrimary, fontWeight = FontWeight.Medium)
                Text(body, color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun AccountContent(
    balance: BalanceResponse?,
    isLoading: Boolean,
    onEditProfile: () -> Unit,
    onChangePin: () -> Unit,
    onChangePassword: () -> Unit,
    onLanguage: () -> Unit,
    onHelp: () -> Unit,
    onLogout: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp),
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onEditProfile() }
                    .padding(18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFECEFF3)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("SB", color = WalletPrimary, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = balance?.data?.holderName ?: balance?.holderName ?: "SMART BANK USER",
                        color = WalletTextPrimary,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = WalletPrimary)
            }
        }

        AccountSection(title = "Pengaturan") {
            AccountMenuRow(Icons.Default.AccountBalanceWallet, "Update Rekening", onEditProfile)
            AccountMenuRow(Icons.Default.CreditCard, "Pengelolaan Kartu", onHelp)
            AccountMenuRow(Icons.Default.Translate, "Bahasa", onLanguage)
        }

        AccountSection(title = "Keamanan") {
            AccountMenuRow(Icons.Default.VpnKey, "Ubah Pin", onChangePin)
            AccountMenuRow(Icons.Default.Lock, "Ubah Password", onChangePassword)
        }

        AccountSection(title = "Kontak Smart Bank") {
            AccountMenuRow(Icons.Default.HelpOutline, "Pusat Bantuan", onHelp)
            AccountMenuRow(Icons.Default.SupportAgent, "Chat Banking", onHelp)
            AccountMenuRow(Icons.Default.Phone, "Layanan Bebas Pulsa", onHelp)
            AccountMenuRow(Icons.Default.Person, "Kontak Kami", onHelp)
        }

        AccountSection(title = "Informasi") {
            AccountMenuRow(Icons.Default.Article, "Jenis & Limit Transaksi", onHelp)
            AccountMenuRow(Icons.Default.CurrencyExchange, "Info Kurs", onHelp)
            AccountMenuRow(Icons.Default.ShowChart, "UMKM Insight", onHelp)
            AccountMenuRow(Icons.Default.Info, "Tentang Smart Bank", onHelp)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = !isLoading) { onLogout() }
                    .padding(horizontal = 16.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.Logout,
                    contentDescription = null,
                    tint = WalletError,
                    modifier = Modifier.size(23.dp),
                )
                Spacer(modifier = Modifier.width(14.dp))
                Text("Logout", color = WalletError, style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.weight(1f))
                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = WalletPrimary)
            }
        }

        Text(
            text = "Versi Aplikasi 1.0.0",
            modifier = Modifier.align(Alignment.CenterHorizontally),
            color = WalletTextTertiary,
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun AccountSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text = title,
            color = WalletTextPrimary,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                content()
            }
        }
    }
}

@Composable
private fun AccountMenuRow(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 18.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = WalletTextTertiary, modifier = Modifier.size(23.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, color = WalletTextPrimary, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
        Icon(
            Icons.Default.ChevronRight,
            contentDescription = null,
            tint = WalletPrimary,
        )
    }
}

@Composable
private fun EditProfileDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (name: String, phone: String?) -> Unit,
) {
    var name by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var validationError by rememberSaveable { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Edit Profil", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        validationError = null
                    },
                    label = { Text("Nama lengkap") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = {
                        phone = it
                        validationError = null
                    },
                    label = { Text("Nomor handphone") },
                    placeholder = { Text("Opsional, contoh: 081234567890") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                )
                validationError?.let {
                    Text(it, color = WalletError, style = MaterialTheme.typography.bodySmall)
                }
                DialogActions(
                    confirmText = "Simpan",
                    isLoading = isLoading,
                    onDismiss = onDismiss,
                    onConfirm = {
                        when {
                            name.trim().isBlank() -> validationError = "Nama lengkap wajib diisi"
                            else -> onConfirm(name.trim(), phone.trim().ifBlank { null })
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun ChangePinDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (pin: String) -> Unit,
) {
    var pin by rememberSaveable { mutableStateOf("") }
    var validationError by rememberSaveable { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Ubah PIN", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                Text("Gunakan PIN transaksi 6 digit.", color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(
                    value = pin,
                    onValueChange = {
                        pin = it.filter(Char::isDigit).take(6)
                        validationError = null
                    },
                    label = { Text("PIN baru") },
                    supportingText = { Text("${pin.length}/6 digit") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                )
                validationError?.let {
                    Text(it, color = WalletError, style = MaterialTheme.typography.bodySmall)
                }
                DialogActions(
                    confirmText = "Ubah PIN",
                    isLoading = isLoading,
                    onDismiss = onDismiss,
                    onConfirm = {
                        if (pin.length != 6) {
                            validationError = "PIN harus tepat 6 digit"
                        } else {
                            onConfirm(pin)
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun ChangePasswordDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (password: String) -> Unit,
) {
    var password by rememberSaveable { mutableStateOf("") }
    var validationError by rememberSaveable { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Ubah Password", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                Text("Password minimal 8 karakter.", color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(
                    value = password,
                    onValueChange = {
                        password = it
                        validationError = null
                    },
                    label = { Text("Password baru") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                )
                validationError?.let {
                    Text(it, color = WalletError, style = MaterialTheme.typography.bodySmall)
                }
                DialogActions(
                    confirmText = "Ubah Password",
                    isLoading = isLoading,
                    onDismiss = onDismiss,
                    onConfirm = {
                        if (password.length < 8) {
                            validationError = "Password minimal 8 karakter"
                        } else {
                            onConfirm(password)
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun HelpCenterDialog(onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFEAF6FF)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.SupportAgent, contentDescription = null, tint = WalletPrimary)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Pusat Bantuan", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                        Text("Chat banking dan call service", color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
                    }
                }
                HelpContactRow(title = "Chat Banking", body = "Mulai percakapan dengan asisten Smart Bank.")
                HelpContactRow(title = "Call Service", body = "Hubungi 1500-088 untuk bantuan akun.")
                HelpContactRow(title = "Email Bantuan", body = "support@smartbank.local")
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = WalletPrimary),
                    shape = RoundedCornerShape(8.dp),
                ) {
                    Text("Mengerti")
                }
            }
        }
    }
}

@Composable
private fun LanguageDialog(
    selectedLanguage: String,
    onDismiss: () -> Unit,
    onSelected: (String) -> Unit,
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Bahasa", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                Text(
                    "Pilih bahasa tampilan aplikasi.",
                    color = WalletTextSecondary,
                    style = MaterialTheme.typography.bodySmall,
                )
                LanguageOption(
                    title = "Indonesia",
                    subtitle = "Bahasa Indonesia",
                    selected = selectedLanguage == "Indonesia",
                    onClick = { onSelected("Indonesia") },
                )
                LanguageOption(
                    title = "English",
                    subtitle = "English language",
                    selected = selectedLanguage == "English",
                    onClick = { onSelected("English") },
                )
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = WalletPrimary),
                    shape = RoundedCornerShape(8.dp),
                ) {
                    Text("Tutup")
                }
            }
        }
    }
}

@Composable
private fun LanguageOption(
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) Color(0xFFEAF6FF) else Color(0xFFF8FAFF))
            .clickable { onClick() }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            Icons.Default.Language,
            contentDescription = null,
            tint = if (selected) WalletPrimary else WalletTextTertiary,
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = WalletTextPrimary, fontWeight = FontWeight.Medium)
            Text(subtitle, color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
        }
        if (selected) {
            Text("Aktif", color = WalletPrimary, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun HelpContactRow(title: String, body: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFFF6FAFF))
            .padding(12.dp),
    ) {
        Text(title, color = WalletTextPrimary, fontWeight = FontWeight.Medium)
        Text(body, color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun TransactionItemRow(transaction: TransactionDto) {
    val isDebit = transaction.type?.contains("OUT", ignoreCase = true) == true ||
        transaction.type?.contains("DEBIT", ignoreCase = true) == true ||
        transaction.amount?.signum() == -1
    val amountPrefix = if (isDebit) "-" else "+"
    val amount = transaction.amount?.abs()
    val statusText = listOfNotNull(
        transaction.status,
        transaction.counterpartyAccountNumber,
        transaction.createdAt,
    ).joinToString(" | ")

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = WalletSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(if (isDebit) WalletDebitBg else WalletSuccessBg),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (isDebit) Icons.Default.ArrowOutward else Icons.Default.ArrowDownward,
                    contentDescription = null,
                    tint = if (isDebit) WalletTextSecondary else WalletSuccess,
                    modifier = Modifier.size(18.dp),
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = transaction.counterpartyName ?: transaction.description ?: transaction.type ?: "Transaksi",
                    color = WalletTextPrimary,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = statusText.ifBlank { "SmartBank ledger" },
                    color = WalletTextTertiary,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Text(
                text = "$amountPrefix ${formatWholeAmount(amount)}",
                color = if (isDebit) WalletTextPrimary else WalletSuccess,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

@Composable
private fun TransferDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (accountNumber: String, amount: BigDecimal, description: String?, pin: String) -> Unit,
) {
    var accountNumber by rememberSaveable { mutableStateOf("") }
    var amount by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var pin by rememberSaveable { mutableStateOf("") }
    var validationError by rememberSaveable { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Kirim Saldo", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                OutlinedTextField(
                    value = accountNumber,
                    onValueChange = { accountNumber = it.trim() },
                    label = { Text("Nomor rekening tujuan") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                OutlinedTextField(
                    value = amount,
                    onValueChange = {
                        amount = it.filter { char -> char.isDigit() || char == '.' }
                        validationError = null
                    },
                    label = { Text("Nominal") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Catatan") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = pin,
                    onValueChange = { pin = it.filter(Char::isDigit).take(6) },
                    label = { Text("PIN Wallet") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                )

                validationError?.let {
                    Text(it, color = WalletError, style = MaterialTheme.typography.bodySmall)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Batal", color = WalletTextSecondary)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val parsedAmount = amount.toBigDecimalOrNull()
                            when {
                                accountNumber.isBlank() -> validationError = "Nomor rekening tujuan wajib diisi"
                                parsedAmount == null || parsedAmount <= BigDecimal.ZERO -> validationError = "Nominal harus valid"
                                pin.length != 6 -> validationError = "PIN Wallet harus 6 digit"
                                else -> onConfirm(accountNumber, parsedAmount, description.takeIf(String::isNotBlank), pin)
                            }
                        },
                        enabled = !isLoading,
                        colors = ButtonDefaults.buttonColors(containerColor = WalletPrimary),
                    ) {
                        Text("Kirim")
                    }
                }
            }
        }
    }
}

@Composable
private fun PayQrisDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (paymentRequestId: String, pin: String) -> Unit,
) {
    var paymentRequestId by rememberSaveable { mutableStateOf("") }
    var pin by rememberSaveable { mutableStateOf("") }
    var validationError by rememberSaveable { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFEAF3FF)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = WalletPrimary)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Bayar QRIS", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                        Text("Masukkan ID invoice/payment request.", color = WalletTextSecondary, style = MaterialTheme.typography.bodySmall)
                    }
                }

                OutlinedTextField(
                    value = paymentRequestId,
                    onValueChange = {
                        paymentRequestId = it.trim()
                        validationError = null
                    },
                    label = { Text("ID QRIS / Payment Request") },
                    placeholder = { Text("contoh: payreq_xxxxx") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )

                OutlinedTextField(
                    value = pin,
                    onValueChange = {
                        pin = it.filter(Char::isDigit).take(6)
                        validationError = null
                    },
                    label = { Text("PIN Wallet") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                )

                validationError?.let {
                    Text(it, color = WalletError, style = MaterialTheme.typography.bodySmall)
                }

                DialogActions(
                    confirmText = "Bayar",
                    isLoading = isLoading,
                    onDismiss = onDismiss,
                    onConfirm = {
                        when {
                            paymentRequestId.isBlank() -> validationError = "ID QRIS wajib diisi"
                            pin.length != 6 -> validationError = "PIN Wallet harus 6 digit"
                            else -> onConfirm(paymentRequestId, pin)
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun TopUpDialog(
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (amount: BigDecimal, pin: String) -> Unit,
) {
    var amount by rememberSaveable { mutableStateOf("") }
    var pin by rememberSaveable { mutableStateOf("") }
    var validationError by rememberSaveable { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = WalletSurface),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text("Top Up Saldo", style = MaterialTheme.typography.titleLarge, color = WalletPrimary)
                Text(
                    "Top up simulasi akan menambah saldo wallet melalui backend SmartBank.",
                    color = WalletTextSecondary,
                    style = MaterialTheme.typography.bodySmall,
                )
                OutlinedTextField(
                    value = amount,
                    onValueChange = {
                        amount = it.filter(Char::isDigit)
                        validationError = null
                    },
                    label = { Text("Nominal top up") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                OutlinedTextField(
                    value = pin,
                    onValueChange = {
                        pin = it.filter(Char::isDigit).take(6)
                        validationError = null
                    },
                    label = { Text("PIN Wallet") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                )

                validationError?.let {
                    Text(it, color = WalletError, style = MaterialTheme.typography.bodySmall)
                }

                DialogActions(
                    confirmText = "Top Up",
                    isLoading = isLoading,
                    onDismiss = onDismiss,
                    onConfirm = {
                        val parsedAmount = amount.toBigDecimalOrNull()
                        when {
                            parsedAmount == null || parsedAmount <= BigDecimal.ZERO -> validationError = "Nominal top up harus valid"
                            pin.length != 6 -> validationError = "PIN Wallet harus 6 digit"
                            else -> onConfirm(parsedAmount, pin)
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun DialogActions(
    confirmText: String,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TextButton(onClick = onDismiss) {
            Text("Batal", color = WalletTextSecondary)
        }
        Spacer(modifier = Modifier.width(8.dp))
        Button(
            onClick = onConfirm,
            enabled = !isLoading,
            colors = ButtonDefaults.buttonColors(containerColor = WalletPrimary),
        ) {
            Text(confirmText)
        }
    }
}

private fun BalanceResponse?.displayAmount(): String {
    val amount = this?.balance ?: this?.availableBalance ?: this?.data?.balance ?: this?.data?.availableBalance
    return formatWholeAmount(amount)
}

private fun BalanceResponse?.holdAmount(): BigDecimal? {
    return this?.holdBalance ?: this?.data?.holdBalance
}

private fun BalanceResponse?.accountNumberText(): String {
    return this?.accountNumber ?: this?.data?.accountNumber ?: "Belum dimuat"
}

private fun formatWholeAmount(amount: BigDecimal?): String {
    if (amount == null) return "-"
    return NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount)
}
