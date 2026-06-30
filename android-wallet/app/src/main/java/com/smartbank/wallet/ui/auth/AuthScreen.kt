package com.smartbank.wallet.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
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
import com.smartbank.wallet.ui.theme.WalletBg
import com.smartbank.wallet.ui.theme.WalletError
import com.smartbank.wallet.ui.theme.WalletPrimary
import com.smartbank.wallet.ui.theme.WalletSuccess
import com.smartbank.wallet.ui.theme.WalletSuccessBg
import com.smartbank.wallet.ui.theme.WalletSurface
import com.smartbank.wallet.ui.theme.WalletTextPrimary
import com.smartbank.wallet.ui.theme.WalletTextSecondary
import com.smartbank.wallet.ui.theme.WalletTextTertiary

@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycleBridge()
    var isRegister by rememberSaveable { mutableStateOf(false) }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var walletPin by rememberSaveable { mutableStateOf("") }
    var formError by rememberSaveable { mutableStateOf<String?>(null) }
    var showRegisterSuccessDialog by rememberSaveable { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.registrationSucceeded) {
        if (uiState.registrationSucceeded) {
            isRegister = false
            password = ""
            walletPin = ""
            formError = null
            showRegisterSuccessDialog = true
        }
    }

    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { snackbarHostState.showSnackbar(it) }
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { snackbarHostState.showSnackbar(it) }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(WalletBg)
            .navigationBarsPadding()
            .imePadding(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
        ) {
            AuthHero(isRegister = isRegister)

            AuthFormCard(
                isRegister = isRegister,
                name = name,
                email = email,
                password = password,
                walletPin = walletPin,
                formError = formError,
                uiState = uiState,
                onModeChanged = {
                    isRegister = it
                    formError = null
                    viewModel.clearMessage()
                },
                onNameChanged = {
                    name = it
                    formError = null
                },
                onEmailChanged = {
                    email = it
                    formError = null
                },
                onPasswordChanged = {
                    password = it
                    formError = null
                },
                onWalletPinChanged = {
                    walletPin = it.filter(Char::isDigit).take(6)
                    formError = null
                },
                onSubmit = {
                    val validationMessage = validateAuthForm(
                        isRegister = isRegister,
                        name = name,
                        email = email,
                        password = password,
                        walletPin = walletPin,
                    )
                    if (validationMessage != null) {
                        formError = validationMessage
                        return@AuthFormCard
                    }

                    formError = null
                    if (isRegister) {
                        viewModel.register(
                            name = name.trim(),
                            email = email.trim(),
                            password = password,
                            walletPin = walletPin,
                        )
                    } else {
                        viewModel.login(email = email.trim(), password = password)
                    }
                },
            )

            Spacer(modifier = Modifier.height(22.dp))
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp),
        )

        if (showRegisterSuccessDialog) {
            AlertDialog(
                onDismissRequest = {
                    showRegisterSuccessDialog = false
                    viewModel.clearMessage()
                },
                title = { Text("Registrasi berhasil") },
                text = {
                    Text("Akun SmartBank Wallet sudah dibuat. Silakan login dengan email dan password yang baru didaftarkan.")
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showRegisterSuccessDialog = false
                            viewModel.clearMessage()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = WalletPrimary),
                    ) {
                        Text("Login Sekarang")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            showRegisterSuccessDialog = false
                            viewModel.clearMessage()
                        },
                    ) {
                        Text("Tutup")
                    }
                },
            )
        }
    }
}

@Composable
private fun AuthHero(isRegister: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(WalletPrimary)
            .padding(start = 22.dp, end = 22.dp, top = 30.dp, bottom = 34.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.AccountBalance,
                    contentDescription = "Smart Bank",
                    tint = WalletPrimary,
                    modifier = Modifier.size(28.dp),
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Smart Bank",
                    color = Color.White,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    text = "SmartBank Wallet",
                    color = Color.White.copy(alpha = 0.78f),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = if (isRegister) "Buat wallet baru" else "Masuk ke wallet Anda",
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Medium,
            )
            Text(
                text = if (isRegister) {
                    "Dapatkan saldo awal 50.000 CBDC_IDR setelah akun berhasil dibuat."
                } else {
                    "Pantau saldo, riwayat, dan transaksi SmartBank secara real-time."
                },
                color = Color.White.copy(alpha = 0.82f),
                style = MaterialTheme.typography.bodyMedium,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HeroChip(icon = Icons.Default.Security, text = "PIN aman")
            HeroChip(icon = Icons.Default.Payments, text = "Saldo 50K")
        }
    }
}

@Composable
private fun HeroChip(icon: ImageVector, text: String) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(100.dp))
            .background(Color.White.copy(alpha = 0.16f))
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
        Text(text, color = Color.White, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun AuthFormCard(
    isRegister: Boolean,
    name: String,
    email: String,
    password: String,
    walletPin: String,
    formError: String?,
    uiState: AuthUiState,
    onModeChanged: (Boolean) -> Unit,
    onNameChanged: (String) -> Unit,
    onEmailChanged: (String) -> Unit,
    onPasswordChanged: (String) -> Unit,
    onWalletPinChanged: (String) -> Unit,
    onSubmit: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp)
            .padding(top = 18.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = WalletSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            AuthModeSwitch(isRegister = isRegister, onModeChanged = onModeChanged)

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFEAF3FF))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Default.AccountBalanceWallet,
                    contentDescription = null,
                    tint = WalletPrimary,
                    modifier = Modifier.size(22.dp),
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = if (isRegister) {
                        "Register akan membuat wallet dan saldo awal 50.000 CBDC_IDR."
                    } else {
                        "Login memakai akun SmartBank Wallet yang sudah terdaftar."
                    },
                    color = WalletTextSecondary,
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            if (isRegister) {
                OutlinedTextField(
                    value = name,
                    onValueChange = onNameChanged,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Nama lengkap") },
                    singleLine = true,
                )
            }

            OutlinedTextField(
                value = email,
                onValueChange = onEmailChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
            )

            OutlinedTextField(
                value = password,
                onValueChange = onPasswordChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Password") },
                supportingText = {
                    if (isRegister) Text("Minimal 8 karakter.")
                },
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null)
                },
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true,
            )

            if (isRegister) {
                OutlinedTextField(
                    value = walletPin,
                    onValueChange = onWalletPinChanged,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("PIN Wallet (6 digit)") },
                    supportingText = { Text("${walletPin.length}/6 digit") },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    singleLine = true,
                )
            }

            Button(
                onClick = onSubmit,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                enabled = !uiState.isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = WalletPrimary),
                shape = RoundedCornerShape(8.dp),
            ) {
                Text(if (isRegister) "Buat Akun Wallet" else "Masuk")
            }

            if (uiState.isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            uiState.successMessage?.let { message ->
                InlineMessage(message = message, color = WalletSuccess, background = WalletSuccessBg)
            }

            formError?.let { message ->
                InlineMessage(message = message, color = WalletError, background = Color(0xFFFFECEA))
            }

            uiState.errorMessage?.let { message ->
                InlineMessage(message = message, color = WalletError, background = Color(0xFFFFECEA))
            }
        }
    }
}

@Composable
private fun InlineMessage(message: String, color: Color, background: Color) {
    Text(
        text = message,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(background)
            .padding(12.dp),
        color = color,
        style = MaterialTheme.typography.bodyMedium,
    )
}

private fun validateAuthForm(
    isRegister: Boolean,
    name: String,
    email: String,
    password: String,
    walletPin: String,
): String? {
    return when {
        isRegister && name.trim().isBlank() -> "Nama lengkap wajib diisi."
        email.trim().isBlank() -> "Email wajib diisi."
        password.isBlank() -> "Password wajib diisi."
        isRegister && password.length < 8 -> "Password minimal 8 karakter."
        isRegister && walletPin.length != 6 -> "PIN Wallet harus tepat 6 digit."
        else -> null
    }
}

@Composable
private fun AuthModeSwitch(
    isRegister: Boolean,
    onModeChanged: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFFE4ECF8))
            .padding(4.dp),
    ) {
        AuthModeButton(
            text = "Login",
            selected = !isRegister,
            modifier = Modifier.weight(1f),
            onClick = { onModeChanged(false) },
        )
        AuthModeButton(
            text = "Register",
            selected = isRegister,
            modifier = Modifier.weight(1f),
            onClick = { onModeChanged(true) },
        )
    }
}

@Composable
private fun AuthModeButton(
    text: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Box(
        modifier = modifier
            .height(42.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) WalletSurface else Color.Transparent)
            .clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            color = if (selected) WalletTextPrimary else WalletTextSecondary,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}
