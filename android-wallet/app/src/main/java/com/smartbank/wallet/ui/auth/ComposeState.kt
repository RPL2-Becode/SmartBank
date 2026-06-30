package com.smartbank.wallet.ui.auth

import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.collectAsState
import kotlinx.coroutines.flow.StateFlow

@Composable
fun <T> StateFlow<T>.collectAsStateWithLifecycleBridge(): State<T> {
    return collectAsState()
}
