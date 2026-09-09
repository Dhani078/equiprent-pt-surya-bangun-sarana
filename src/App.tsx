import React, { useState, useEffect } from 'react';
import { User, RoleName, Equipment, Rental, Contract, Payment, Maintenance, GpsTracking, ReportItem } from './types';
import { db, stateStore } from './lib/db';
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
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { CustomerPortal } from './pages/customer/CustomerPortal';

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

  // Reactive State
  const [equipments, setEquipments] = useState<Equipment[]>(stateStore.equipments);
  const [rentals, setRentals] = useState<Rental[]>(stateStore.rentals);
  const [contracts, setContracts] = useState<Contract[]>(stateStore.contracts);
  const [payments, setPayments] = useState<Payment[]>(stateStore.payments);
  const [maintenance, setMaintenance] = useState<Maintenance[]>(stateStore.maintenance);
  const [trackingData, setTrackingData] = useState<GpsTracking[]>(stateStore.gps);
  const [reports, setReports] = useState<ReportItem[]>(stateStore.reports);
  const [users, setUsers] = useState<User[]>(stateStore.users);

  /** Notifikasi sederhana di pojok kanan atas (sukses / galat). */
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const notify = (message: string, tone: 'success' | 'error') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4000);
  };

  // Refresh reactive state
  const refreshData = () => {
    setEquipments([...stateStore.equipments]);
    setRentals([...stateStore.rentals]);
    setContracts([...stateStore.contracts]);
    setPayments([...stateStore.payments]);
    setMaintenance([...stateStore.maintenance]);
    setTrackingData([...stateStore.gps]);
    setReports([...stateStore.reports]);
    setUsers([...stateStore.users]);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('sbs_active_user', JSON.stringify(user));
    } catch {}
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
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

  // State handlers
  const handleAddEquipment = async (item: Omit<Equipment, 'id'>) => {
    await db.addEquipment(item);
    refreshData();
  };

  const handleUpdateEquipment = async (id: number, data: Partial<Equipment>) => {
    await db.updateEquipment(id, data);
    refreshData();
  };

  const handleDeleteEquipment = async (id: number) => {
    await db.deleteEquipment(id);
    refreshData();
  };

  const handleAddRental = async (item: Omit<Rental, 'id' | 'rental_code'>) => {
    await db.addRental(item);
    refreshData();
  };

  const handleUpdateRentalStatus = async (id: number, status: Rental['status']) => {
    await db.updateRentalStatus(id, status);
    refreshData();
  };

  const handleScheduleMaintenance = async (item: Omit<Maintenance, 'id' | 'maintenance_code'>) => {
    await db.scheduleMaintenance(item);
    refreshData();
  };

  const handleAddUser = async (user: Omit<User, 'id'>) => {
    await db.addUser(user);
    refreshData();
  };

  const handleToggleUserStatus = async (id: number) => {
    await db.toggleUserStatus(id);
    refreshData();
  };

  const handleSignContract = async (contractId: number) => {
    await db.signContract(contractId);
    refreshData();
  };

  const handleVerifyPayment = async (paymentId: number, staffId: number, staffName: string) => {
    await db.verifyPayment(paymentId, staffId, staffName);
    refreshData();
  };

  const handleUploadPaymentProof = async (paymentId: number, proofPath: string) => {
    await db.addPaymentProof(paymentId, proofPath);
    refreshData();
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          role={currentUser.role_name || 'ADMIN'}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          {/* ADMIN SCREENS */}
          {currentUser.role_name === 'ADMIN' && (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard onNavigate={setActiveTab} />
              )}
              {activeTab === 'equipment' && (
                <EquipmentManagement
                  equipments={equipments}
                  onAddEquipment={handleAddEquipment}
                  onUpdateEquipment={handleUpdateEquipment}
                  onDeleteEquipment={handleDeleteEquipment}
                  onNotify={notify}
                />
              )}
              {activeTab === 'rentals' && (
                <RentalManagement
                  rentals={rentals}
                  equipments={equipments}
                  users={users}
                  onAddRental={handleAddRental}
                  onUpdateRentalStatus={handleUpdateRentalStatus}
                />
              )}
              {activeTab === 'maintenance' && (
                <MaintenanceManagement
                  maintenance={maintenance}
                  equipments={equipments}
                  users={users}
                  onScheduleMaintenance={handleScheduleMaintenance}
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
              {activeTab === 'settings' && (
                <div className="card-premium animate-fade-in" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px 0' }}>
                    Konfigurasi Sistem & Basis Data TiDB Cloud
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-secondary)', lineHeight: 1.6 }}>
                    Sistem ini berjalan di <strong>Cloudflare Workers Edge Network</strong> dan terhubung ke <strong>TiDB Cloud Serverless</strong>.
                  </p>
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12.5px', fontFamily: 'monospace' }}>
                    <div><strong>Runtime:</strong> Cloudflare Workers (V8 JavaScript/TypeScript Edge)</div>
                    <div><strong>Database Engine:</strong> TiDB Cloud Serverless (MySQL 8.0 Compatible)</div>
                    <div><strong>Driver:</strong> @tidbcloud/serverless (Edge HTTPS Driver)</div>
                    <div><strong>Organisasi:</strong> PT. Surya Bangun Sarana Banjarmasin</div>
                  </div>
                </div>
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
                  currentUser={currentUser}
                  onVerifyPayment={handleVerifyPayment}
                  onUpdateRentalStatus={handleUpdateRentalStatus}
                />
              )}
              {activeTab === 'maintenance' && (
                <MaintenanceManagement
                  maintenance={maintenance}
                  equipments={equipments}
                  users={users}
                  onScheduleMaintenance={handleScheduleMaintenance}
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
                />
              )}
              {activeTab === 'settings' && (
                <div className="card-premium animate-fade-in" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Profil Staf Operasional
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                    {currentUser.full_name} &bull; Staf Logistik & Administrasi Lapangan
                  </p>
                </div>
              )}
            </>
          )}

          {/* CUSTOMER SCREENS */}
          {currentUser.role_name === 'CUSTOMER' && (
            <>
              <CustomerPortal
                currentUser={currentUser}
                equipments={equipments}
                rentals={rentals}
                contracts={contracts}
                payments={payments}
                onAddRental={handleAddRental}
                onSignContract={handleSignContract}
                onUploadPaymentProof={handleUploadPaymentProof}
              />
            </>
          )}
        </main>
      </div>

      {/* Notifikasi global: muncul setelah aksi berhasil / gagal. */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            maxWidth: '380px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-eight)',
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: toast.tone === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${toast.tone === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: toast.tone === 'success' ? '#065F46' : '#991B1B',
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;
