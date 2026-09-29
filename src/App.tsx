import { bacaTokenSesi, hapusTokenSesi } from './lib/authClient';
import { setApiBridgeToken } from './lib/db';
import React, { useState, useEffect } from 'react';
import { User, RoleName } from './types';
import { stateStore } from './lib/db';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EquipmentManagement } from './pages/admin/EquipmentManagement';
import { RentalManagement } from './pages/admin/RentalManagement';
import { MaintenanceManagement } from './pages/admin/MaintenanceManagement';
import { GpsTrackingPage } from './pages/admin/GpsTrackingPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { UserManagement } from './pages/admin/UserManagement';
import { AuditLogPanel } from './components/AuditLogPanel';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { AccountSettings } from './pages/AccountSettings';
import { buildNotifications } from './lib/notifications';
import { CommandPalette } from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppData } from './hooks/useAppData';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { DataErrorBanner } from './components/layout/DataErrorBanner';
import { ToastNotif } from './components/layout/ToastNotif';

export const App: React.FC = () => {
  // Default to null so the user always enters via the authentic Login Screen
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('sbs_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  /** Drawer navigasi HP (<= 767px). */
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  /** Palet perintah Ctrl/⌘ + K. */
  const [paletteOpen, setPaletteOpen] = useState(false);

  /* Siklus 91 p5: seluruh data reaktif, cermin Worker, antrean offline,
     dan handler CRUD hidup di hook terpisah — App tinggal sesi & routing. */
  const data = useAppData(currentUser, (u) => setCurrentUser(u));
  const {
    equipments, rentals, contracts, payments, maintenance, trackingData, reports, users,
    toast, dataLoading, dataError, koneksi, jumlahAntre, sidebarBadges,
    notify, handleReloadData,
    handleAddEquipment, handleUpdateEquipment, handleDeleteEquipment,
    handleAddRental, handleUpdateRentalStatus, handleScheduleMaintenance,
    handleAddUser, handleToggleUserStatus,
    handleCreateContract, handleSignContract, handleRenewContract,
    handleVerifyPayment, handleRejectPayment, handleUploadPaymentProof,
    handleSaveProfile, handleChangeOwnPassword,
  } = data;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('sbs_active_user', JSON.stringify(user));
    } catch {}
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    hapusTokenSesi();
    setApiBridgeToken(null);
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('sbs_active_user');
    } catch {}
  };

  const handleSwitchRole = (role: RoleName) => {
    const targetUser = stateStore.users.find(u => u.role_name === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      try {
        sessionStorage.setItem('sbs_active_user', JSON.stringify(targetUser));
      } catch {}
      setActiveTab('dashboard');
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Notifikasi disusun ulang setiap data berubah — modul murni, aman dipanggil
  // saat render.
  const notifications = buildNotifications(
    { rentals, payments, maintenance, contracts },
    currentUser.role_name || 'ADMIN',
    currentUser.id
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onSelectTab={(tab) => { setActiveTab(tab); setMenuTerbuka(false); }}
        onToggleSidebar={() => setMenuTerbuka((o) => !o)}
      />

      <OfflineBanner koneksi={koneksi} jumlahAntre={jumlahAntre} />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Backdrop drawer HP — hanya muncul saat drawer terbuka (CSS). */}
        {menuTerbuka && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMenuTerbuka(false)}
            aria-hidden="true"
          />
        )}
        <Sidebar
          role={currentUser.role_name || 'ADMIN'}
          activeTab={activeTab}
          onSelectTab={(tab) => { setActiveTab(tab); setMenuTerbuka(false); }}
          badges={sidebarBadges}
          mobileOpen={menuTerbuka}
        />

        <main style={{ flex: 1, minWidth: 0, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          {/* T-0072: boundary per-rute — crash satu halaman hanya mengganti
              area kontennya, navbar/sidebar tetap hidup. Ganti rute/tab
              otomatis me-reset boundary (resetKey). */}
          <ErrorBoundary resetKey={`${currentUser.role_name}:${activeTab}`}>
            {/* Notifikasi galat pemuatan data awal — bisa dicoba ulang. */}
            {dataError && !dataLoading && (
              <DataErrorBanner pesan={dataError} onRetry={handleReloadData} />
            )}
            {/* ADMIN SCREENS */}
            {currentUser.role_name === 'ADMIN' && (
              <>
                {activeTab === 'dashboard' && (
                  <AdminDashboard onNavigate={setActiveTab} />
                )}
                {activeTab === 'equipment' && (
                  <EquipmentManagement
                    equipments={equipments}
                    maintenance={maintenance}
                    onAddEquipment={handleAddEquipment}
                    onUpdateEquipment={handleUpdateEquipment}
                    onDeleteEquipment={handleDeleteEquipment}
                    onScheduleMaintenance={handleScheduleMaintenance}
                    onNotify={notify}
                    isLoading={dataLoading}
                  />
                )}
                {activeTab === 'rentals' && (
                  <RentalManagement
                    rentals={rentals}
                    equipments={equipments}
                    users={users}
                    contracts={contracts}
                    onAddRental={handleAddRental}
                    onUpdateRentalStatus={handleUpdateRentalStatus}
                    onCreateContract={handleCreateContract}
                    onSignContract={handleSignContract}
                    onRenewContract={handleRenewContract}
                    onNotify={notify}
                    isLoading={dataLoading}
                  />
                )}
                {activeTab === 'maintenance' && (
                  <MaintenanceManagement
                    maintenance={maintenance}
                    equipments={equipments}
                    users={users}
                    onScheduleMaintenance={handleScheduleMaintenance}
                    onNotify={notify}
                  />
                )}
                {activeTab === 'tracking' && (
                  <GpsTrackingPage
                    trackingData={trackingData}
                  />
                )}
                {activeTab === 'reports' && (
                  <ReportsPage
                    reports={reports}
                    rentals={rentals}
                    equipments={equipments}
                    onNotify={notify}
                  />
                )}
                {activeTab === 'users' && (
                  <UserManagement
                    users={users}
                    onAddUser={handleAddUser}
                    onToggleStatus={handleToggleUserStatus}
                    onNotify={notify}
                  />
                )}
                {activeTab === 'audit' && (
                  <AuditLogPanel />
                )}
                {activeTab === 'settings' && (
                  <AccountSettings
                    currentUser={currentUser}
                    onSaveProfile={handleSaveProfile}
                    onChangePassword={handleChangeOwnPassword}
                    onNotify={notify}
                  />
                )}
              </>
            )}

            {/* STAFF SCREENS */}
            {currentUser.role_name === 'STAFF' && (
              <>
                {(activeTab === 'dashboard' || activeTab === 'payments' || activeTab === 'contracts' || activeTab === 'rentals') && (
                  <StaffDashboard
                    rentals={rentals}
                    contracts={contracts}
                    payments={payments}
                    maintenance={maintenance}
                    equipments={equipments}
                    users={users}
                    currentUser={currentUser}
                    onVerifyPayment={handleVerifyPayment}
                    onRejectPayment={handleRejectPayment}
                    onUpdateRentalStatus={handleUpdateRentalStatus}
                    onCreateContract={handleCreateContract}
                    onSignContract={handleSignContract}
                    onRenewContract={handleRenewContract}
                    onNotify={notify}
                    activeMenu={activeTab}
                  />
                )}
                {activeTab === 'maintenance' && (
                  <MaintenanceManagement
                    maintenance={maintenance}
                    equipments={equipments}
                    users={users}
                    onScheduleMaintenance={handleScheduleMaintenance}
                    onNotify={notify}
                  />
                )}
                {activeTab === 'tracking' && (
                  <GpsTrackingPage
                    trackingData={trackingData}
                  />
                )}
                {activeTab === 'reports' && (
                  <ReportsPage
                    reports={reports}
                    rentals={rentals}
                    equipments={equipments}
                    onNotify={notify}
                  />
                )}
                {activeTab === 'settings' && (
                  <AccountSettings
                    currentUser={currentUser}
                    onSaveProfile={handleSaveProfile}
                    onChangePassword={handleChangeOwnPassword}
                    onNotify={notify}
                  />
                )}
              </>
            )}

            {/* CUSTOMER SCREENS */}
            {currentUser.role_name === 'CUSTOMER' && (
              <>
                <CustomerPortal
                  currentUser={currentUser}
                  activeMenu={activeTab}
                  equipments={equipments}
                  rentals={rentals}
                  contracts={contracts}
                  payments={payments}
                  trackingData={trackingData}
                  onAddRental={handleAddRental}
                  onSignContract={handleSignContract}
                  onRenewContract={handleRenewContract}
                  onUploadPaymentProof={handleUploadPaymentProof}
                />
              </>
            )}
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette
        role={currentUser.role_name || 'ADMIN'}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={setActiveTab}
      />

      <ToastNotif toast={toast} />
    </div>
  );
};

export default App;
