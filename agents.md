# AI & AGENT CONTEXT INSTRUCTIONS (agents.md)
**Project:** Heavy Equipment Monitoring & Rental System — PT. SURYA BANGUN SARANA BANJARMASIN
*Attach or paste this file at the start of any AI coding assistant session (Antigravity, Claude, ChatGPT, etc.) to ensure 100% alignment.*

---

## 1. PROJECT OVERVIEW & GOALS
*   **Company Context:** PT. SURYA BANGUN SARANA BANJARMASIN (Heavy Equipment Rental & Fleet Management).
*   **Academic Goal:** Undergraduate Thesis (Skripsi) Project.
*   **Strict UI Target:** 100% identical styling, layout alignment, and premium micro-animations with the Stitch Prototypes (30 Screens total under Project ID `11860082075099958078`).
*   **Key Academic Modules:** Multi-Role Authentication, Operational Hour Meter (HM) Accumulation, Live GPS Telemetry/Tracking, BAST/Surat Jalan official PDF Exports, and Staff/Customer dashboards.

---

## 2. TECHNOLOGY STACK
*   **Environment:** XAMPP (Local Web Server).
*   **Database:** MySQL / MariaDB (managed via phpMyAdmin).
*   **Backend:** PHP (Native or CodeIgniter - *check directory first before generating*).
*   **Frontend:** Standard HTML5, CSS3 (using Hanken Grotesk / Inter fonts, strict primary `#003366` and secondary `#475569` colors), and Vanilla JavaScript.
*   **Map Integration:** Leaflet.js or Google Maps API for tracking telemetry coordinates.

---

## 3. STRICT CODING GUIDELINES
When writing code for this project, you **MUST** adhere to the following:
1.  **No Dummy Data:** All database queries must interface directly with the schemas defined in `DESIGN.md`.
2.  **Strict MVC Pattern:** 
    *   **Models:** Handle clean PDO transactions and security-focused queries.
    *   **Controllers:** Process input validation, session checks (Admin, Staff, Customer), and workflow transitions.
    *   **Views:** Pure presentation. Use relative paths and responsive layouts.
3.  **UI Consistency:** Always read the design tokens from `DESIGN.md` (Design Theme colors: Primary `#003366`, Secondary `#475569`, Corner roundness `ROUND_EIGHT` or `8px`, Font family `Hanken Grotesk`).
4.  **Academic Integrity:** Write clean, descriptive code comments in Indonesian or English. Keep algorithms understandable for oral presentations (*Sidang Skripsi*).

---

## 4. PREMIUM ANIMATIONS & MICRO-INTERACTIONS
To ensure a state-of-the-art user experience that strictly matches the premium feel of the Stitch prototypes, all generated CSS and JS **MUST** implement these exact transition and animation standards:

1.  **Global Smooth Transitions:**
    *   Apply `transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);` to all interactive elements (buttons, inputs, cards, sidebar links).
2.  **Button Hover & Active Micro-interactions:**
    *   *Hover state:* Elevate slightly using `transform: translateY(-1.5px);` and enhance contrast/brightness or add a subtle box shadow: `box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);`.
    *   *Active state:* Press down using `transform: translateY(0.5px) scale(0.98);`.
3.  **Card Lift Hover (Equipments & Stats):**
    *   *Normal:* Border radius `8px` (`ROUND_EIGHT`), border `1px solid #E2E8F0`, background `#FFFFFF`.
    *   *Hover:* Lift card using `transform: translateY(-4px);` and apply a smooth premium drop shadow: `box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);`.
4.  **Sidebar Slide-in & Active Transitions:**
    *   Sidebar navigation links must have a smooth background expansion from left to right on hover. Active links must feature a bold primary color state `#003366` and a sharp focus border accent.
5.  **Page Load & Content Fades:**
    *   Implement a gentle content slide-fade entrance on view loads using CSS keyframes:
        ```css
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in {
            animation: fadeInUp 0.45s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        ```
6.  **Input Focus States:**
    *   Inputs should expand their active border color smoothly to primary `#003366` and showcase a soft glow ring: `box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);`.

---

## 5. SCHEMA REFERENCE SUMMARY
Verify queries against these active tables (Full DDL in `DESIGN.md`):
*   `roles` (ADMIN, STAFF, CUSTOMER)
*   `users` (Aktor login)
*   `equipments` (Alat berat & status sewa/Hour Meter)
*   `rentals` (Transaksi booking sewa)
*   `contracts` (Dokumen sewa legal)
*   `payments` (Pencatatan & konfirmasi pembayaran)
*   `maintenance` (Jadwal servis berkala & HM log)
*   `gps_tracking` (Telemetri latitude/longitude koordinat aktif)
*   `reports` (Log ekspor PDF resmi - BAST & Surat Jalan)

---

## 6. CORE WORKFLOWS FOR THE AGENT
If asked to build a feature, execute these steps systematically:
1.  Read `DESIGN.md` in the root workspace first to verify column names and datatypes.
2.  Produce modular, scalable code components.
3.  Write secure PDO SQL queries to prevent SQL injections.
4.  Verify structural integrity by writing mock query tests if necessary.
