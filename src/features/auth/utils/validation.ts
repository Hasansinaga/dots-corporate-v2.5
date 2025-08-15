export function validateLogin(values: { kodeKantor: string; username: string; password: string }) {
  const errors: Record<string, string> = {}
  if (!values.kodeKantor) errors.kodeKantor = "Kode kantor wajib diisi"
  else if (!/^\d{6}$/.test(values.kodeKantor)) errors.kodeKantor = "Harus 6 digit"
  if (!values.username) errors.username = "Nama pengguna wajib diisi"
  if (!values.password) errors.password = "Kata sandi wajib diisi"
  return { ok: Object.keys(errors).length === 0, errors }
}