# Implementation Plan Frontend Web SmartBank

## 1. Ringkasan

SmartBank adalah aplikasi inti dalam ekosistem ekonomi UMKM. Frontend web SmartBank harus menjadi pusat kontrol keuangan yang menampilkan saldo, transaksi, payment request, fee, pajak, pinjaman, ledger, dan status integrasi dengan aplikasi lain.

Dokumen ini menjadi rencana implementasi frontend web SmartBank dari sisi Senior Frontend Developer dan Senior UI/UX Designer. Fokus implementasi adalah membangun antarmuka yang:

1. Aman dan terpercaya seperti dashboard finansial.
2. Transparan dalam menampilkan alur debit, kredit, fee, pajak, dan ledger.
3. Sesuai dengan aturan bahwa semua transaksi keuangan hanya diproses oleh SmartBank.
4. Siap diintegrasikan dengan API Gateway, Marketplace, POS, SupplierHub, LogistiKita, dan UMKM Insight.
5. Mudah diuji dan didokumentasikan untuk kebutuhan tugas besar RPL.

---

## 2. Tujuan Produk

### 2.1 Tujuan Utama

Membangun frontend web SmartBank sebagai financial control center untuk ekosistem UMKM, meliputi:

- Landing page untuk menjelaskan peran SmartBank.
- Dashboard user untuk saldo, transaksi, transfer, dan pinjaman.
- Dashboard admin untuk monitoring money supply, reserve, transaksi, fee, pajak, dan ledger.
- Halaman payment request untuk memonitor request dari aplikasi lain.
- Halaman ledger sebagai single source of truth.
- Halaman dokumentasi API untuk kebutuhan integrasi.
- Halaman monitoring integrasi dengan API Gateway dan aplikasi ekosistem lain.

### 2.2 Prinsip UX

- Trust first: tampilan bersih, profesional, minim distraksi.
- Transparent finance: semua potongan, pajak, fee, dan total debit harus terlihat jelas.
- Auditability: setiap transaksi harus dapat dilacak dari request, validasi, proses, sampai ledger.
- Error visibility: transaksi gagal harus menjelaskan penyebabnya, misalnya saldo kurang, token invalid, daily limit, atau cooldown.
- Developer friendly: dokumentasi API harus mudah dipahami dan dapat langsung digunakan oleh tim lain.

---

## 3. Rujukan Kebutuhan dari Dokumen

### 3.1 Peran SmartBank

SmartBank adalah core system yang mengelola:

- Validasi saldo.
- Debit dan kredit saldo.
- Distribusi dana.
- Pajak dan fee.
- Pinjaman atau loan.
- Ledger transaksi.
- API pembayaran dan query saldo/riwayat.

Semua perubahan saldo hanya boleh terjadi melalui SmartBank.

### 3.2 Aplikasi Terintegrasi

| Aplikasi | Hubungan dengan SmartBank |
|---|---|
| Marketplace atau PasarKita | Mengirim payment request saat checkout. |
| POS atau WarungPOS | Mengirim payment request dari transaksi kasir. |
| SupplierHub | Mengirim payment request untuk order bahan. |
| LogistiKita | Mengirim payment request untuk pembayaran ongkir. |
| UMKM Insight | Membaca ledger secara read-only untuk analytics. |
| API Gateway atau Integrator | Routing API, validasi JWT, logging, dan fee gateway. |

### 3.3 Fitur Fungsional SmartBank

| Fitur | Endpoint dari dokumen | Fokus UI |
|---|---|---|
| Registrasi dan login user | `/smartbank/registrasi_&_login_user` | Login, register, session, JWT. |
| Manajemen saldo | `/smartbank/manajemen_saldo` | Saldo, riwayat transaksi, balance movement. |
| Transfer antar user | `/smartbank/transfer_antar_user` | Form transfer, preview biaya, receipt. |
| Pembayaran transaksi | `/smartbank/pembayaran_transaksi` | Payment request monitor dan detail transaksi. |
| Pinjaman atau loan | `/smartbank/pinjaman_(loan)` | Loan simulator, pengajuan, repayment summary. |
| Pajak dan biaya | `/smartbank/pajak_&_biaya` | Fee matrix dan fee simulator. |
| Ledger transaksi | `/smartbank/ledger_transaksi` | Immutable ledger table dan audit timeline. |
| Biaya layanan bank | `/smartbank/biaya_layanan_bank` | Fee bank dan revenue summary. |

### 3.4 Aturan Keuangan yang Wajib Terlihat di UI

| Aturan | Nilai |
|---|---:|
| Total money supply | 1,000,000,000 |
| Saldo awal user | 50,000 |
| Distribusi awal ke user | <= 2% dari total supply |
| Bank reserve | >= 98% |
| Fee Marketplace | 2% |
| Fee POS | 1% |
| Fee Supplier | 3% |
| Biaya Logistik | 5% atau flat 5,000 |
| Fee Bank | 1% |
| Fee Gateway | 0.5% |
| Pajak Sistem | 2% |
| UMKM Insight Subscription | 10,000/minggu |
| Bunga Pinjaman | 10% |
| Limit Pinjaman | 100,000/user |
| Cooldown Transaksi | 10-30 detik |
| Max Transaksi Harian | 10 transaksi |
| Stimulus Bank | 5,000/minggu, opsional |

### 3.5 Aturan Pengerjaan yang Mempengaruhi Frontend

- Setiap fitur harus mengikuti pola Input -> Process -> Output.
- Semua output transaksi harus menjadi payment request.
- SmartBank adalah pusat kontrol keuangan.
- Semua komunikasi antar aplikasi wajib melalui API Gateway.
- Validasi dan logging wajib ditampilkan atau dapat diaudit.
- Analytics hanya membaca ledger.
- Tidak ada uang dibuat bebas di luar sistem bank.
- Setiap endpoint harus menjadi kontrak sistem yang jelas.

---

## 4. Scope Implementasi Frontend

### 4.1 In Scope

- Landing page SmartBank.
- Authentication pages: login dan register.
- User dashboard.
- Admin dashboard.
- Balance and wallet page.
- Transfer antar user.
- Payment request monitor.
- Ledger transaksi.
- Loan page.
- Tax and fee engine page.
- Bank service fee page.
- Integration monitor.
- API logs page.
- Documentation page.
- Error, loading, empty, and success states.
- Responsive layout untuk desktop, tablet, dan mobile.
- Unit, integration, dan end-to-end tests untuk critical flow.

### 4.2 Out of Scope Frontend

- Backend ledger engine.
- Perhitungan final money supply di database.
- Direct update saldo dari aplikasi lain.
- Pengelolaan katalog produk, stok barang, dan pengiriman detail.
- Edit atau delete manual untuk ledger entries.

---

## 5. Rekomendasi Tech Stack

| Area | Rekomendasi |
|---|---|
| Framework | React dengan TypeScript, atau Next.js jika ingin routing dan dokumentasi lebih rapi. |
| Styling | Tailwind CSS. |
| UI component | shadcn/ui atau custom design system berbasis Radix UI. |
| Data fetching | TanStack Query. |
| Table | TanStack Table. |
| Form | React Hook Form. |
| Validation | Zod. |
| Chart | Recharts. |
| State ringan | Zustand untuk UI state seperti sidebar, filter, dan drawer. |
| Testing unit | Vitest. |
| Testing component | React Testing Library. |
| Testing E2E | Playwright. |
| Mock API | MSW atau JSON Server untuk fase frontend-first. |
| Documentation UI | MDX atau route docs custom. |

### 5.1 Alasan Pemilihan

- TypeScript menjaga kontrak data transaksi, ledger, loan, dan fee tetap eksplisit.
- TanStack Query cocok untuk data server-state seperti balance, ledger, payment request, dan API logs.
- Zod menjaga validasi form transfer, loan, dan payment simulation konsisten dengan aturan keuangan.
- Recharts cukup untuk line chart, bar chart, donut chart, dan summary dashboard.
- MSW membantu frontend berjalan meskipun backend belum siap.

---

## 6. Information Architecture

### 6.1 Public Routes

| Route | Halaman | Tujuan |
|---|---|---|
| `/` | Landing Page | Menjelaskan SmartBank dan peran dalam ekosistem. |
| `/login` | Login | Autentikasi user/admin/developer. |
| `/register` | Register | Pendaftaran user baru. |
| `/docs` | Documentation Home | Dokumentasi umum SmartBank. |
| `/docs/api` | API Reference | Daftar endpoint dan kontrak request-response. |
| `/docs/payment-flow` | Payment Flow | Alur Marketplace/POS/Supplier/Logistik -> Gateway -> SmartBank. |
| `/docs/database` | Database Design | Tabel utama dan relasi. |
| `/docs/testing` | Test Scenario | Skenario pengujian. |

### 6.2 Authenticated Routes

| Route | Halaman | Role |
|---|---|---|
| `/dashboard` | Dashboard Overview | User, Admin |
| `/balance` | Balance and Wallet | User, Admin |
| `/transfers` | Transfer Antar User | User |
| `/payment-requests` | Payment Request Monitor | Admin, Developer |
| `/ledger` | Ledger Transaksi | Admin, Developer, Insight Read-only |
| `/loans` | Pinjaman | User, Admin |
| `/fees` | Tax and Fee Engine | Admin, Developer |
| `/bank-fees` | Bank Service Fee | Admin |
| `/integrations` | Integration Monitor | Admin, Developer |
| `/api-logs` | API Logs | Admin, Developer |
| `/settings` | Account Settings | User, Admin |

---

## 7. Role dan Permission Matrix

| Capability | Public | User | Admin | Developer | Insight Read-only |
|---|---:|---:|---:|---:|---:|
| Lihat landing page | Yes | Yes | Yes | Yes | Yes |
| Login/register | Yes | Yes | Yes | Yes | Yes |
| Lihat saldo sendiri | No | Yes | Yes | No | No |
| Transfer antar user | No | Yes | No | No | No |
| Ajukan loan | No | Yes | Yes | No | No |
| Lihat semua payment request | No | No | Yes | Yes | No |
| Lihat ledger | No | Limited | Yes | Yes | Read-only |
| Edit ledger | No | No | No | No | No |
| Lihat fee engine | No | No | Yes | Yes | No |
| Lihat integration logs | No | No | Yes | Yes | No |
| Akses dokumentasi API | Yes | Yes | Yes | Yes | Yes |

Catatan: ledger tidak memiliki aksi edit atau delete dari UI. Data ledger hanya dapat dibaca dan diaudit.

---

## 8. Struktur Folder Frontend

```txt
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  pages/
    landing/
      LandingPage.tsx
    auth/
      LoginPage.tsx
      RegisterPage.tsx
    dashboard/
      DashboardPage.tsx
    balance/
      BalancePage.tsx
    transfers/
      TransferPage.tsx
    payment-requests/
      PaymentRequestsPage.tsx
    ledger/
      LedgerPage.tsx
    loans/
      LoansPage.tsx
    fees/
      FeesPage.tsx
      BankFeesPage.tsx
    integrations/
      IntegrationsPage.tsx
      ApiLogsPage.tsx
    docs/
      DocsHomePage.tsx
      ApiReferencePage.tsx
      PaymentFlowPage.tsx
      DatabasePage.tsx
      TestingPage.tsx
    settings/
      SettingsPage.tsx

  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      PublicHeader.tsx
      PublicFooter.tsx
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      Select.tsx
      Table.tsx
      Modal.tsx
      Drawer.tsx
      Tabs.tsx
      Tooltip.tsx
      Skeleton.tsx
      EmptyState.tsx
      ErrorState.tsx
      CodeBlock.tsx
    smartbank/
      BalanceCard.tsx
      MoneySupplyCard.tsx
      TransactionTable.tsx
      LedgerTable.tsx
      FeeBreakdown.tsx
      FeeSimulator.tsx
      LoanSimulator.tsx
      PaymentRequestDrawer.tsx
      TransactionTimeline.tsx
      IntegrationStatusCard.tsx
      ApiLogTable.tsx
      ReceiptCard.tsx
      RuleInfoCard.tsx

  features/
    auth/
      auth.api.ts
      auth.hooks.ts
      auth.schema.ts
      auth.types.ts
    balance/
      balance.api.ts
      balance.hooks.ts
      balance.types.ts
    transfers/
      transfers.api.ts
      transfers.hooks.ts
      transfers.schema.ts
      transfers.types.ts
    payments/
      payments.api.ts
      payments.hooks.ts
      payments.types.ts
    ledger/
      ledger.api.ts
      ledger.hooks.ts
      ledger.types.ts
    loans/
      loans.api.ts
      loans.hooks.ts
      loans.schema.ts
      loans.types.ts
    fees/
      fees.constants.ts
      fees.utils.ts
      fees.schema.ts
      fees.types.ts
    integrations/
      integrations.api.ts
      integrations.hooks.ts
      integrations.types.ts

  services/
    apiClient.ts
    tokenStorage.ts
    queryClient.ts
    errorMapper.ts

  store/
    authStore.ts
    uiStore.ts
    filterStore.ts

  lib/
    currency.ts
    date.ts
    number.ts
    status.ts
    permissions.ts
    validation.ts

  mocks/
    handlers.ts
    fixtures/
      users.ts
      balances.ts
      transactions.ts
      ledger.ts
      paymentRequests.ts
      loans.ts
      integrations.ts

  tests/
    unit/
    integration/
    e2e/
```

---

## 9. Design System Implementation

### 9.1 Design Tokens

```ts
export const smartBankTheme = {
  color: {
    primary: '#0F172A',
    primarySoft: '#E2E8F0',
    accent: '#2563EB',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0284C7',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B'
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px'
  },
  shadow: {
    card: '0 8px 24px rgba(15, 23, 42, 0.06)'
  }
};
```

### 9.2 Status Badge

| Status | Label | Color |
|---|---|---|
| `success` | Success | Green |
| `pending` | Pending | Amber |
| `processing` | Processing | Blue |
| `failed` | Failed | Red |
| `readonly` | Read-only | Gray |
| `locked` | Locked | Gray |

### 9.3 Komponen UI Minimum

Komponen minimum yang harus selesai sebelum membangun halaman fitur:

- Button.
- Input.
- Select.
- Textarea.
- Card.
- Badge.
- Table.
- Modal.
- Drawer.
- Tabs.
- Tooltip.
- Skeleton.
- EmptyState.
- ErrorState.
- CodeBlock.
- AppShell.
- Sidebar.
- Topbar.

---

## 10. Data Model Frontend

### 10.1 User

```ts
export type UserRole = 'user' | 'admin' | 'developer' | 'insight_readonly';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'blocked';
  createdAt: string;
};
```

### 10.2 Account Balance

```ts
export type AccountBalance = {
  userId: string;
  currentBalance: number;
  availableBalance: number;
  heldBalance: number;
  initialBalance: number;
  dailyTransactionCount: number;
  dailyTransactionLimit: number;
  cooldownUntil?: string | null;
  lastUpdatedAt: string;
};
```

### 10.3 Payment Request

```ts
export type SourceApp = 'marketplace' | 'pos' | 'supplierhub' | 'logistikita' | 'manual_transfer' | 'loan';

export type PaymentRequestStatus = 'pending' | 'validating' | 'processing' | 'success' | 'failed';

export type PaymentRequest = {
  id: string;
  sourceApp: SourceApp;
  fromUserId: string;
  toUserId?: string;
  toService?: string;
  amount: number;
  feeTotal: number;
  taxTotal: number;
  totalDebit: number;
  status: PaymentRequestStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  processedAt?: string | null;
  failureReason?: string | null;
};
```

### 10.4 Fee Breakdown

```ts
export type FeeBreakdown = {
  principalAmount: number;
  appFee: number;
  gatewayFee: number;
  bankFee: number;
  tax: number;
  logisticsFee?: number;
  totalFee: number;
  totalDebit: number;
};
```

### 10.5 Ledger Entry

```ts
export type LedgerEntryType = 'debit' | 'credit' | 'fee' | 'tax' | 'loan' | 'repayment' | 'stimulus';

export type LedgerEntry = {
  id: string;
  transactionId: string;
  paymentRequestId?: string;
  type: LedgerEntryType;
  accountId: string;
  accountName?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  sourceApp: SourceApp;
  createdAt: string;
};
```

### 10.6 Loan

```ts
export type LoanStatus = 'draft' | 'active' | 'paid' | 'overdue' | 'rejected';

export type Loan = {
  id: string;
  userId: string;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  status: LoanStatus;
  createdAt: string;
  dueDate?: string;
};
```

### 10.7 Integration Status

```ts
export type IntegrationStatus = {
  service: 'gateway' | 'marketplace' | 'pos' | 'supplierhub' | 'logistikita' | 'umkm_insight';
  status: 'online' | 'warning' | 'offline' | 'readonly';
  lastRequestAt?: string;
  errorRate: number;
  averageLatencyMs: number;
};
```

---

## 11. API Client Strategy

### 11.1 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_GATEWAY_URL=http://localhost:4000
VITE_APP_NAME=SmartBank
VITE_ENABLE_MOCK_API=true
```

### 11.2 API Client

```ts
import axios from 'axios';
import { tokenStorage } from './tokenStorage';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Client-App'] = 'smartbank-web';
  return config;
});
```

### 11.3 Error Mapping

Frontend harus memetakan error backend menjadi pesan yang jelas.

| Error Code | UI Message |
|---|---|
| `INVALID_TOKEN` | Sesi tidak valid. Silakan login ulang. |
| `INSUFFICIENT_BALANCE` | Saldo tidak mencukupi untuk transaksi ini. |
| `DAILY_LIMIT_EXCEEDED` | Batas transaksi harian sudah tercapai. |
| `COOLDOWN_ACTIVE` | Tunggu beberapa detik sebelum transaksi berikutnya. |
| `LOAN_LIMIT_EXCEEDED` | Nominal pinjaman melebihi limit user. |
| `RESERVE_LIMIT_REACHED` | Reserve bank tidak mencukupi untuk transaksi ini. |
| `LEDGER_WRITE_FAILED` | Transaksi gagal dicatat ke ledger. |
| `GATEWAY_TIMEOUT` | Gateway tidak merespons. Coba lagi. |

---

## 12. API Contract Frontend

### 12.1 Auth

| Use Case | Method | Endpoint |
|---|---|---|
| Register | POST | `/smartbank/registrasi_&_login_user/register` |
| Login | POST | `/smartbank/registrasi_&_login_user/login` |
| Me | GET | `/smartbank/registrasi_&_login_user/me` |
| Logout | POST | `/smartbank/registrasi_&_login_user/logout` |

### 12.2 Balance

| Use Case | Method | Endpoint |
|---|---|---|
| Get balance | GET | `/smartbank/manajemen_saldo/{userId}` |
| Get balance history | GET | `/smartbank/manajemen_saldo/{userId}/history` |
| Get daily limit status | GET | `/smartbank/manajemen_saldo/{userId}/limit-status` |

### 12.3 Transfer

| Use Case | Method | Endpoint |
|---|---|---|
| Preview transfer fee | POST | `/smartbank/transfer_antar_user/preview` |
| Submit transfer | POST | `/smartbank/transfer_antar_user` |
| Get transfer receipt | GET | `/smartbank/transfer_antar_user/{transactionId}/receipt` |

### 12.4 Payment Transaction

| Use Case | Method | Endpoint |
|---|---|---|
| List payment requests | GET | `/smartbank/pembayaran_transaksi` |
| Get payment request detail | GET | `/smartbank/pembayaran_transaksi/{id}` |
| Submit external payment request | POST | `/smartbank/pembayaran_transaksi` |
| Retry failed request | POST | `/smartbank/pembayaran_transaksi/{id}/retry` |

### 12.5 Loan

| Use Case | Method | Endpoint |
|---|---|---|
| Get loan summary | GET | `/smartbank/pinjaman_(loan)/summary` |
| Preview loan | POST | `/smartbank/pinjaman_(loan)/preview` |
| Apply loan | POST | `/smartbank/pinjaman_(loan)` |
| Repay loan | POST | `/smartbank/pinjaman_(loan)/{loanId}/repay` |

### 12.6 Fee and Tax

| Use Case | Method | Endpoint |
|---|---|---|
| Get fee rules | GET | `/smartbank/pajak_&_biaya/rules` |
| Simulate fee | POST | `/smartbank/pajak_&_biaya/simulate` |
| Get bank service fee | GET | `/smartbank/biaya_layanan_bank` |

### 12.7 Ledger

| Use Case | Method | Endpoint |
|---|---|---|
| List ledger entries | GET | `/smartbank/ledger_transaksi` |
| Get ledger detail | GET | `/smartbank/ledger_transaksi/{id}` |
| Export ledger | GET | `/smartbank/ledger_transaksi/export` |

---

## 13. Page-by-Page Implementation Plan

## 13.1 Landing Page

### Objective

Menjelaskan SmartBank sebagai pusat kontrol keuangan ekosistem UMKM.

### Sections

1. Hero section.
2. Core capabilities.
3. Ecosystem integration flow.
4. Financial rules preview.
5. API documentation CTA.
6. Footer.

### Components

- PublicHeader.
- HeroSmartBank.
- EcosystemFlowDiagram.
- FeatureCardGrid.
- FinancialRuleGrid.
- PublicFooter.

### Acceptance Criteria

- User memahami SmartBank sebagai core payment processor.
- Ada CTA ke login dan API documentation.
- Ada visual flow dari aplikasi lain ke Gateway lalu ke SmartBank.
- Responsive di desktop, tablet, dan mobile.

---

## 13.2 Login dan Register

### Objective

Memberikan autentikasi user dengan JWT.

### Components

- AuthLayout.
- LoginForm.
- RegisterForm.
- PasswordInput.
- AuthErrorAlert.

### Validation

- Email wajib valid.
- Password wajib diisi.
- Register membutuhkan nama, email, password, confirm password.
- Pesan error harus jelas.

### Acceptance Criteria

- Login sukses menyimpan JWT dan redirect ke `/dashboard`.
- Login gagal menampilkan error.
- Register sukses dapat redirect ke login atau dashboard sesuai response backend.

---

## 13.3 Dashboard Overview

### Objective

Menampilkan ringkasan kondisi keuangan SmartBank.

### User View

- Balance card.
- Quick actions.
- Recent transactions.
- Loan summary.
- Daily transaction limit.
- Cooldown indicator.

### Admin View

- Total money supply.
- Bank reserve.
- Circulating money.
- Transaction volume.
- Fee collected.
- Loan outstanding.
- Success rate.
- Failed transactions.

### Charts

- Transaction volume over time.
- Money distribution.
- Transaction source breakdown.
- Fee revenue breakdown.

### Acceptance Criteria

- Dashboard menyesuaikan role user.
- Semua KPI memiliki loading skeleton.
- Semua kartu memiliki empty state jika data kosong.
- Chart tetap readable di layar kecil.

---

## 13.4 Balance and Wallet

### Objective

Menampilkan saldo user dan riwayat perubahan saldo.

### Components

- BalanceCard.
- BalanceMovementChart.
- TransactionHistoryTable.
- AccountRulesCard.
- CooldownNotice.

### Table Columns

- Date.
- Type.
- From.
- To.
- Amount.
- Fee.
- Tax.
- Status.

### Acceptance Criteria

- Saldo saat ini, saldo tersedia, dan saldo tertahan terlihat jelas.
- History dapat difilter berdasarkan tanggal dan status.
- User melihat batas harian 10 transaksi.
- Cooldown transaksi terlihat jika aktif.

---

## 13.5 Transfer Antar User

### Objective

Memungkinkan user melakukan transfer saldo dengan preview biaya sebelum submit.

### Flow

```txt
Input penerima
Input nominal
Preview biaya
Konfirmasi
Submit transaksi
Validasi saldo
Debit dan kredit
Ledger entry
Receipt
```

### Components

- TransferForm.
- UserRecipientSearch.
- FeeBreakdown.
- ConfirmTransactionModal.
- ReceiptCard.
- TransferStatusAlert.

### Validation

- Penerima wajib valid.
- Nominal harus lebih dari 0.
- Nominal tidak boleh melebihi saldo tersedia.
- User harus menyetujui konfirmasi sebelum submit.

### Acceptance Criteria

- Preview fee tampil sebelum submit.
- Modal konfirmasi menampilkan total debit.
- Success state menampilkan receipt.
- Failed state menampilkan alasan gagal.

---

## 13.6 Payment Request Monitor

### Objective

Menampilkan semua request pembayaran dari Marketplace, POS, SupplierHub, LogistiKita, dan transfer manual.

### Components

- PaymentRequestFilterBar.
- PaymentRequestTable.
- PaymentRequestDrawer.
- ValidationChecklist.
- FeeBreakdown.
- TransactionTimeline.

### Filters

- Source app.
- Status.
- Date range.
- User ID.
- Amount min dan max.

### Table Columns

- Request ID.
- Source app.
- From user.
- To user atau service.
- Amount.
- Fee.
- Tax.
- Total debit.
- Status.
- Created at.

### Drawer Detail

Drawer harus menampilkan:

- Request metadata.
- JWT validation status.
- Saldo validation status.
- Daily limit status.
- Cooldown status.
- Fee dan tax breakdown.
- Ledger entries.
- Final transaction status.

### Acceptance Criteria

- Admin dapat melihat request dari semua source app.
- Detail drawer menunjukkan alur request sampai ledger.
- Failed request memiliki failure reason.
- Table mendukung pagination.

---

## 13.7 Ledger Transaksi

### Objective

Menampilkan ledger sebagai single source of truth.

### Components

- LedgerSummaryCards.
- LedgerFilterBar.
- LedgerTable.
- LedgerDetailDrawer.
- AuditTimeline.
- ReadOnlyNotice.

### Filters

- Date range.
- Transaction type.
- Source app.
- User ID.
- Status.
- Ledger entry type.

### Table Columns

- Ledger ID.
- Transaction ID.
- Type.
- Account.
- Amount.
- Balance before.
- Balance after.
- Source app.
- Timestamp.

### Rules

- Tidak ada edit ledger.
- Tidak ada delete ledger.
- Export hanya untuk role admin dan developer.
- Insight read-only hanya dapat membaca data yang diizinkan.

### Acceptance Criteria

- Ledger dapat dicari dan difilter.
- Detail ledger menampilkan payment request dan timeline.
- Tidak ada tombol edit/delete.
- UI menampilkan read-only notice.

---

## 13.8 Loans Page

### Objective

Memungkinkan user melihat, mensimulasikan, dan mengajukan pinjaman.

### Components

- LoanSummaryCard.
- LoanApplicationForm.
- LoanSimulator.
- LoanHistoryTable.
- RepaymentCard.

### Financial Rules

- Limit pinjaman: 100,000 per user.
- Bunga pinjaman: 10%.
- Total repayment = principal + interest.

### Validation

- Nominal harus lebih dari 0.
- Nominal tidak boleh melebihi sisa limit.
- User harus mengonfirmasi bunga 10%.

### Acceptance Criteria

- Simulator menampilkan bunga dan total repayment.
- Pengajuan di atas limit ditolak di frontend sebelum submit.
- Loan aktif terlihat di summary.
- Repayment status terlihat jelas.

---

## 13.9 Tax and Fee Engine

### Objective

Menampilkan aturan fee dan pajak serta menyediakan simulator biaya.

### Components

- FeeRuleMatrix.
- FeeSimulator.
- FeeBreakdown.
- SourceAppSelector.
- RuleExplanationCard.

### Fee Rules

```ts
export const FEE_RULES = {
  marketplaceFeeRate: 0.02,
  posFeeRate: 0.01,
  supplierFeeRate: 0.03,
  logisticsFeeRate: 0.05,
  logisticsFlatFee: 5000,
  bankFeeRate: 0.01,
  gatewayFeeRate: 0.005,
  systemTaxRate: 0.02,
  insightSubscriptionWeekly: 10000
};
```

### Acceptance Criteria

- Fee matrix terlihat jelas.
- Simulator dapat menghitung total debit berdasarkan source app.
- Breakdown membedakan principal, app fee, gateway fee, bank fee, logistics fee, dan pajak.

---

## 13.10 Bank Service Fee Page

### Objective

Menampilkan pendapatan fee bank dan kontribusinya terhadap reserve.

### Components

- BankFeeSummaryCards.
- BankFeeTable.
- BankReserveChart.
- FeeBySourceChart.

### Acceptance Criteria

- Admin dapat melihat total fee bank.
- Admin dapat melihat fee bank per source app.
- UI menjelaskan bahwa fee bank menambah reserve.

---

## 13.11 Integration Monitor

### Objective

Menampilkan status integrasi dengan API Gateway dan aplikasi ekosistem.

### Components

- IntegrationStatusCard.
- RequestFlowViewer.
- ServiceHealthTable.
- IntegrationErrorPanel.

### Services

- API Gateway.
- Marketplace.
- POS.
- SupplierHub.
- LogistiKita.
- UMKM Insight.

### Flow Viewer

```txt
Source app
Gateway routing
JWT validation
Logging and gateway fee
SmartBank payment processing
Ledger
Status response
```

### Acceptance Criteria

- Status service terlihat online, warning, offline, atau read-only.
- Last request, error rate, dan latency ditampilkan.
- UMKM Insight ditandai sebagai read-only.

---

## 13.12 API Logs

### Objective

Menampilkan log request yang masuk melalui Gateway.

### Components

- ApiLogFilterBar.
- ApiLogTable.
- ApiLogDetailDrawer.
- JsonViewer.

### Table Columns

- Time.
- Source.
- Endpoint.
- Method.
- Status code.
- Latency.
- Message.

### Acceptance Criteria

- Log dapat difilter berdasarkan source, endpoint, status, dan waktu.
- Detail log menampilkan request dan response JSON.
- Sensitive data seperti token tidak ditampilkan penuh.

---

## 13.13 Documentation Page

### Objective

Menyediakan dokumentasi teknis SmartBank untuk tim lain.

### Sidebar Structure

```txt
Getting Started
- Overview SmartBank
- Authentication
- Gateway Rules
- Payment Flow

Core API
- Register and Login
- Balance Management
- Transfer
- Payment Transaction
- Loan
- Tax and Fee
- Ledger
- Bank Service Fee

Integration
- Marketplace Integration
- POS Integration
- SupplierHub Integration
- LogistiKita Integration
- UMKM Insight Read-only

Reference
- Request Format
- Response Format
- Error Codes
- Database Design
- Test Scenarios
```

### Components

- DocsLayout.
- DocsSidebar.
- ApiEndpointCard.
- CodeBlock.
- JsonViewer.
- FlowDiagram.
- TestScenarioTable.

### Acceptance Criteria

- Endpoint, method, request, response, dan error code terdokumentasi.
- Ada halaman khusus payment flow.
- Ada halaman database design sederhana.
- Ada test scenario untuk fitur utama SmartBank.

---

## 14. Financial Calculation Utilities

### 14.1 Fee Calculation

```ts
export type CalculateFeeInput = {
  sourceApp: SourceApp;
  amount: number;
  logisticsMode?: 'percentage' | 'flat' | 'none';
};

export function calculateFee(input: CalculateFeeInput): FeeBreakdown {
  const { sourceApp, amount, logisticsMode = 'none' } = input;

  const appFeeRateBySource = {
    marketplace: 0.02,
    pos: 0.01,
    supplierhub: 0.03,
    logistikita: 0,
    manual_transfer: 0,
    loan: 0
  } satisfies Record<SourceApp, number>;

  const appFee = amount * appFeeRateBySource[sourceApp];
  const gatewayFee = amount * 0.005;
  const bankFee = amount * 0.01;
  const tax = amount * 0.02;
  const logisticsFee = logisticsMode === 'percentage'
    ? amount * 0.05
    : logisticsMode === 'flat'
      ? 5000
      : 0;

  const totalFee = appFee + gatewayFee + bankFee + tax + logisticsFee;

  return {
    principalAmount: amount,
    appFee,
    gatewayFee,
    bankFee,
    tax,
    logisticsFee,
    totalFee,
    totalDebit: amount + totalFee
  };
}
```

### 14.2 Loan Calculation

```ts
export function calculateLoan(principal: number) {
  const interestRate = 0.1;
  const interestAmount = principal * interestRate;
  return {
    principal,
    interestRate,
    interestAmount,
    totalRepayment: principal + interestAmount
  };
}
```

---

## 15. Critical User Flows

### 15.1 User Melihat Saldo

```txt
User login
JWT tersimpan
Frontend request balance via Gateway
SmartBank mengembalikan saldo dan riwayat
Frontend menampilkan balance card dan transaction history
```

### 15.2 User Transfer Antar User

```txt
User buka transfer page
Input penerima dan nominal
Frontend hitung preview fee
User konfirmasi transaksi
Frontend submit transfer
SmartBank validasi saldo, limit, cooldown
SmartBank debit dan kredit
SmartBank mencatat ledger
Frontend menampilkan receipt
```

### 15.3 Payment Request dari Marketplace

```txt
Marketplace checkout
Marketplace membuat payment request
Gateway routing request
Gateway validasi JWT
Gateway logging dan fee
SmartBank menerima request
SmartBank validasi saldo
SmartBank hitung fee dan pajak
SmartBank debit/kredit
SmartBank catat ledger
SmartBank return status transaksi
Frontend admin melihat request di Payment Request Monitor
```

### 15.4 UMKM Insight Membaca Ledger

```txt
UMKM Insight request data analytics
Gateway validasi akses read-only
SmartBank expose ledger data read-only
UMKM Insight menampilkan dashboard analytics
Tidak ada perubahan data ledger
```

---

## 16. Form Validation Plan

| Form | Validation |
|---|---|
| Login | Email valid, password wajib. |
| Register | Nama wajib, email valid, password minimal sesuai aturan tim, confirm password sama. |
| Transfer | Recipient wajib, amount > 0, amount <= available balance, confirm checked. |
| Loan | Amount > 0, amount <= remaining loan limit, confirm interest checked. |
| Fee Simulator | Source app wajib, amount > 0, logistics mode valid jika dipilih. |
| Payment Request Filter | Date range valid, min amount <= max amount. |
| Ledger Filter | Date range valid, status dan type valid. |

---

## 17. Loading, Empty, Error, and Success States

### 17.1 Loading State

- Gunakan skeleton untuk card dashboard.
- Gunakan table skeleton untuk payment request, ledger, dan API logs.
- Gunakan spinner kecil hanya untuk button submit.

### 17.2 Empty State

Contoh empty state:

- No transactions yet.
- No payment requests found.
- No ledger entries match this filter.
- No active loan.

### 17.3 Error State

Error harus menjelaskan:

- Apa yang gagal.
- Penyebab jika tersedia.
- Aksi yang bisa dilakukan user.

### 17.4 Success State

Untuk transaksi sukses, tampilkan:

- Transaction ID.
- Ledger ID.
- Amount.
- Fee breakdown.
- Timestamp.
- Button download atau copy receipt.

---

## 18. Responsive Design Plan

### 18.1 Desktop

- Sidebar tetap di kiri.
- Dashboard menggunakan grid 12 kolom.
- Table memiliki filter horizontal.
- Drawer muncul di kanan.

### 18.2 Tablet

- Sidebar collapsible.
- KPI card menjadi 2 kolom.
- Drawer tetap kanan namun lebih lebar.
- Table dapat horizontal scroll.

### 18.3 Mobile

- Bottom navigation atau hamburger menu.
- KPI card menjadi 1 kolom.
- Table diganti card list untuk transaksi utama.
- Filter masuk ke modal bottom sheet.
- Drawer detail menjadi full-screen sheet.

---

## 19. Accessibility Plan

- Semua form memiliki label eksplisit.
- Semua button memiliki accessible name.
- Modal dan drawer mendukung focus trap.
- Warna status tidak boleh menjadi satu-satunya penanda; tetap gunakan label teks.
- Table memiliki header yang jelas.
- Error message terhubung dengan field yang error.
- Keyboard navigation harus bisa membuka dan menutup modal/drawer.
- Target klik minimal 44px untuk mobile.

---

## 20. Testing Plan

### 20.1 Unit Tests

| Module | Test |
|---|---|
| currency utils | Format Rupiah dan angka. |
| date utils | Format tanggal dan waktu. |
| fee calculator | Hitung fee berdasarkan source app. |
| loan calculator | Hitung bunga dan repayment. |
| permission utils | Role access benar. |
| error mapper | Error code menjadi UI message. |

### 20.2 Component Tests

| Component | Test |
|---|---|
| BalanceCard | Render saldo dan limit. |
| FeeBreakdown | Render principal, fee, tax, total debit. |
| TransferForm | Validasi amount dan recipient. |
| ConfirmTransactionModal | Konfirmasi memanggil submit. |
| PaymentRequestTable | Render data, status badge, dan empty state. |
| LedgerTable | Tidak ada edit/delete action. |
| LoanSimulator | Hitung interest 10%. |

### 20.3 Integration Tests

| Flow | Expected Result |
|---|---|
| Login sukses | Token tersimpan dan redirect dashboard. |
| Login gagal | Error muncul. |
| Transfer sukses | Receipt muncul dan query balance invalidated. |
| Transfer saldo kurang | Error insufficient balance muncul. |
| Loan di bawah limit | Preview dan submit sukses. |
| Loan di atas limit | Frontend menolak submit. |
| Filter ledger | Table update sesuai filter. |

### 20.4 E2E Tests

| Scenario | Steps |
|---|---|
| User login dan cek saldo | Login -> dashboard -> balance page. |
| User transfer sukses | Login -> transfer -> preview -> confirm -> receipt. |
| Admin lihat payment request | Login admin -> payment requests -> open detail drawer. |
| Admin lihat ledger | Login admin -> ledger -> filter -> open detail. |
| Developer lihat docs API | Open docs -> API reference -> payment endpoint. |

---

## 21. Milestone dan Timeline Implementasi

Timeline dapat disesuaikan dengan kapasitas tim. Rekomendasi berikut memakai 5 fase implementasi.

### Phase 0: Project Setup

Durasi: 0.5-1 hari.

Tasks:

- Inisialisasi React/Next.js dengan TypeScript.
- Setup Tailwind CSS.
- Setup routing.
- Setup ESLint dan Prettier.
- Setup Vitest dan React Testing Library.
- Setup Playwright.
- Setup TanStack Query.
- Setup MSW atau mock API.
- Setup folder structure.

Deliverables:

- Project dapat dijalankan lokal.
- Base layout dan routing kosong tersedia.
- Mock API aktif.

---

### Phase 1: Design System dan Layout

Durasi: 2-3 hari.

Tasks:

- Implementasi design tokens.
- Implementasi AppShell.
- Implementasi Sidebar dan Topbar.
- Implementasi PublicHeader dan PublicFooter.
- Implementasi komponen UI dasar.
- Implementasi StatusBadge.
- Implementasi EmptyState, ErrorState, Skeleton.
- Implementasi CodeBlock dan JsonViewer.

Deliverables:

- Layout public dan authenticated siap.
- Semua halaman bisa memakai komponen konsisten.
- Story atau preview komponen tersedia jika memungkinkan.

---

### Phase 2: Public Pages dan Auth

Durasi: 2-3 hari.

Tasks:

- Landing page.
- Login page.
- Register page.
- Auth store dan token storage.
- Protected route.
- Role-based route guard.
- Mock auth handler.

Deliverables:

- User dapat login dengan mock API.
- User diarahkan ke dashboard.
- Public docs route dapat dibuka.

---

### Phase 3: Core User Banking

Durasi: 4-6 hari.

Tasks:

- Dashboard user.
- Balance and Wallet page.
- Transfer page.
- Fee preview untuk transfer.
- Confirmation modal.
- Receipt card.
- Loan page untuk user.
- Unit test fee dan loan calculator.

Deliverables:

- User dapat melihat saldo dan transaksi.
- User dapat melakukan flow transfer mock sampai receipt.
- User dapat simulasi dan ajukan loan mock.

---

### Phase 4: Admin Control Center

Durasi: 5-7 hari.

Tasks:

- Admin dashboard KPI.
- Payment request monitor.
- Payment request detail drawer.
- Ledger page.
- Ledger detail drawer.
- Tax and Fee Engine.
- Bank Service Fee page.
- Charts dashboard.

Deliverables:

- Admin dapat memonitor payment request.
- Admin dapat membuka detail validasi dan fee breakdown.
- Admin dapat membaca ledger tanpa edit/delete.
- Fee simulator berjalan.

---

### Phase 5: Integration, Docs, and Logs

Durasi: 3-5 hari.

Tasks:

- Integration Monitor.
- API Logs.
- Documentation pages.
- API reference endpoint SmartBank.
- Payment flow page.
- Database design page.
- Test scenario page.

Deliverables:

- Developer dapat memahami kontrak API.
- Flow integrasi Gateway -> SmartBank jelas.
- API logs dan integration health tersedia.

---

### Phase 6: QA, Polish, and Finalization

Durasi: 3-5 hari.

Tasks:

- Responsive check.
- Accessibility check.
- Empty/error/loading states.
- E2E testing critical flows.
- Bug fixing.
- Final documentation.
- Prepare demo script.

Deliverables:

- Frontend siap demo.
- Critical flow lulus E2E.
- UI konsisten dan responsive.
- Dokumentasi penggunaan tersedia.

---

## 22. Backlog Task Detail

### Epic A: Foundation

| ID | Task | Priority | Owner |
|---|---|---:|---|
| FE-A01 | Setup project TypeScript | High | Frontend |
| FE-A02 | Setup Tailwind and theme tokens | High | Frontend/UI |
| FE-A03 | Setup router and route layout | High | Frontend |
| FE-A04 | Setup TanStack Query | High | Frontend |
| FE-A05 | Setup mock API with MSW | Medium | Frontend |
| FE-A06 | Setup testing tools | Medium | Frontend |

### Epic B: Design System

| ID | Task | Priority | Owner |
|---|---|---:|---|
| FE-B01 | Button, Input, Select, Textarea | High | Frontend/UI |
| FE-B02 | Card, Badge, Table | High | Frontend/UI |
| FE-B03 | Modal and Drawer | High | Frontend/UI |
| FE-B04 | Skeleton, EmptyState, ErrorState | High | Frontend/UI |
| FE-B05 | AppShell, Sidebar, Topbar | High | Frontend/UI |
| FE-B06 | CodeBlock and JsonViewer | Medium | Frontend/UI |

### Epic C: Public and Auth

| ID | Task | Priority | Owner |
|---|---|---:|---|
| FE-C01 | Landing page hero | High | UI/Frontend |
| FE-C02 | Ecosystem flow section | High | UI/Frontend |
| FE-C03 | Financial rules section | Medium | UI/Frontend |
| FE-C04 | Login page | High | Frontend |
| FE-C05 | Register page | High | Frontend |
| FE-C06 | Auth store and protected route | High | Frontend |

### Epic D: User Banking

| ID | Task | Priority | Owner |
|---|---|---:|---|
| FE-D01 | User dashboard | High | Frontend |
| FE-D02 | Balance page | High | Frontend |
| FE-D03 | Transaction history table | High | Frontend |
| FE-D04 | Transfer form | High | Frontend |
| FE-D05 | Fee preview and breakdown | High | Frontend |
| FE-D06 | Confirmation modal and receipt | High | Frontend |
| FE-D07 | Loan summary and simulator | Medium | Frontend |
| FE-D08 | Loan application form | Medium | Frontend |

### Epic E: Admin Control

| ID | Task | Priority | Owner |
|---|---|---:|---|
| FE-E01 | Admin dashboard KPI | High | Frontend |
| FE-E02 | Dashboard charts | Medium | Frontend |
| FE-E03 | Payment request table | High | Frontend |
| FE-E04 | Payment request drawer | High | Frontend |
| FE-E05 | Ledger table | High | Frontend |
| FE-E06 | Ledger detail drawer | High | Frontend |
| FE-E07 | Fee engine page | Medium | Frontend |
| FE-E08 | Bank service fee page | Medium | Frontend |

### Epic F: Integration and Docs

| ID | Task | Priority | Owner |
|---|---|---:|---|
| FE-F01 | Integration monitor cards | Medium | Frontend |
| FE-F02 | Request flow viewer | Medium | UI/Frontend |
| FE-F03 | API logs table | Medium | Frontend |
| FE-F04 | API log detail drawer | Medium | Frontend |
| FE-F05 | Docs layout and sidebar | High | Frontend |
| FE-F06 | API reference pages | High | Frontend |
| FE-F07 | Payment flow documentation | High | Frontend |
| FE-F08 | Testing scenario documentation | Medium | Frontend |

### Epic G: QA and Delivery

| ID | Task | Priority | Owner |
|---|---|---:|---|
| FE-G01 | Unit tests for utilities | High | Frontend |
| FE-G02 | Component tests for core components | Medium | Frontend |
| FE-G03 | E2E login and transfer | High | Frontend |
| FE-G04 | E2E admin payment request and ledger | High | Frontend |
| FE-G05 | Responsive QA | High | UI/Frontend |
| FE-G06 | Accessibility QA | Medium | UI/Frontend |
| FE-G07 | Demo data and demo script | Medium | Team |

---

## 23. Mock Data Plan

### 23.1 Users

- `user_001`: role user, saldo awal 50,000.
- `seller_001`: role user, penerima transaksi marketplace.
- `admin_001`: role admin.
- `dev_001`: role developer.
- `insight_001`: role insight_readonly.

### 23.2 Transactions

Buat data transaksi dari beberapa source:

- Marketplace checkout sukses.
- POS payment sukses.
- SupplierHub payment sukses.
- LogistiKita payment sukses.
- Transfer antar user sukses.
- Transfer gagal karena saldo kurang.
- Payment request gagal karena JWT invalid.
- Payment request gagal karena daily limit.

### 23.3 Ledger Entries

Setiap transaksi sukses minimal memiliki:

- Debit entry dari payer.
- Credit entry ke receiver.
- Fee bank entry.
- Gateway fee entry.
- Tax entry.

### 23.4 Integration Logs

Buat log mock untuk:

- Gateway online.
- Marketplace online.
- POS online.
- SupplierHub warning.
- LogistiKita online.
- UMKM Insight read-only.

---

## 24. Database Design untuk Dokumentasi UI

Frontend documentation page cukup menampilkan desain konseptual database berikut.

| Table | Purpose |
|---|---|
| `users` | Data user dan role. |
| `accounts` | Data saldo user. |
| `payment_requests` | Request pembayaran dari aplikasi lain. |
| `transactions` | Data transaksi utama. |
| `ledger_entries` | Catatan debit, credit, fee, tax, loan, repayment. |
| `fees` | Konfigurasi fee dan pajak. |
| `loans` | Data pinjaman user. |
| `api_logs` | Log request melalui Gateway. |
| `integration_clients` | Data aplikasi yang terhubung. |

Relasi konseptual:

```txt
users -> accounts
accounts -> transactions
payment_requests -> transactions
transactions -> ledger_entries
transactions -> fees
users -> loans
integration_clients -> payment_requests
api_logs -> payment_requests
```

---

## 25. Security and Privacy Considerations

- JWT tidak boleh disimpan di tempat yang mudah bocor jika backend mendukung httpOnly cookie. Jika belum, gunakan token storage dengan mitigasi dasar.
- Sensitive data seperti full token tidak boleh muncul di API logs UI.
- Role guard harus aktif di route dan di level component action.
- Ledger tidak boleh memiliki edit/delete action.
- Export ledger hanya untuk role admin dan developer.
- Semua request harus melewati API Gateway URL, bukan langsung ke service lain.

---

## 26. Performance Plan

- Gunakan pagination untuk ledger, payment requests, dan API logs.
- Gunakan debounce untuk search input.
- Gunakan query caching untuk dashboard data.
- Gunakan query invalidation setelah transfer, loan, atau payment action.
- Gunakan lazy loading untuk halaman admin dan docs.
- Gunakan memoization untuk table columns dan heavy charts.
- Hindari render table ribuan baris tanpa pagination atau virtualisasi.

---

## 27. Observability di Frontend

Minimal logging client-side:

- Page load error.
- API request failure.
- Form submit failure.
- Unauthorized access attempt.
- Payment request detail open.
- Ledger export action.

Untuk tugas RPL, cukup tampilkan di console atau mock monitoring. Untuk production-like setup, siapkan abstraction:

```ts
export const logger = {
  info: (event: string, payload?: unknown) => console.info(event, payload),
  warn: (event: string, payload?: unknown) => console.warn(event, payload),
  error: (event: string, payload?: unknown) => console.error(event, payload)
};
```

---

## 28. Acceptance Criteria Global

Frontend dianggap selesai jika memenuhi kriteria berikut:

1. Landing page menjelaskan SmartBank sebagai pusat keuangan ekosistem UMKM.
2. Login dan register berjalan dengan mock atau backend API.
3. Dashboard user menampilkan saldo, transaksi, loan, limit, dan cooldown.
4. Dashboard admin menampilkan KPI money supply, reserve, volume transaksi, fee, dan loan.
5. Transfer memiliki preview fee, modal konfirmasi, dan receipt.
6. Payment request monitor menampilkan request dari Marketplace, POS, SupplierHub, dan LogistiKita.
7. Ledger dapat dibaca, difilter, dan tidak dapat diedit atau dihapus.
8. Loan page mengikuti limit 100,000/user dan bunga 10%.
9. Fee simulator mengikuti aturan fee dan pajak.
10. Integration monitor menunjukkan Gateway dan aplikasi terkait.
11. Documentation page memiliki API reference, payment flow, database, dan test scenario.
12. Critical flows memiliki unit atau E2E tests.
13. UI responsive minimal untuk desktop dan mobile.
14. Loading, empty, error, dan success states tersedia.
15. Role-based access berjalan untuk user, admin, developer, dan insight read-only.

---

## 29. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Backend belum siap | Frontend tidak bisa test API real | Gunakan MSW/mock API dari awal. |
| Endpoint backend tidak konsisten | Integrasi terlambat | Buat adapter service layer dan dokumentasi kontrak. |
| Perhitungan fee berubah | UI tidak akurat | Simpan fee rules sebagai constants dan sync dengan backend. |
| Ledger terlalu banyak data | UI lambat | Pagination, filter server-side, dan virtualisasi jika perlu. |
| Role belum jelas | UI action salah akses | Buat permission matrix dan route guard. |
| Mobile table sulit dibaca | UX buruk | Gunakan card list di mobile. |
| User bingung dengan fee | Transaksi tidak transparan | Selalu tampilkan FeeBreakdown sebelum submit. |

---

## 30. Demo Script

Gunakan alur demo berikut saat presentasi:

1. Buka landing page dan jelaskan SmartBank sebagai core financial system.
2. Login sebagai user.
3. Lihat dashboard user dan saldo awal.
4. Buka transfer page.
5. Input penerima dan nominal.
6. Tampilkan preview fee dan total debit.
7. Konfirmasi transfer dan tampilkan receipt.
8. Login sebagai admin.
9. Buka payment request monitor.
10. Buka detail request dan jelaskan validasi, fee, pajak, dan ledger.
11. Buka ledger page dan tunjukkan bahwa data read-only.
12. Buka fee engine dan simulasikan transaksi Marketplace.
13. Buka integration monitor dan jelaskan Gateway.
14. Buka documentation page dan tunjukkan API reference.

---

## 31. Final Delivery Checklist

### Functional

- [ ] Landing page selesai.
- [ ] Login dan register selesai.
- [ ] Dashboard user selesai.
- [ ] Dashboard admin selesai.
- [ ] Balance page selesai.
- [ ] Transfer page selesai.
- [ ] Payment request monitor selesai.
- [ ] Ledger page selesai.
- [ ] Loan page selesai.
- [ ] Fee engine selesai.
- [ ] Bank service fee page selesai.
- [ ] Integration monitor selesai.
- [ ] API logs selesai.
- [ ] Documentation page selesai.

### Technical

- [ ] TypeScript strict mode aktif.
- [ ] ESLint dan Prettier aktif.
- [ ] API client memakai Gateway base URL.
- [ ] Token handling tersedia.
- [ ] Role guard tersedia.
- [ ] TanStack Query setup selesai.
- [ ] Mock API tersedia.
- [ ] Error mapper tersedia.

### UI/UX

- [ ] Design tokens konsisten.
- [ ] Loading states tersedia.
- [ ] Empty states tersedia.
- [ ] Error states tersedia.
- [ ] Success states tersedia.
- [ ] Responsive mobile dicek.
- [ ] Accessibility basic dicek.

### Testing

- [ ] Unit tests untuk fee calculator.
- [ ] Unit tests untuk loan calculator.
- [ ] Unit tests untuk permission utils.
- [ ] Component tests untuk TransferForm.
- [ ] Component tests untuk LedgerTable.
- [ ] E2E login sukses.
- [ ] E2E transfer sukses.
- [ ] E2E admin buka payment request detail.
- [ ] E2E admin buka ledger.

---

## 32. Recommended First Sprint Tasks

Untuk memulai implementasi secara efektif, lakukan urutan berikut:

1. Setup project React/Next.js TypeScript.
2. Setup Tailwind CSS dan design tokens.
3. Buat AppShell, Sidebar, dan Topbar.
4. Buat komponen UI dasar: Button, Card, Badge, Input, Table, Modal, Drawer.
5. Setup routing public dan authenticated.
6. Buat mock API untuk auth, balance, transfer, payment request, ledger, dan fee rules.
7. Implement landing page.
8. Implement login/register.
9. Implement dashboard user.
10. Implement balance page.
11. Implement transfer flow sampai receipt.

Setelah flow user banking stabil, lanjutkan ke admin dashboard, payment request monitor, ledger, fee engine, integration monitor, dan documentation.
