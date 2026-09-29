import { bacaTokenSesi } from '../lib/authClient';
import { setApiBridgeToken, flushAntreanOffline, db, stateStore } from '../lib/db';
import { User, Equipment, Rental, Contract, Payment, Maintenance, GpsTracking, ReportItem } from '../types';
import { sinkronCermin } from '../lib/fetchCollection';
import { berlanggananKoneksi, bacaKoneksi, tandaiOffline, type InfoKoneksi } from '../lib/connectionState';
import { berlanggananAntrean, jumlahAntrean } from '../lib/offlineQueue';
import type { SidebarBadges } from '../components/Sidebar';
import type { ProfilePatch } from '../pages/AccountSettings';
import { useState, useEffect, useCallback } from 'react';

/**
 * Seluruh data reaktif + cermin Worker + antrean offline + handler CRUD
 * (dipecah dari App.tsx siklus 91 part-5). App tinggal sesi dan routing.
 */
export function useAppData(currentUser: User | null, setCurrentUser: (u: User) => void) {
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

  /** Memuat data dari edge API; state lokal jadi fallback bila API tidak ada. */
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /* Siklus 69: status keterjangkauan Worker untuk banner peringatan. */
  const [koneksi, setKoneksi] = useState<InfoKoneksi>(bacaKoneksi);
  /* Siklus 70: jumlah mutasi tertahan di antrean offline (badge banner). */
  const [jumlahAntre, setJumlahAntre] = useState<number>(() => jumlahAntrean());

  const handleReloadData = useCallback(() => setReloadKey((k) => k + 1), []);

  /** Refresh reactive state */
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

  const notify = (message: string, tone: 'success' | 'error') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4000);
  };

  /**
   * Pemuatan awal: ambil koleksi dari edge API (sumber kebenaran produksi).
   *
   * Serverless: db.ts tidak punya method "muat semua" — data sudah di-cache
   * secara reaktif. Fungsinya tetap Async karena resolver HTTP memang async,
   * sehingga skeleton benar-benar terlihat saat demo di sidang.
   */
  useEffect(() => {
    const controller = new AbortController();
    let aktif = true;

    const muat = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        // Cermin PENUH dari Worker (users/equipments/rentals/contracts/
        // payments/maintenance/gps/reports) — bukan hanya dua koleksi lama,
        // supaya kontrak/pembayaran/servis ikut tersimpan permanen.
        setApiBridgeToken(bacaTokenSesi());
        const terisi = await sinkronCermin(controller.signal);
        if (!aktif) return;
        if (terisi === 0) {
          // Worker tidak menjawab sama sekali -> biarkan seed demo melayani.
          setDataError(null);
        }
        refreshData();
      } catch (err) {
        if (!aktif) return;
        setDataError(err instanceof Error ? err.message : 'Gagal memuat data dari server.');
      } finally {
        if (aktif) setDataLoading(false);
      }
    };

    muat();

    return () => {
      aktif = false;
      controller.abort();
    };
  }, [reloadKey]);

  /* Akar siklus 61 #3: effect mount di atas sempat berjalan SEBELUM token
     sesi ada (login terjadi setelahnya) sehingga cermin menganggur di seed
     demo — pelanggan tak melihat unit yang baru dibuat admin. Setiap kali
     user berganti (login), tarik ulang cermin penuh dengan token sah. */
  useEffect(() => {
    if (!currentUser) return;
    setApiBridgeToken(bacaTokenSesi());
    let aktif = true;
    void sinkronCermin()
      .then((n) => {
        if (aktif && n > 0) refreshData();
      })
      .catch(() => {
        /* Worker mati: seed lokal tetap melayani */
      });
    return () => {
      aktif = false;
    };
  }, [currentUser?.id]);

  /* Siklus 65: cermin LIVE. Perubahan dari pengguna lain (admin menambah
     unit, pelanggan mengajukan sewa) terlihat tanpa reload — pull ulang
     tiap 30 dtk saat tab terlihat, plus penyegaran segera ketika tab kembali
     fokus. Tab tersembunyi tidak menarik apa pun (hemat kuota worker). */
  useEffect(() => {
    if (!currentUser) return;
    let batal = false;
    const tarik = () => {
      if (document.hidden) return;
      void sinkronCermin()
        .then((n) => {
          if (!batal && n > 0) refreshData();
        })
        .catch(() => {});
    };
    const id = window.setInterval(tarik, 30_000);
    const saatFokus = () => tarik();
    window.addEventListener('focus', saatFokus);
    document.addEventListener('visibilitychange', saatFokus);
    return () => {
      batal = true;
      window.clearInterval(id);
      window.removeEventListener('focus', saatFokus);
      document.removeEventListener('visibilitychange', saatFokus);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const lepas = berlanggananKoneksi(() => setKoneksi(bacaKoneksi()));
    const lepas2 = berlanggananAntrean(() => setJumlahAntre(jumlahAntrean()));
    const saatOffline = () =>
      tandaiOffline('Perangkat tidak terhubung internet - perubahan menunggu jaringan pulih.');
    const saatOnline = () => {
      /* Pulih: kirim ulang antrean FIFO dulu (baru cermin) agar perubahan
         tertahan tidak tertimpa data server yang lebih baru. */
      void flushAntreanOffline()
        .then(({ terkirim, ditolak }) => {
          if (terkirim > 0) {
            notify(`${terkirim} perubahan tertahan terkirim ke server.`, 'success');
          }
          if (ditolak.length > 0) {
            notify(
              `${ditolak.length} perubahan tertahan ditolak server & dibuang: ${ditolak[0]}`,
              'error'
            );
          }
          void sinkronCermin().catch(() => {});
        })
        .catch(() => {});
    };
    window.addEventListener('offline', saatOffline);
    window.addEventListener('online', saatOnline);
    /* Jaga-jala: beberapa browser tidak event 'online' bila tab tersembunyi;
       cek berkala saat antrean menumpuk. */
    const idPemeriksa = window.setInterval(() => {
      if (jumlahAntrean() > 0 && navigator.onLine) saatOnline();
    }, 20_000);
    return () => {
      lepas();
      lepas2();
      window.clearInterval(idPemeriksa);
      window.removeEventListener('offline', saatOffline);
      window.removeEventListener('online', saatOnline);
    };
  }, []);

  /** Badge counter Sidebar — dihitung dari state reaktif yang sudah ada. */
  const sidebarBadges: SidebarBadges = {
    payments: payments.filter((p) => p.status === 'PENDING_VERIFICATION').length,
    rentals: rentals.filter((r) => r.status === 'PENDING').length,
    maintenance: maintenance.filter(
      (m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS'
    ).length,
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

  const handleCreateContract = async (rentalId: number) => {
    await db.createContract(rentalId);
    refreshData();
  };

  const handleSignContract = async (contractId: number, signerName: string, signature: string) => {
    await db.signContract(contractId, signerName, signature);
    refreshData();
  };

  /**
   * Perpanjangan kontrak kedaluwarsa (Admin/Staf).
   *
   * db.perpanjangKontrak melempar dengan pesan dari server bila ditolak
   * (mis. kontrak sudah ditandatangani) — pesan itu yang ditampilkan panel.
   */
  const handleRenewContract = async (contractId: number, validUntil: string) => {
    await db.perpanjangKontrak(contractId, validUntil);
    refreshData();
  };

  const handleVerifyPayment = async (paymentId: number, staffId: number, staffName: string) => {
    await db.verifyPayment(paymentId, staffId, staffName);
    refreshData();
  };

  const handleRejectPayment = async (paymentId: number, staffId: number, staffName: string) => {
    await db.rejectPayment(paymentId, staffId, staffName);
    refreshData();
  };

  const handleUploadPaymentProof = async (paymentId: number, proofPath: string) => {
    await db.addPaymentProof(paymentId, proofPath);
    refreshData();
  };

  /**
   * Menyimpan perubahan profil pengguna yang sedang masuk.
   * Hanya field non-sensitif yang diteruskan (lihat `db.updateUser`).
   */
  const handleSaveProfile = async (patch: ProfilePatch) => {
    if (!currentUser) return;
    const diperbarui = await db.updateUser(currentUser.id, patch);
    if (!diperbarui) throw new Error('Pengguna tidak ditemukan.');
    setCurrentUser({ ...currentUser, ...patch });
    sessionStorage.setItem('sbs_active_user', JSON.stringify({ ...currentUser, ...patch }));
    refreshData();
  };

  /** Mengganti password akun sendiri. */
  const handleChangeOwnPassword = async (passwordBaru: string, passwordLama: string) => {
    if (!currentUser) return;
    if (currentUser.role_name === 'ADMIN') {
      const hasil = await db.setUserPassword(currentUser.id, passwordBaru);
      if (!hasil) throw new Error('Pengguna tidak ditemukan.');
      return;
    }
    // STAFF/CUSTOMER: endpoint admin (/api/users/:id/password) dilarang untuk
    // mereka; pakai jalur mandiri yang membuktikan password lama di server.
    await db.changeOwnPassword(passwordLama, passwordBaru);
  };

  return {
    equipments, rentals, contracts, payments, maintenance, trackingData, reports, users,
    toast, dataLoading, dataError, koneksi, jumlahAntre, sidebarBadges,
    notify, refreshData, handleReloadData,
    handleAddEquipment, handleUpdateEquipment, handleDeleteEquipment,
    handleAddRental, handleUpdateRentalStatus, handleScheduleMaintenance,
    handleAddUser, handleToggleUserStatus,
    handleCreateContract, handleSignContract, handleRenewContract,
    handleVerifyPayment, handleRejectPayment, handleUploadPaymentProof,
    handleSaveProfile, handleChangeOwnPassword,
  };
}
