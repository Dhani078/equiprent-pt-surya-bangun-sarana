"""Siklus 66: responsif HP — sidebar drawer + hamburger + ringkas navbar + grid aman 360px."""
import io, re

BASE='C:/xampp/htdocs/PT. SURYA BANGUN SARANA BANJARMASIN'

def read(p):
    s=io.open(p,encoding='utf-8',newline='').read()
    NL='\r\n' if '\r\n' in s[:2000] else '\n'
    return s.replace('\r\n','\n'), NL
def save(p,s,NL):
    io.open(p,'w',encoding='utf-8',newline='').write(s.replace('\n',NL))

# ---------------- Sidebar.tsx ----------------
p=BASE+'/src/components/Sidebar.tsx'
s,NL=read(p)
old="""interface SidebarProps {
  role: RoleName;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  badges?: SidebarBadges;
}"""
new="""interface SidebarProps {
  role: RoleName;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  badges?: SidebarBadges;
  /** Drawer mobile: true = terbuka (<= 767px). Diabaikan di layar lebar. */
  mobileOpen?: boolean;
}"""
assert s.count(old)==1, 'props'
s=s.replace(old,new)

old="""export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onSelectTab, badges = {} }) => {"""
new="""export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onSelectTab, badges = {}, mobileOpen = false }) => {"""
assert s.count(old)==1, 'sig'
s=s.replace(old,new)

old="""    <aside style={{
      width: '260px',
      flexShrink: 0, /* cegah menyusut saat halaman bertabel lebar (bug BAST) */
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: '64px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 12px',
      overflowY: 'auto'
    }}>"""
new="""    <aside
      className={'app-sidebar' + (mobileOpen ? ' is-open' : '')}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 12px',
      }}
    >"""
assert s.count(old)==1, 'aside'
s=s.replace(old,new)
save(p,s,NL); print('Sidebar OK')

# ---------------- Navbar.tsx ----------------
p=BASE+'/src/components/Navbar.tsx'
s,NL=read(p)
old="import { LogOut, Shield, Moon, Sun, ChevronDown, Languages } from 'lucide-react';"
new="import { LogOut, Shield, Moon, Sun, ChevronDown, Languages, Menu } from 'lucide-react';"
assert s.count(old)==1, 'navimp'
s=s.replace(old,new)

old="""  /** Dipanggil saat notifikasi diklik, dengan id tab tujuan. */
  onSelectTab?: (tab: string) => void;
}"""
new="""  /** Dipanggil saat notifikasi diklik, dengan id tab tujuan. */
  onSelectTab?: (tab: string) => void;
  /** Buka/tutup drawer sidebar di HP (<= 767px). */
  onToggleSidebar?: () => void;
}"""
assert s.count(old)==1, 'navprops'
s=s.replace(old,new)

old="""export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  notifications = [],
  onSelectTab,
}) => {"""
new="""export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  notifications = [],
  onSelectTab,
  onToggleSidebar,
}) => {"""
assert s.count(old)==1, 'navsig'
s=s.replace(old,new)

old="""      {/* Title / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',"""
new="""      {/* Title / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          type="button"
          className="sidebar-hamburger btn-secondary"
          onClick={onToggleSidebar}
          aria-label="Buka menu navigasi"
          style={{ padding: '7px 9px', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={18} />
        </button>
        <div style={{
          width: '38px',"""
assert s.count(old)==1, 'navburger'
s=s.replace(old,new)

# sembunyikan teks perusahaan + subjudul di HP
old="""        <div>
          <h1 style={{ fontSize: 'var(--fs-h2)', fontWeight: 800, color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>
            PT. SURYA BANGUN SARANA BANJARMASIN
          </h1>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-secondary)', margin: 0 }}>
            Sistem Monitoring &amp; Rental Alat Berat
          </p>
        </div>"""
new="""        <div className="navbar-brand-text" style={{ minWidth: 0 }}>
          <h1 className="navbar-company" style={{ fontSize: 'var(--fs-h2)', fontWeight: 800, color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>
            PT. SURYA BANGUN SARANA BANJARMASIN
          </h1>
          <p className="navbar-subtitle" style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Sistem Monitoring &amp; Rental Alat Berat
          </p>
        </div>"""
assert s.count(old)==1, 'navbrand'
s=s.replace(old,new)
save(p,s,NL); print('Navbar OK')

# ---------------- App.tsx ----------------
p=BASE+'/src/App.tsx'
s,NL=read(p)
old="""      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onSelectTab={setActiveTab}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          role={currentUser.role_name || 'ADMIN'}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          badges={sidebarBadges}
        />"""
new="""      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onSelectTab={(tab) => { setActiveTab(tab); setMenuTerbuka(false); }}
        onToggleSidebar={() => setMenuTerbuka((o) => !o)}
      />

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
        />"""
assert s.count(old)==1, 'app'
s=s.replace(old,new)

old="""  const [activeTab, setActiveTab] = useState<string>('dashboard');"""
new="""  const [activeTab, setActiveTab] = useState<string>('dashboard');
  /** Drawer navigasi HP (<= 767px). */
  const [menuTerbuka, setMenuTerbuka] = useState(false);"""
assert s.count(old)==1, 'menuState'
s=s.replace(old,new)
save(p,s,NL); print('App OK')

# ---------------- index.css ----------------
p=BASE+'/src/index.css'
s,NL=read(p)
old="/* ---------- Print / Cetak ---------- */"
if old not in s:
    # cari anchor lain
    idx=s.find('@media print')
    old=s[:idx] and '@media print {'
assert '@media print' in s, 'cssanchor'
css_add = """
/* ---------- Responsif HP (siklus 66) ---------- */
.app-sidebar {
  width: 260px;
  flex-shrink: 0; /* cegah menyusut saat halaman bertabel lebar (bug BAST) */
  height: calc(100vh - 64px);
  position: sticky;
  top: 64px;
  overflow-y: auto;
}
.sidebar-hamburger { display: none; }
.sidebar-backdrop { display: none; }

@media (max-width: 767px) {
  .app-sidebar {
    position: fixed;
    top: 64px;
    left: 0;
    bottom: 0;
    height: auto;
    z-index: 250;
    transform: translateX(-105%);
    transition: transform 0.22s ease;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.28);
  }
  .app-sidebar.is-open { transform: none; }
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 64px 0 0 0;
    background: rgba(2, 6, 23, 0.55);
    z-index: 240;
  }
  .sidebar-hamburger { display: flex; }
  .navbar-company { font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 42vw; }
  .navbar-subtitle { display: none; }
  .navbar-lang, .navbar-theme-label { display: none; }
  main { padding: 14px !important; }
}

"""
s=s.replace('@media print {', css_add + '@media print {', 1)
save(p,s,NL); print('CSS OK')

# class untuk tombol bahasa/tema agar bisa disembunyikan sebagian di HP
p=BASE+'/src/components/Navbar.tsx'
s,NL=read(p)
old="""          className="btn-secondary"
          title={bahasa === 'id' ? 'Switch to English' : 'Beralih ke Bahasa Indonesia'}"""
new="""          className="btn-secondary navbar-lang"
          title={bahasa === 'id' ? 'Switch to English' : 'Beralih ke Bahasa Indonesia'}"""
assert s.count(old)==1, 'langclass'
s=s.replace(old,new)
save(p,s,NL); print('Navbar lang class OK')

# ---------------- grid aman 360px ----------------
p=BASE+'/src/pages/admin/AdminDashboard.tsx'
s,NL=read(p)
for a,b in [("minmax(420px, 1fr)","minmax(min(420px, 100%), 1fr)"),
            ("minmax(460px, 1fr)","minmax(min(460px, 100%), 1fr)")]:
    n=s.count(a); assert n>=1, a
    s=s.replace(a,b)
save(p,s,NL); print('AdminDashboard grid OK')
print('SEMUA PATCH 66 SELESAI')
