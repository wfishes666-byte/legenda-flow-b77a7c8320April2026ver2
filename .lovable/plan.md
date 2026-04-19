
User wants: di Log Kegiatan, baris permintaan reset password (yang merah) saat di-klik memunculkan opsi untuk menandai **Solved** / **Unsolved**.

Saat ini dialog hanya punya tombol "Generate Link" + "Tandai Selesai". User minta opsi yang lebih jelas: **Solved** (selesai/sudah dibantu) dan **Unsolved** (belum / dibatalkan / tidak valid).

Status di tabel `password_reset_requests` saat ini: `pending`, `link_generated`, `completed`. Saya akan tambahkan `unsolved` (atau pakai status `cancelled`) dan update UI.

Plan ringkas dan terfokus.
