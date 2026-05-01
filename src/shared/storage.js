// 极薄 localStorage 封装：包 try/catch，支持隐私模式 / 配额满静默失败
export function load(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function save(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}
