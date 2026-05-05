/**
 * RemindFlow — services/db.js v4.3.0
 *
 * Singleton de conexión SQLite usando better-sqlite3.
 * Se abre una sola vez al iniciar el servidor y se reutiliza
 * en toda la aplicación a través de data/store.js.
 *
 * Configuración:
 *   DB_PATH en .env — ruta al archivo .db (default: ./data/remindflow.db)
 *
 * Railway: apuntar el Volume a /app/data para persistencia entre deploys.
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// Ruta al archivo SQLite — configurable por variable de entorno
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'remindflow.db');

// Asegurar que el directorio existe antes de abrir
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db = null;

function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH, {
    // verbose: process.env.NODE_ENV === 'development' ? console.log : null,
  });

  // WAL mode: mejor rendimiento en lecturas concurrentes, más seguro ante crashes
  _db.pragma('journal_mode = WAL');
  // Forzar integridad referencial (SQLite la ignora por defecto)
  _db.pragma('foreign_keys = ON');

  console.log(`[DB] SQLite conectado: ${DB_PATH}`);
  return _db;
}

function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
    console.log('[DB] SQLite cerrado');
  }
}

// Cerrar limpiamente al terminar el proceso
process.on('exit',    closeDb);
process.on('SIGINT',  () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });

module.exports = { getDb, closeDb };
