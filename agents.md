# AI & AGENT CONTEXT INSTRUCTIONS (agents.md)
**Project:** Heavy Equipment Monitoring & Rental System — PT. SURYA BANGUN SARANA BANJARMASIN
*Attach or reference this file in any AI assistant session (Antigravity, Claude, ChatGPT) for 100% technical and domain alignment.*

---

## 1. PROJECT OVERVIEW & GOALS
*   **Company Context:** PT. SURYA BANGUN SARANA BANJARMASIN (Heavy Equipment Rental, Earthmoving & Mining Fleet Management in South Kalimantan).
*   **Academic Purpose:** Undergraduate Thesis (Skripsi) Project — Full Production Ready standard.
*   **Live Deployment URL:** `https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev`
*   **Strict UI Target:** 100% fidelity to the Stitch Design Prototype (Screen ID `a6fb0175663c412c905b14d514f1662c` and related screens).
*   **Core Academic Modules:** Multi-Role Authentication, Hour Meter (HM) Tracking, Live GPS Telemetry with Leaflet.js, E-Signature Contract Signing, Bank Transfer Verification, and Official BAST/Surat Jalan PDF generation.

---

## 2. DUAL-STACK TECHNOLOGY ARCHITECTURE
The repository supports both modern edge deployment and legacy XAMPP local testing:

1.  **Modern Production Stack (Cloudflare Edge & TiDB Cloud):**
    *   **Frontend:** React 18, TypeScript, Vite 5.4, TailwindCSS, Lucide Icons, Leaflet.js.
    *   **Edge Router:** Hono.js running on Cloudflare Workers V8 Isolate.
    *   **Database:** TiDB Cloud Serverless (MySQL 8.0 Compatible Distributed SQL) via `@tidbcloud/serverless`.
    *   **Deployment:** Wrangler CLI with automated GitHub CI/CD webhook.

2.  **Legacy Local Prototype Stack (XAMPP PHP):**
    *   Preserved in `views/`, `controllers/`, `models/`, `index.php` for local testing on Apache/phpMyAdmin.

---

## 3. STRICT CODING & SECURITY GUIDELINES
1.  **Credential Protection:** Never commit `.env` or sensitive database passwords to GitHub. Use Cloudflare Secrets or local `.gitignore`.
2.  **Authentic Assets:** Always use official Stitch prototype assets defined in `src/lib/stitchAssets.ts` for heavy equipment photos and user avatars.
3.  **Clean Code & Micro-animations:**
    *   Primary Color: `#003366`
    *   Secondary Color: `#475569`
    *   Background: `#F1F5F9` / Industrial Navy `#001E40`
    *   Border Radius: `8px` (`ROUND_EIGHT`)
    *   Card Lift Hover: `transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 51, 102, 0.08);`
    *   Animation Fade-in: `fadeInUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);`
4.  **Academic Integrity:** Ensure all button workflows and modals remain operational and accessible during thesis defense demonstrations.

---

## 4. RELATIONAL DATABASE REFERENCE (TIDB CLOUD)
9 Relational tables documented in `DATABASE_TIDB.md`:
*   `roles` (ADMIN, STAFF, CUSTOMER)
*   `users` (50 accounts, password `admin`, `staff`, `user`)
*   `equipments` (50 units: Excavator, Dozer, Roller, Loader, Crane)
*   `rentals` (50 transaction records)
*   `contracts` (50 legal digital agreements)
*   `payments` (50 records, total Rp 3.270.150.000)
*   `maintenance` (25 service logs)
*   `gps_tracking` (55 geospatial coordinates in Banjarmasin/Trisakti)
*   `reports` (20 official BAST & Surat Jalan records)
