import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Gamepad2,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Game, Genre, NewsCategory, NewsItem, Platform, User, UserRole } from '../types';
import { formatCOP } from '../utils/formatters';

interface AdminDashboardProps {
  adminUser: User;
  games: Game[];
  news: NewsItem[];
  onRefreshBootstrap: () => Promise<void>;
  onSyncCheapShark: () => Promise<void>;
  onNotify: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const ALL_PLATFORMS: Platform[] = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Android/Móvil'];
const ALL_GENRES: Genre[] = ['Acción', 'RPG', 'Aventura', 'Deportes', 'Indie', 'Mundo Abierto'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  games,
  news,
  onRefreshBootstrap,
  onSyncCheapShark,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'games' | 'news'>('accounts');
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<User>>({});
  const [newAcc, setNewAcc] = useState({
    name: '',
    email: '',
    passwordHash: '',
    role: 'usuario' as UserRole,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Game form state
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [gameForm, setGameForm] = useState({
    title: '',
    developer: '',
    genre: 'Acción' as Genre,
    platforms: ['PC'] as Platform[],
    bestStore: 'Steam Colombia',
    originalPriceCop: 159900,
    finalPriceCop: 79900,
    synopsis: '',
    isFeatured: true,
  });

  // News form state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    category: 'Noticias' as NewsCategory,
    author: adminUser.name,
    summary: '',
    content: '',
  });

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-user-id': adminUser.id },
      });
      const data = (await res.json()) as { ok: boolean; users?: User[] };
      if (data.ok && data.users) {
        setAccounts(data.users);
      }
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [adminUser.id]);

  // ==========================================
  // Accounts (Excel / AppSheet) Handlers
  // ==========================================
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': adminUser.id,
      },
      body: JSON.stringify(newAcc),
    });
    const data = (await res.json()) as { ok: boolean; users?: User[]; error?: string };
    if (!data.ok || !data.users) {
      onNotify('Error al crear cuenta', data.error, 'error');
      return;
    }
    setAccounts(data.users);
    setNewAcc({ name: '', email: '', passwordHash: '', role: 'usuario' });
    onNotify('Cuenta agregada', 'La hoja Excel y base de datos se sincronizaron.', 'success');
  };

  const handleSaveAccountEdit = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': adminUser.id,
      },
      body: JSON.stringify(editDraft),
    });
    const data = (await res.json()) as { ok: boolean; users?: User[]; error?: string };
    if (!data.ok || !data.users) {
      onNotify('No se pudo actualizar', data.error, 'error');
      return;
    }
    setAccounts(data.users);
    setEditingAccountId(null);
    setEditDraft({});
    onNotify('Fila actualizada', 'Cambios guardados en la base de datos y Excel.', 'success');
  };

  const handleDeleteAccount = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { 'x-user-id': adminUser.id },
    });
    const data = (await res.json()) as { ok: boolean; users?: User[]; error?: string };
    if (!data.ok || !data.users) {
      onNotify('No se pudo eliminar', data.error, 'error');
      return;
    }
    setAccounts(data.users);
    onNotify('Cuenta eliminada', 'Registro removido de la tabla.', 'info');
  };

  const handleExportExcel = () => {
    const link = document.createElement('a');
    link.href = `/api/admin/excel/export?userId=${encodeURIComponent(adminUser.id)}`;
    link.download = 'cuentas_globalflame.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('Excel generado', 'Descargando cuentas_globalflame.xlsx', 'success');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet);

      const res = await fetch('/api/admin/excel/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': adminUser.id,
        },
        body: JSON.stringify({ rows }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        importedCount?: number;
        users?: User[];
        error?: string;
      };
      if (!data.ok || !data.users) {
        onNotify('Error al importar Excel', data.error, 'error');
        return;
      }
      setAccounts(data.users);
      onNotify(
        'Excel sincronizado',
        `${data.importedCount ?? 0} cuentas procesadas estilo AppSheet.`,
        'success'
      );
    } catch {
      onNotify('Archivo inválido', 'Selecciona un archivo .xlsx o .csv válido.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // Games CRUD Handlers
  // ==========================================
  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingGameId
      ? `/api/admin/games/${encodeURIComponent(editingGameId)}`
      : '/api/admin/games';
    const method = editingGameId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': adminUser.id,
      },
      body: JSON.stringify(gameForm),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      onNotify('Error guardando oferta', data.error, 'error');
      return;
    }
    await onRefreshBootstrap();
    setEditingGameId(null);
    setGameForm({
      title: '',
      developer: '',
      genre: 'Acción',
      platforms: ['PC'],
      bestStore: 'Steam Colombia',
      originalPriceCop: 159900,
      finalPriceCop: 79900,
      synopsis: '',
      isFeatured: true,
    });
    onNotify(
      editingGameId ? 'Juego actualizado' : 'Juego agregado al catálogo',
      'Los cambios ya son visibles en Inicio y Ofertas.',
      'success'
    );
  };

  const handleDeleteGame = async (gameId: string) => {
    const res = await fetch(`/api/admin/games/${encodeURIComponent(gameId)}`, {
      method: 'DELETE',
      headers: { 'x-user-id': adminUser.id },
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      onNotify('No se pudo eliminar', data.error, 'error');
      return;
    }
    await onRefreshBootstrap();
    onNotify('Oferta eliminada', 'El videojuego fue retirado del catálogo.', 'info');
  };

  // ==========================================
  // News CRUD Handlers
  // ==========================================
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingNewsId
      ? `/api/admin/news/${encodeURIComponent(editingNewsId)}`
      : '/api/admin/news';
    const method = editingNewsId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': adminUser.id,
      },
      body: JSON.stringify(newsForm),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      onNotify('Error guardando novedad', data.error, 'error');
      return;
    }
    await onRefreshBootstrap();
    setEditingNewsId(null);
    setNewsForm({
      title: '',
      category: 'Noticias',
      author: adminUser.name,
      summary: '',
      content: '',
    });
    onNotify(
      editingNewsId ? 'Novedad actualizada' : 'Novedad publicada',
      'Ya aparece en la página de Novedades.',
      'success'
    );
  };

  const handleDeleteNews = async (newsId: string) => {
    const res = await fetch(`/api/admin/news/${encodeURIComponent(newsId)}`, {
      method: 'DELETE',
      headers: { 'x-user-id': adminUser.id },
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      onNotify('Error eliminando novedad', data.error, 'error');
      return;
    }
    await onRefreshBootstrap();
    onNotify('Novedad eliminada', 'Nota retirada del portal.', 'info');
  };

  return (
    <section className="rounded-2xl border border-[#EA580C]/40 bg-[#1D1511] p-6 space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#33251D] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
            <Database className="h-4 w-4" />
            <span>Panel de Administrador · Base de Datos &amp; Excel AppSheet</span>
          </div>
          <h2 className="font-display mt-1 text-2xl font-bold text-[#FAF5F0]">
            Gestión Central de Global Flame
          </h2>
          <p className="mt-1 text-sm text-[#A89789]">
            Administra cuentas y contraseñas en hoja Excel sincronizada, y edita o agrega juegos y
            novedades en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'accounts'
                ? 'border-[#F59E0B] bg-[#EA580C] text-white'
                : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Cuentas (Excel / AppSheet)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('games')}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'games'
                ? 'border-[#F59E0B] bg-[#EA580C] text-white'
                : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:text-white'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            Ofertas y Juegos ({games.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'news'
                ? 'border-[#F59E0B] bg-[#EA580C] text-white'
                : 'border-[#33251D] bg-[#150F0B] text-[#D6C7BA] hover:text-white'
            }`}
          >
            <Newspaper className="h-4 w-4" />
            Novedades ({news.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ACCOUNTS APPSHEET / EXCEL */}
      {activeTab === 'accounts' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C2410C] transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar Excel (.xlsx)
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#33251D] bg-[#150F0B] px-4 py-2 text-xs font-semibold text-[#F59E0B] hover:border-[#F59E0B] transition-colors"
              >
                <Upload className="h-4 w-4" />
                Importar Excel (.xlsx / .csv)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords((p) => !p)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D6C7BA] hover:text-white self-start sm:self-auto"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPasswords ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            </button>
          </div>

          {/* AppSheet-style inline create row */}
          <form
            onSubmit={handleCreateAccount}
            className="grid grid-cols-1 gap-3 rounded-xl border border-[#33251D] bg-[#150F0B] p-4 sm:grid-cols-5"
          >
            <input
              type="text"
              required
              placeholder="Nombre completo"
              value={newAcc.name}
              onChange={(e) => setNewAcc((p) => ({ ...p, name: e.target.value }))}
              className="h-9 rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white placeholder-[#A89789] focus:border-[#F59E0B] focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="correo@dominio.co"
              value={newAcc.email}
              onChange={(e) => setNewAcc((p) => ({ ...p, email: e.target.value }))}
              className="h-9 rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white placeholder-[#A89789] focus:border-[#F59E0B] focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder="Contraseña"
              value={newAcc.passwordHash}
              onChange={(e) => setNewAcc((p) => ({ ...p, passwordHash: e.target.value }))}
              className="h-9 rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white placeholder-[#A89789] focus:border-[#F59E0B] focus:outline-none"
            />
            <select
              value={newAcc.role}
              onChange={(e) => setNewAcc((p) => ({ ...p, role: e.target.value as UserRole }))}
              className="h-9 rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
            >
              <option value="usuario">Rol: Usuario</option>
              <option value="administrador">Rol: Administrador</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#EA580C] px-3 text-xs font-semibold text-white hover:bg-[#C2410C]"
            >
              <Plus className="h-4 w-4" />
              Agregar fila
            </button>
          </form>

          {/* AppSheet Spreadsheet Table */}
          <div className="overflow-x-auto rounded-xl border border-[#33251D] bg-[#150F0B]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#33251D] bg-[#1A120E] text-[11px] uppercase text-[#A89789]">
                  <th className="py-3 px-3 font-semibold">Nombre</th>
                  <th className="py-3 px-3 font-semibold">Correo</th>
                  <th className="py-3 px-3 font-semibold">Contraseña</th>
                  <th className="py-3 px-3 font-semibold">Rol</th>
                  <th className="py-3 px-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#33251D]">
                {loadingAccounts ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#A89789]">
                      Cargando tabla de cuentas...
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => {
                    const isEditing = editingAccountId === acc.id;
                    return (
                      <tr key={acc.id} className="hover:bg-[#1D1511]/80">
                        <td className="py-2.5 px-3 text-white font-medium">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDraft.name ?? acc.name}
                              onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                              className="h-8 w-full rounded border border-[#F59E0B] bg-[#120D0A] px-2 text-xs text-white"
                            />
                          ) : (
                            acc.name
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[#D6C7BA]">
                          {isEditing ? (
                            <input
                              type="email"
                              value={editDraft.email ?? acc.email}
                              onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                              className="h-8 w-full rounded border border-[#F59E0B] bg-[#120D0A] px-2 text-xs text-white"
                            />
                          ) : (
                            acc.email
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-[#F59E0B]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDraft.passwordHash ?? acc.passwordHash}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, passwordHash: e.target.value }))
                              }
                              className="h-8 w-full rounded border border-[#F59E0B] bg-[#120D0A] px-2 text-xs text-white"
                            />
                          ) : showPasswords ? (
                            acc.passwordHash
                          ) : (
                            '••••••••'
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <select
                              value={editDraft.role ?? acc.role}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, role: e.target.value as UserRole }))
                              }
                              className="h-8 rounded border border-[#F59E0B] bg-[#120D0A] px-2 text-xs text-white"
                            >
                              <option value="usuario">usuario</option>
                              <option value="administrador">administrador</option>
                            </select>
                          ) : (
                            <span
                              className={`font-semibold ${
                                acc.role === 'administrador' ? 'text-[#F59E0B]' : 'text-[#D6C7BA]'
                              }`}
                            >
                              {acc.role === 'administrador' ? 'Administrador' : 'Usuario'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => handleSaveAccountEdit(acc.id)}
                                className="inline-flex items-center gap-1 rounded bg-[#EA580C] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#C2410C]"
                              >
                                <Save className="h-3.5 w-3.5" />
                                Guardar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAccountId(acc.id);
                                  setEditDraft({
                                    name: acc.name,
                                    email: acc.email,
                                    passwordHash: acc.passwordHash,
                                    role: acc.role,
                                  });
                                }}
                                className="rounded p-1.5 text-[#D6C7BA] hover:bg-[#33251D] hover:text-white"
                                aria-label={`Editar ${acc.name}`}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {acc.id !== adminUser.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(acc.id)}
                                className="rounded p-1.5 text-rose-400 hover:bg-rose-500/15"
                                aria-label={`Eliminar ${acc.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GAMES & OFFERS EDITOR */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-white">
              {editingGameId ? 'Editando videojuego / oferta' : 'Agregar nuevo videojuego u oferta'}
            </h3>
            <button
              type="button"
              onClick={onSyncCheapShark}
              className="inline-flex items-center gap-2 rounded-xl border border-[#33251D] bg-[#150F0B] px-3.5 py-2 text-xs font-semibold text-[#F59E0B] hover:border-[#F59E0B]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sincronizar CheapShark API ahora
            </button>
          </div>

          <form
            onSubmit={handleSaveGame}
            className="grid grid-cols-1 gap-4 rounded-xl border border-[#33251D] bg-[#150F0B] p-4 sm:grid-cols-2"
          >
            <div>
              <label className="block text-xs text-[#A89789]">Título del videojuego</label>
              <input
                type="text"
                required
                value={gameForm.title}
                onChange={(e) => setGameForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej. Sekiro: Shadows Die Twice"
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A89789]">Tienda oficial</label>
              <input
                type="text"
                required
                value={gameForm.bestStore}
                onChange={(e) => setGameForm((f) => ({ ...f, bestStore: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A89789]">Precio Original (COP)</label>
              <input
                type="number"
                min={0}
                required
                value={gameForm.originalPriceCop}
                onChange={(e) =>
                  setGameForm((f) => ({ ...f, originalPriceCop: Number(e.target.value) }))
                }
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A89789]">Precio Oferta Final (COP)</label>
              <input
                type="number"
                min={0}
                required
                value={gameForm.finalPriceCop}
                onChange={(e) =>
                  setGameForm((f) => ({ ...f, finalPriceCop: Number(e.target.value) }))
                }
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A89789]">Género</label>
              <select
                value={gameForm.genre}
                onChange={(e) => setGameForm((f) => ({ ...f, genre: e.target.value as Genre }))}
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white"
              >
                {ALL_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#A89789]">Desarrollador</label>
              <input
                type="text"
                value={gameForm.developer}
                onChange={(e) => setGameForm((f) => ({ ...f, developer: e.target.value }))}
                placeholder="Ej. FromSoftware"
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <span className="block text-xs text-[#A89789]">Plataformas</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {ALL_PLATFORMS.map((plat) => {
                  const active = gameForm.platforms.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() =>
                        setGameForm((f) => ({
                          ...f,
                          platforms: active
                            ? f.platforms.length > 1
                              ? f.platforms.filter((p) => p !== plat)
                              : f.platforms
                            : [...f.platforms, plat],
                        }))
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs ${
                        active
                          ? 'border-[#F59E0B] bg-[#EA580C]/25 text-[#F59E0B]'
                          : 'border-[#33251D] bg-[#1D1511] text-[#A89789]'
                      }`}
                    >
                      {plat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A89789]">Sinopsis</label>
              <textarea
                rows={2}
                value={gameForm.synopsis}
                onChange={(e) => setGameForm((f) => ({ ...f, synopsis: e.target.value }))}
                placeholder="Descripción de la oferta y del juego..."
                className="mt-1 w-full rounded-lg border border-[#33251D] bg-[#1D1511] p-2.5 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-[#D6C7BA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={gameForm.isFeatured}
                  onChange={(e) => setGameForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  className="accent-[#EA580C]"
                />
                Mostrar en Ofertas Destacadas (Inicio)
              </label>

              <div className="flex items-center gap-2">
                {editingGameId && (
                  <button
                    type="button"
                    onClick={() => setEditingGameId(null)}
                    className="rounded-lg border border-[#33251D] px-3 py-2 text-xs text-[#D6C7BA]"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C2410C]"
                >
                  <Save className="h-3.5 w-3.5" />
                  {editingGameId ? 'Guardar cambios' : 'Publicar oferta'}
                </button>
              </div>
            </div>
          </form>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#33251D] rounded-xl border border-[#33251D] bg-[#150F0B]">
            {games.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{g.title}</p>
                  <p className="font-mono-num text-[#A89789]">
                    {formatCOP(g.finalPriceCop)} ({g.discountPercent > 0 ? `-${g.discountPercent}%` : 'Estándar'}) · {g.bestStore}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGameId(g.id);
                      setGameForm({
                        title: g.title,
                        developer: g.developer,
                        genre: g.genre,
                        platforms: g.platforms,
                        bestStore: g.bestStore,
                        originalPriceCop: g.originalPriceCop,
                        finalPriceCop: g.finalPriceCop,
                        synopsis: g.synopsis,
                        isFeatured: g.isFeatured,
                      });
                    }}
                    className="rounded p-1.5 text-[#D6C7BA] hover:bg-[#33251D] hover:text-white"
                    aria-label={`Editar ${g.title}`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGame(g.id)}
                    className="rounded p-1.5 text-rose-400 hover:bg-rose-500/15"
                    aria-label={`Eliminar ${g.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NEWS / NOVEDADES EDITOR */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <h3 className="font-display text-lg font-bold text-white">
            {editingNewsId ? 'Editando novedad' : 'Agregar nueva noticia o lanzamiento'}
          </h3>

          <form
            onSubmit={handleSaveNews}
            className="grid grid-cols-1 gap-4 rounded-xl border border-[#33251D] bg-[#150F0B] p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A89789]">Titular</label>
              <input
                type="text"
                required
                value={newsForm.title}
                onChange={(e) => setNewsForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej. Festival de ofertas de otoño llega a Steam y Epic Colombia"
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A89789]">Categoría</label>
              <select
                value={newsForm.category}
                onChange={(e) =>
                  setNewsForm((f) => ({ ...f, category: e.target.value as NewsCategory }))
                }
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white"
              >
                <option value="Noticias">Noticias</option>
                <option value="Lanzamientos">Lanzamientos</option>
                <option value="Eventos">Eventos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#A89789]">Autor</label>
              <input
                type="text"
                value={newsForm.author}
                onChange={(e) => setNewsForm((f) => ({ ...f, author: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A89789]">Resumen</label>
              <textarea
                rows={2}
                required
                value={newsForm.summary}
                onChange={(e) => setNewsForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="Resumen breve visible en la tarjeta..."
                className="mt-1 w-full rounded-lg border border-[#33251D] bg-[#1D1511] p-2.5 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A89789]">Contenido completo</label>
              <textarea
                rows={3}
                value={newsForm.content}
                onChange={(e) => setNewsForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Texto completo del artículo..."
                className="mt-1 w-full rounded-lg border border-[#33251D] bg-[#1D1511] p-2.5 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2">
              {editingNewsId && (
                <button
                  type="button"
                  onClick={() => setEditingNewsId(null)}
                  className="rounded-lg border border-[#33251D] px-3 py-2 text-xs text-[#D6C7BA]"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C2410C]"
              >
                <Save className="h-3.5 w-3.5" />
                {editingNewsId ? 'Actualizar novedad' : 'Publicar novedad'}
              </button>
            </div>
          </form>

          <div className="max-h-64 overflow-y-auto divide-y divide-[#33251D] rounded-xl border border-[#33251D] bg-[#150F0B]">
            {news.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{item.title}</p>
                  <p className="text-[#A89789]">
                    {item.category} · {item.author}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNewsId(item.id);
                      setNewsForm({
                        title: item.title,
                        category: item.category,
                        author: item.author,
                        summary: item.summary,
                        content: item.content,
                      });
                    }}
                    className="rounded p-1.5 text-[#D6C7BA] hover:bg-[#33251D] hover:text-white"
                    aria-label={`Editar ${item.title}`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteNews(item.id)}
                    className="rounded p-1.5 text-rose-400 hover:bg-rose-500/15"
                    aria-label={`Eliminar ${item.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
