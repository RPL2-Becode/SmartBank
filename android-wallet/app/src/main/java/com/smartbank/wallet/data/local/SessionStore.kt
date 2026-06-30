package com.smartbank.wallet.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.sessionDataStore by preferencesDataStore(name = "smartbank_session")

class SessionStore(private val context: Context) {
    val authToken: Flow<String?> = context.sessionDataStore.data.map { preferences ->
        preferences[AUTH_TOKEN]
    }

    suspend fun currentToken(): String? = authToken.first()

    suspend fun saveAuthToken(token: String) {
        context.sessionDataStore.edit { preferences ->
            preferences[AUTH_TOKEN] = token
        }
    }

    suspend fun clear() {
        context.sessionDataStore.edit { preferences ->
            preferences.remove(AUTH_TOKEN)
        }
    }

    private companion object {
        val AUTH_TOKEN = stringPreferencesKey("auth_token")
    }
}
