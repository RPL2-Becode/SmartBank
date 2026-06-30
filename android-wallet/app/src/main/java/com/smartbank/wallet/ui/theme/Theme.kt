package com.smartbank.wallet.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = WalletBalanceCard,
    secondary = WalletBadgeBg,
    tertiary = WalletSuccess,
    background = WalletPrimaryDark,
    surface = WalletPrimaryDark,
    onPrimary = WalletPrimaryDark,
    onSecondary = WalletPrimaryDark,
    onBackground = WalletSurface,
    onSurface = WalletSurface,
)

private val LightColorScheme = lightColorScheme(
    primary = WalletPrimary,
    secondary = WalletBadgeBg,
    tertiary = WalletSuccess,
    background = WalletBg,
    surface = WalletSurface,
    error = WalletError,
    onPrimary = WalletSurface,
    onSecondary = WalletPrimaryDark,
    onBackground = WalletTextPrimary,
    onSurface = WalletTextPrimary,
)

@Composable
fun SmartBankWalletTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
