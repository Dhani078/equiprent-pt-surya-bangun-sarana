#!/usr/bin/env python3
"""
Watchdog loop agent EquipRent.

Ringan dan tidak memakai LLM: hanya membaca keadaan repo lalu melaporkan.
Digunakan oleh cron job terpisah agar Anda tetap tahu apakah agent 24/7
benar-benar bekerja, meski job agent-nya sedang dijeda.

Keluaran sengaja dibuat deterministik (tanpa timestamp) supaya monitor
perubahan bisa membedakan "ada kemajuan" dan "mandek".
"""
import json
import os
import subprocess

ROOT = r"C:\xampp\htdocs\PT. SURYA BANGUN SARANA BANJARMASIN"


def git(*args):
    try:
        return subprocess.run(
            ["git", *args], cwd=ROOT, capture_output=True, text=True, timeout=30
        ).stdout.strip()
    except Exception:
        return ""


def main():
    if not os.path.isdir(ROOT):
        print("ERROR: direktori proyek tidak ditemukan")
        return

    print("=== WATCHDOG EQUIPRENT ===")

    # 1. Commit terakhir
    last = git("log", "--oneline", "-1")
    print(f"Commit terakhir : {last or '(tidak ada)'}")

    # 2. Apakah lokal tertinggal dari remote?
    unpushed = git("log", "--oneline", "origin/main..HEAD")
    print(f"Belum ter-push  : {len(unpushed.splitlines()) if unpushed else 0} commit")

    # 3. Perubahan yang belum di-commit
    status = git("status", "--short")
    dirty = [l for l in status.splitlines() if l.strip()]
    print(f"Belum di-commit : {len(dirty)} berkas")
    for line in dirty[:5]:
        print(f"   {line}")
    if len(dirty) > 5:
        print(f"   ... dan {len(dirty) - 5} lagi")

    # 4. State agent
    state_path = os.path.join(ROOT, "STATE", "agent_state.json")
    try:
        with open(state_path, encoding="utf-8") as f:
            st = json.load(f)
        print(f"Cycle           : {st.get('cycle')}")
        print(f"Task saat ini   : {st.get('current_task_id')}")
        print(f"Terakhir jalan  : {st.get('last_run')}")
        print(f" Jumlah suite   : {st.get('test_suites')}")
    except Exception as e:
        print(f"State agent     : GAGAL DIBACA ({e})")

    # 5. Jumlah berkas laporan (indikator fitur baru)
    reports = os.path.join(ROOT, "src", "lib", "reports.ts")
    if os.path.isfile(reports):
        print(f"src/lib/reports.ts : {os.path.getsize(reports)} bita")
    else:
        print("src/lib/reports.ts : belum ada")


if __name__ == "__main__":
    main()
