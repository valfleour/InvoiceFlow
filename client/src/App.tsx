import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BusinessProvider } from './app/context/BusinessContext';
import { ProtectedAppLayout } from './shared/components/ProtectedAppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { BusinessProfilePage } from './features/business-profile/BusinessProfilePage';
import { CreateBusinessProfilePage } from './features/business-profile/CreateBusinessProfilePage';
import { EditBusinessProfilePage } from './features/business-profile/EditBusinessProfilePage';
import { ClientsPage } from './features/clients/ClientsPage';
import { CreateClientPage } from './features/clients/CreateClientPage';
import { EditClientPage } from './features/clients/EditClientPage';
import { InvoiceListPage } from './features/invoices/InvoiceListPage';
import { CreateInvoicePage } from './features/invoices/CreateInvoicePage';
import { InvoiceDetailPage } from './features/invoices/InvoiceDetailPage';
import { EditInvoicePage } from './features/invoices/EditInvoicePage';
import { AccountOverviewPage } from './features/account/AccountOverviewPage';
import { AccountPreferencesPage } from './features/account/AccountPreferencesPage';
import { LandingPage } from './features/marketing/LandingPage';
import { ResetPasswordPage } from './features/marketing/ResetPasswordPage';
import { SignInPage } from './features/marketing/SignInPage';
import { SignUpPage } from './features/marketing/SignUpPage';
import { VerifyEmailPage } from './features/marketing/VerifyEmailPage';

export default function App() {
  return (
    <BrowserRouter>
      <BusinessProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedAppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/businesses" element={<BusinessProfilePage />} />
            <Route path="/businesses/new" element={<CreateBusinessProfilePage />} />
            <Route path="/businesses/:id/edit" element={<EditBusinessProfilePage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/new" element={<CreateClientPage />} />
            <Route path="/clients/:id/edit" element={<EditClientPage />} />
            <Route path="/invoices" element={<InvoiceListPage />} />
            <Route path="/invoices/new" element={<CreateInvoicePage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/invoices/:id/edit" element={<EditInvoicePage />} />
            <Route path="/account" element={<AccountOverviewPage />} />
            <Route path="/account/preferences" element={<AccountPreferencesPage />} />
          </Route>
        </Routes>
      </BusinessProvider>
    </BrowserRouter>
  );
}
