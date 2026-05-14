/**
 * RemindFlow — Store v4.3.0
 *
 * Capa de acceso a datos — SQLite con better-sqlite3.
 * Reemplaza el almacén en memoria de v4.2.0.
 *
 * API pública IDÉNTICA a v4.2.0 — ninguna ruta requiere cambios.
 *
 * Convenciones internas:
 *   - camelCase en JS  ↔  snake_case en SQL
 *   - booleanos: JS true/false  ↔  SQLite 1/0
 *   - arrays/objetos: JSON.stringify al escribir, JSON.parse al leer
 *   - UUIDs: generados en JS con crypto.randomUUID()
 */

const { randomUUID } = require('crypto');
const { getDb }      = require('./services/db');

function uid() { return randomUUID(); }
function now() { return new Date().toISOString(); }

// ── Helpers de mapeo SQL → JS ────────────────────────────────

function mapClient(row) {
  if (!row) return null;
  return {
    id: row.id, name: row.name, email: row.email, notes: row.notes,
    waPhone: row.wa_phone, waAccount: row.wa_account, waNotes: row.wa_notes,
    igAccount: row.ig_account, igLink: row.ig_link, igPhone: row.ig_phone, igNotes: row.ig_notes,
    fbAccount: row.fb_account, fbLink: row.fb_link, fbPhone: row.fb_phone, fbNotes: row.fb_notes,
    ttAccount: row.tt_account, ttLink: row.tt_link, ttPhone: row.tt_phone, ttNotes: row.tt_notes,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id, clientId: row.client_id, type: row.type,
    contentType: row.content_type, contentName: row.content_name,
    platform: row.platform, due: row.due, status: row.status,
    createdAt: row.created_at,
  };
}

function mapHistory(row) {
  if (!row) return null;
  return {
    id: row.id, channel: row.channel, clientId: row.client_id,
    clientName: row.client_name, to: row.to_address,
    subject: row.subject, preview: row.preview,
    contentType: row.content_type, contentName: row.content_name,
    platform: row.platform, contenidoId: row.contenido_id,
    messageId: row.message_id, sid: row.sid, status: row.status,
    replied: row.replied === 1, repliedAt: row.replied_at,
    replyContent: row.reply_content, replyChannel: row.reply_channel,
    createdAt: row.created_at,
  };
}

function mapScheduled(row) {
  if (!row) return null;
  return {
    id: row.id, channel: row.channel, clientId: row.client_id,
    clientName: row.client_name, to: row.to_address,
    subject: row.subject, body: row.body,
    scheduledAt: row.scheduled_at,
    recurrence: row.recurrence ? JSON.parse(row.recurrence) : null,
    contentType: row.content_type, contentName: row.content_name,
    platform: row.platform, contenidoId: row.contenido_id,
    status: row.status, sentAt: row.sent_at, createdAt: row.created_at,
    retryCount:  row.retry_count  || 0,
    lastError:   row.last_error   || null,
    nextRetryAt: row.next_retry_at || null,
  };
}

function mapAcuerdo(row) {
  if (!row) return null;
  return {
    id: row.id, clientId: row.client_id, platform: row.platform,
    daily: row.daily, weekly: row.weekly, monthly: row.monthly,
    contentTypes: row.content_types, startDate: row.start_date,
    endDate: row.end_date, notes: row.notes,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapContenido(row) {
  if (!row) return null;
  return {
    id: row.id, clientId: row.client_id, name: row.name,
    type: row.type, platform: row.platform, status: row.status,
    due: row.due, description: row.description, reply: row.reply,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapPropuesta(row) {
  if (!row) return null;
  return {
    id: row.id, clientId: row.client_id, plan: row.plan,
    monthlyValue: row.monthly_value, currency: row.currency,
    contractMonths: row.contract_months,
    contentQtyDaily: row.content_qty_daily,
    contentQtyWeekly: row.content_qty_weekly,
    contentQtyMonthly: row.content_qty_monthly,
    platforms: row.platforms ? JSON.parse(row.platforms) : [],
    contentTypes: row.content_types ? JSON.parse(row.content_types) : [],
    status: row.status,
    sentDate: row.sent_date, reviewDate: row.review_date,
    approvalDate: row.approval_date, startDate: row.start_date,
    additionalConditions: row.additional_conditions,
    comments: row.comments, internalNotes: row.internal_notes,
    preparedBy: row.prepared_by,
    importedFromExcel: row.imported_from_excel === 1,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapAudit(row) {
  if (!row) return null;
  return {
    id: row.id, timestamp: row.timestamp, entity: row.entity,
    entityId: row.entity_id, clientId: row.client_id,
    action: row.action, detail: row.detail,
    channel: row.channel, contentType: row.content_type,
    contentName: row.content_name, user: row.user,
  };
}

function mapRespuesta(row) {
  if (!row) return null;
  return {
    id: row.id, clientId: row.client_id, messageId: row.message_id,
    contenidoId: row.contenido_id, acuerdoId: row.acuerdo_id,
    channel: row.channel, receivedAt: row.received_at,
    content: row.content, senderPhone: row.sender_phone,
    senderEmail: row.sender_email,
    autoCapture: row.auto_capture === 1,
    raw: row.raw, createdAt: row.created_at,
  };
}

function mapMaterial(row) {
  if (!row) return null;
  return {
    id: row.id, clientId: row.client_id, contenidoId: row.contenido_id,
    acuerdoId: row.acuerdo_id, filename: row.filename,
    originalName: row.original_name, mimetype: row.mimetype,
    size: row.size, path: row.path, uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by, notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapPublicacion(row) {
  if (!row) return null;
  return {
    id: row.id, clientId: row.client_id, contenidoId: row.contenido_id,
    contentType: row.content_type, platform: row.platform,
    publishedAt: row.published_at, url: row.url,
    caption: row.caption, notes: row.notes,
    tags: row.tags ? JSON.parse(row.tags) : [],
    igMediaId: row.ig_media_id, source: row.source,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// ── CLIENTES ─────────────────────────────────────────────────

const getClients = () =>
  getDb().prepare('SELECT * FROM clients ORDER BY name ASC').all().map(mapClient);

const getClient = (id) =>
  mapClient(getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id));

const createClient = (data) => {
  const db = getDb();
  const id = uid(); const ts = now();
  db.prepare(`
    INSERT INTO clients
      (id,name,email,notes,wa_phone,wa_account,wa_notes,ig_account,ig_link,ig_phone,ig_notes,
       fb_account,fb_link,fb_phone,fb_notes,tt_account,tt_link,tt_phone,tt_notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.name, data.email, data.notes||null,
    data.waPhone||null, data.waAccount||null, data.waNotes||null,
    data.igAccount||null, data.igLink||null, data.igPhone||null, data.igNotes||null,
    data.fbAccount||null, data.fbLink||null, data.fbPhone||null, data.fbNotes||null,
    data.ttAccount||null, data.ttLink||null, data.ttPhone||null, data.ttNotes||null,
    ts, ts
  );
  addAudit({ entity:'client', entityId:id, action:'created', detail:`Cliente creado: ${data.name}` });
  return getClient(id);
};

const updateClient = (id, data) => {
  const db = getDb();
  const fields = [
    'name','email','notes',
    'wa_phone','wa_account','wa_notes',
    'ig_account','ig_link','ig_phone','ig_notes',
    'fb_account','fb_link','fb_phone','fb_notes',
    'tt_account','tt_link','tt_phone','tt_notes',
  ];
  const keyMap = {
    name:'name',email:'email',notes:'notes',
    waPhone:'wa_phone',waAccount:'wa_account',waNotes:'wa_notes',
    igAccount:'ig_account',igLink:'ig_link',igPhone:'ig_phone',igNotes:'ig_notes',
    fbAccount:'fb_account',fbLink:'fb_link',fbPhone:'fb_phone',fbNotes:'fb_notes',
    ttAccount:'tt_account',ttLink:'tt_link',ttPhone:'tt_phone',ttNotes:'tt_notes',
  };
  const sets = []; const vals = [];
  for (const [k,v] of Object.entries(data)) {
    if (keyMap[k]) { sets.push(`${keyMap[k]} = ?`); vals.push(v); }
  }
  if (!sets.length) return getClient(id);
  sets.push('updated_at = ?'); vals.push(now()); vals.push(id);
  db.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const c = getClient(id);
  if (c) addAudit({ entity:'client', entityId:id, action:'updated', detail:`Cliente actualizado: ${c.name}` });
  return c;
};

const deleteClient = (id) => {
  const c = getClient(id);
  const result = getDb().prepare('DELETE FROM clients WHERE id = ?').run(id);
  if (result.changes > 0) addAudit({ entity:'client', entityId:id, action:'deleted', detail:`Cliente eliminado: ${c?.name}` });
  return result.changes > 0;
};

// ── TAREAS ───────────────────────────────────────────────────

const getTasks = () =>
  getDb().prepare('SELECT * FROM tasks ORDER BY due ASC').all().map(mapTask);

const getTask = (id) =>
  mapTask(getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id));

const createTask = (data) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO tasks (id,client_id,type,content_type,content_name,platform,due,status,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, data.clientId, data.type, data.contentType||null, data.contentName||null,
         data.platform||null, data.due, 'pending', ts);
  addAudit({ entity:'task', entityId:id, clientId:data.clientId, action:'created',
    detail:`Tarea creada: ${data.type} — ${data.contentName||''}` });
  return getTask(id);
};

const updateTask = (id, data) => {
  const prev = getTask(id);
  if (!prev) return null;
  const sets = []; const vals = [];
  if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }
  if (data.due    !== undefined) { sets.push('due = ?');    vals.push(data.due); }
  if (!sets.length) return prev;
  vals.push(id);
  getDb().prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const t = getTask(id);
  if (data.status && data.status !== prev.status) {
    addAudit({ entity:'task', entityId:id, clientId:t.clientId, action:'status_change',
      detail:`Tarea: ${t.type} — estado: ${prev.status} → ${data.status}` });
  }
  return t;
};

const deleteTask = (id) => {
  const result = getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
};

// ── HISTORIAL ────────────────────────────────────────────────

const getHistory = () =>
  getDb().prepare('SELECT * FROM history ORDER BY created_at DESC').all().map(mapHistory);

const addHistory = (entry) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO history
      (id,channel,client_id,client_name,to_address,subject,preview,content_type,content_name,
       platform,contenido_id,message_id,sid,status,replied,replied_at,reply_content,reply_channel,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, entry.channel, entry.clientId||null, entry.clientName||null,
    entry.to, entry.subject||null, entry.preview||null,
    entry.contentType||null, entry.contentName||null,
    entry.platform||null, entry.contenidoId||null,
    entry.messageId||null, entry.sid||null, entry.status||'sent',
    0, null, null, null, ts
  );
  addAudit({
    entity:'message', entityId:id, clientId:entry.clientId, action:'sent',
    detail:`Mensaje enviado por ${entry.channel} a ${entry.clientName||entry.to}: "${(entry.subject||entry.preview||'').substring(0,60)}"`,
    channel:entry.channel, contentType:entry.contentType, contentName:entry.contentName,
  });
  return mapHistory(getDb().prepare('SELECT * FROM history WHERE id = ?').get(id));
};

const updateHistory = (id, data) => {
  const sets = []; const vals = [];
  if (data.replied      !== undefined) { sets.push('replied = ?');       vals.push(data.replied ? 1 : 0); }
  if (data.repliedAt    !== undefined) { sets.push('replied_at = ?');    vals.push(data.repliedAt); }
  if (data.replyContent !== undefined) { sets.push('reply_content = ?'); vals.push(data.replyContent); }
  if (data.replyChannel !== undefined) { sets.push('reply_channel = ?'); vals.push(data.replyChannel); }
  if (!sets.length) return mapHistory(getDb().prepare('SELECT * FROM history WHERE id = ?').get(id));
  vals.push(id);
  getDb().prepare(`UPDATE history SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const h = mapHistory(getDb().prepare('SELECT * FROM history WHERE id = ?').get(id));
  if (data.replied) {
    addAudit({
      entity:'message', entityId:id, clientId:h.clientId, action:'reply_received',
      detail:`Respuesta del cliente registrada vía ${data.replyChannel||'manual'}: "${(data.replyContent||'').substring(0,80)}"`,
      channel:data.replyChannel,
    });
  }
  return h;
};

// ── MENSAJES PROGRAMADOS ─────────────────────────────────────

const getScheduledMessages = () =>
  getDb().prepare('SELECT * FROM scheduled ORDER BY scheduled_at ASC').all().map(mapScheduled);

const addScheduledMessage = (data) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO scheduled
      (id,channel,client_id,client_name,to_address,subject,body,scheduled_at,
       recurrence,content_type,content_name,platform,contenido_id,status,sent_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.channel, data.clientId||null, data.clientName||null,
    data.to, data.subject||null, data.body,
    data.scheduledAt, data.recurrence ? JSON.stringify(data.recurrence) : null,
    data.contentType||null, data.contentName||null,
    data.platform||null, data.contenidoId||null, 'scheduled', null, ts
  );
  addAudit({
    entity:'scheduled', entityId:id, clientId:data.clientId, action:'scheduled',
    detail:`Envío programado (${data.channel}) para ${data.scheduledAt}${data.recurrence ? ' · '+JSON.stringify(data.recurrence) : ''}`,
  });
  return mapScheduled(getDb().prepare('SELECT * FROM scheduled WHERE id = ?').get(id));
};

const updateScheduledMessage = (id, data) => {
  const sets = []; const vals = [];
  if (data.status  !== undefined) { sets.push('status = ?');   vals.push(data.status); }
  if (data.sentAt  !== undefined) { sets.push('sent_at = ?');  vals.push(data.sentAt); }
  if (data.lastError   !== undefined) { sets.push('last_error = ?');    vals.push(data.lastError); }
  if (data.retryCount  !== undefined) { sets.push('retry_count = ?');   vals.push(data.retryCount); }
  if (data.nextRetryAt !== undefined) { sets.push('next_retry_at = ?'); vals.push(data.nextRetryAt); }
  if (!sets.length) return mapScheduled(getDb().prepare('SELECT * FROM scheduled WHERE id = ?').get(id));
  vals.push(id);
  getDb().prepare(`UPDATE scheduled SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const m = mapScheduled(getDb().prepare('SELECT * FROM scheduled WHERE id = ?').get(id));
  if (data.status === 'sent')      addAudit({ entity:'scheduled', entityId:id, clientId:m.clientId, action:'sent',      detail:`Envío programado ejecutado: ${m.channel}` });
  if (data.status === 'cancelled') addAudit({ entity:'scheduled', entityId:id, clientId:m.clientId, action:'cancelled', detail:`Envío programado cancelado` });
  return m;
};

const deleteScheduledMessage = (id) => {
  const result = getDb().prepare('DELETE FROM scheduled WHERE id = ?').run(id);
  return result.changes > 0;
};

// ── ACUERDOS ─────────────────────────────────────────────────

const getAcuerdos = (clientId) => {
  const rows = clientId
    ? getDb().prepare('SELECT * FROM acuerdos WHERE client_id = ? ORDER BY created_at DESC').all(clientId)
    : getDb().prepare('SELECT * FROM acuerdos ORDER BY created_at DESC').all();
  return rows.map(mapAcuerdo);
};

const getAcuerdo = (id) =>
  mapAcuerdo(getDb().prepare('SELECT * FROM acuerdos WHERE id = ?').get(id));

const createAcuerdo = (data) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO acuerdos
      (id,client_id,platform,daily,weekly,monthly,content_types,start_date,end_date,notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.clientId, data.platform,
    data.daily||0, data.weekly||0, data.monthly||0,
    data.contentTypes||null, data.startDate||null, data.endDate||null,
    data.notes||null, ts, ts
  );
  const c = getClient(data.clientId);
  addAudit({ entity:'acuerdo', entityId:id, clientId:data.clientId, action:'created',
    detail:`Acuerdo creado para ${c?.name}: ${data.platform} · ${data.monthly} piezas/mes` });
  return getAcuerdo(id);
};

const updateAcuerdo = (id, data) => {
  const keyMap = { platform:'platform', daily:'daily', weekly:'weekly', monthly:'monthly',
    contentTypes:'content_types', startDate:'start_date', endDate:'end_date', notes:'notes' };
  const sets = []; const vals = [];
  for (const [k,v] of Object.entries(data)) {
    if (keyMap[k]) { sets.push(`${keyMap[k]} = ?`); vals.push(v); }
  }
  if (!sets.length) return getAcuerdo(id);
  sets.push('updated_at = ?'); vals.push(now()); vals.push(id);
  getDb().prepare(`UPDATE acuerdos SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return getAcuerdo(id);
};

const deleteAcuerdo = (id) => {
  const result = getDb().prepare('DELETE FROM acuerdos WHERE id = ?').run(id);
  return result.changes > 0;
};

// ── CONTENIDO ────────────────────────────────────────────────

const getContenido = (clientId) => {
  const rows = clientId
    ? getDb().prepare('SELECT * FROM contenido WHERE client_id = ? ORDER BY created_at DESC').all(clientId)
    : getDb().prepare('SELECT * FROM contenido ORDER BY created_at DESC').all();
  return rows.map(mapContenido);
};

const getContenidoItem = (id) =>
  mapContenido(getDb().prepare('SELECT * FROM contenido WHERE id = ?').get(id));

const createContenido = (data) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO contenido (id,client_id,name,type,platform,status,due,description,reply,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.clientId, data.name, data.type,
    data.platform||null, data.status||'agreed',
    data.due||null, data.description||null, data.reply||null, ts, ts
  );
  const cl = getClient(data.clientId);
  addAudit({ entity:'contenido', entityId:id, clientId:data.clientId, action:'created',
    detail:`Pieza creada: "${data.name}" (${data.type}) para ${cl?.name}` });
  return getContenidoItem(id);
};

const updateContenido = (id, data) => {
  const prev = getContenidoItem(id);
  if (!prev) return null;
  const keyMap = { name:'name', type:'type', platform:'platform', status:'status',
    due:'due', description:'description', reply:'reply' };
  const sets = []; const vals = [];
  for (const [k,v] of Object.entries(data)) {
    if (keyMap[k]) { sets.push(`${keyMap[k]} = ?`); vals.push(v); }
  }
  if (!sets.length) return prev;
  sets.push('updated_at = ?'); vals.push(now()); vals.push(id);
  getDb().prepare(`UPDATE contenido SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const c = getContenidoItem(id);
  if (data.status && data.status !== prev.status) {
    addAudit({ entity:'contenido', entityId:id, clientId:c.clientId, action:'status_change',
      detail:`"${c.name}": ${prev.status} → ${data.status}` });
  }
  return c;
};

const deleteContenido = (id) => {
  const result = getDb().prepare('DELETE FROM contenido WHERE id = ?').run(id);
  return result.changes > 0;
};

// ── PROPUESTAS ───────────────────────────────────────────────

const getPropuestas = (clientId) => {
  const rows = clientId
    ? getDb().prepare('SELECT * FROM propuestas WHERE client_id = ? ORDER BY created_at DESC').all(clientId)
    : getDb().prepare('SELECT * FROM propuestas ORDER BY created_at DESC').all();
  return rows.map(mapPropuesta);
};

const getPropuesta = (id) =>
  mapPropuesta(getDb().prepare('SELECT * FROM propuestas WHERE id = ?').get(id));

const createPropuesta = (data) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO propuestas
      (id,client_id,plan,monthly_value,currency,contract_months,
       content_qty_daily,content_qty_weekly,content_qty_monthly,
       platforms,content_types,status,sent_date,review_date,approval_date,
       start_date,additional_conditions,comments,internal_notes,
       prepared_by,imported_from_excel,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.clientId, data.plan||null,
    data.monthlyValue||0, data.currency||'CLP', data.contractMonths||3,
    data.contentQtyDaily||0, data.contentQtyWeekly||0, data.contentQtyMonthly||0,
    data.platforms ? JSON.stringify(data.platforms) : null,
    data.contentTypes ? JSON.stringify(data.contentTypes) : null,
    'draft', null, null, null, null, null, null, null, null, 0, ts, ts
  );
  const c = getClient(data.clientId);
  addAudit({ entity:'propuesta', entityId:id, clientId:data.clientId, action:'created',
    detail:`Propuesta creada para ${c?.name}: $${data.monthlyValue} CLP/mes` });
  return getPropuesta(id);
};

const updatePropuesta = (id, data) => {
  const prev = getPropuesta(id);
  if (!prev) return null;
  const keyMap = {
    plan:'plan', monthlyValue:'monthly_value', currency:'currency',
    contractMonths:'contract_months',
    contentQtyDaily:'content_qty_daily', contentQtyWeekly:'content_qty_weekly',
    contentQtyMonthly:'content_qty_monthly',
    status:'status', sentDate:'sent_date', reviewDate:'review_date',
    approvalDate:'approval_date', startDate:'start_date',
    additionalConditions:'additional_conditions', comments:'comments',
    internalNotes:'internal_notes', preparedBy:'prepared_by',
    importedFromExcel:'imported_from_excel',
  };
  const jsonFields = new Set(['platforms','contentTypes']);
  const boolFields = new Set(['importedFromExcel']);
  const sets = []; const vals = [];
  for (const [k,v] of Object.entries(data)) {
    if (keyMap[k]) {
      sets.push(`${keyMap[k]} = ?`);
      if (jsonFields.has(k)) vals.push(JSON.stringify(v));
      else if (boolFields.has(k)) vals.push(v ? 1 : 0);
      else vals.push(v);
    }
  }
  if (!sets.length) return prev;
  sets.push('updated_at = ?'); vals.push(now()); vals.push(id);
  getDb().prepare(`UPDATE propuestas SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const p = getPropuesta(id);
  if (data.status && data.status !== prev.status) {
    addAudit({ entity:'propuesta', entityId:id, clientId:p.clientId, action:'status_change',
      detail:`Propuesta: ${prev.status} → ${data.status}` });
  }
  return p;
};

const deletePropuesta = (id) => {
  const result = getDb().prepare('DELETE FROM propuestas WHERE id = ?').run(id);
  return result.changes > 0;
};

// ── AUDIT LOG ────────────────────────────────────────────────

function addAudit(entry) {
  getDb().prepare(`
    INSERT INTO audit_log (id,timestamp,entity,entity_id,client_id,action,detail,channel,content_type,content_name,user)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    uid(), now(),
    entry.entity    || 'system',
    entry.entityId  || null,
    entry.clientId  || null,
    entry.action    || 'event',
    entry.detail    || '',
    entry.channel   || null,
    entry.contentType || null,
    entry.contentName || null,
    entry.user      || 'system',
  );
}

const getAuditLog = (filters = {}) => {
  let sql = 'SELECT * FROM audit_log WHERE 1=1';
  const vals = [];
  if (filters.clientId) { sql += ' AND client_id = ?'; vals.push(filters.clientId); }
  if (filters.entity)   { sql += ' AND entity = ?';    vals.push(filters.entity); }
  if (filters.action)   { sql += ' AND action = ?';    vals.push(filters.action); }
  if (filters.from)     { sql += ' AND timestamp >= ?'; vals.push(filters.from); }
  if (filters.to)       { sql += ' AND timestamp <= ?'; vals.push(filters.to); }
  sql += ' ORDER BY timestamp DESC';
  return getDb().prepare(sql).all(...vals).map(mapAudit);
};

// ── RESPUESTAS DEL CLIENTE ───────────────────────────────────

const getRespuestas = (filters = {}) => {
  let sql = 'SELECT * FROM respuestas_cliente WHERE 1=1';
  const vals = [];
  if (filters.clientId)    { sql += ' AND client_id = ?';    vals.push(filters.clientId); }
  if (filters.contenidoId) { sql += ' AND contenido_id = ?'; vals.push(filters.contenidoId); }
  if (filters.messageId)   { sql += ' AND message_id = ?';   vals.push(filters.messageId); }
  sql += ' ORDER BY received_at DESC';
  return getDb().prepare(sql).all(...vals).map(mapRespuesta);
};

const addRespuesta = (data) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO respuestas_cliente
      (id,client_id,message_id,contenido_id,acuerdo_id,channel,received_at,
       content,sender_phone,sender_email,auto_capture,raw,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.clientId||null, data.messageId||null,
    data.contenidoId||null, data.acuerdoId||null,
    data.channel||'manual', data.receivedAt||ts,
    data.content||'', data.senderPhone||null, data.senderEmail||null,
    data.autoCapture ? 1 : 0, data.raw||null, ts
  );
  addAudit({
    entity:'respuesta', entityId:id, clientId:data.clientId, action:'reply_received',
    detail:`Respuesta vía ${data.channel||'manual'}${data.autoCapture?' (automática)':' (manual)'}: "${(data.content||'').substring(0,80)}"`,
    channel:data.channel,
  });
  return mapRespuesta(getDb().prepare('SELECT * FROM respuestas_cliente WHERE id = ?').get(id));
};

// ── MATERIALES ───────────────────────────────────────────────

const getMateriales = (filters = {}) => {
  let sql = 'SELECT * FROM materiales WHERE 1=1';
  const vals = [];
  if (filters.clientId)    { sql += ' AND client_id = ?';    vals.push(filters.clientId); }
  if (filters.contenidoId) { sql += ' AND contenido_id = ?'; vals.push(filters.contenidoId); }
  sql += ' ORDER BY created_at DESC';
  return getDb().prepare(sql).all(...vals).map(mapMaterial);
};

const addMaterial = (data) => {
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO materiales
      (id,client_id,contenido_id,acuerdo_id,filename,original_name,mimetype,size,path,uploaded_at,uploaded_by,notes,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.clientId||null, data.contenidoId||null, data.acuerdoId||null,
    data.filename||'', data.originalName||data.filename||'',
    data.mimetype||'', data.size||0, data.path||'',
    data.uploadedAt||ts, data.uploadedBy||'client', data.notes||null, ts
  );
  const c = getClient(data.clientId);
  addAudit({
    entity:'material', entityId:id, clientId:data.clientId, action:'uploaded',
    detail:`Material subido: "${data.originalName}" (${Math.round((data.size||0)/1024)}KB) — cliente: ${c?.name}`,
  });
  return mapMaterial(getDb().prepare('SELECT * FROM materiales WHERE id = ?').get(id));
};

const deleteMaterial = (id) => {
  const result = getDb().prepare('DELETE FROM materiales WHERE id = ?').run(id);
  return result.changes > 0;
};

// ── PUBLICACIONES ────────────────────────────────────────────

const VALID_CONTENT_TYPES = ['reel','post','story','carrusel','video','otro'];
const VALID_PLATFORMS      = ['instagram','facebook','tiktok','youtube','otro'];

const getPublicaciones = (filters = {}) => {
  let sql = 'SELECT * FROM publicaciones WHERE 1=1';
  const vals = [];
  if (filters.clientId)    { sql += ' AND client_id = ?';    vals.push(filters.clientId); }
  if (filters.platform)    { sql += ' AND platform = ?';     vals.push(filters.platform); }
  if (filters.contentType) { sql += ' AND content_type = ?'; vals.push(filters.contentType); }
  if (filters.from)        { sql += ' AND published_at >= ?'; vals.push(filters.from); }
  if (filters.to)          { sql += ' AND published_at <= ?'; vals.push(filters.to); }
  sql += ' ORDER BY published_at DESC';
  return getDb().prepare(sql).all(...vals).map(mapPublicacion);
};

const getPublicacion = (id) =>
  mapPublicacion(getDb().prepare('SELECT * FROM publicaciones WHERE id = ?').get(id));

const createPublicacion = (data) => {
  if (!VALID_CONTENT_TYPES.includes(data.contentType))
    throw new Error(`contentType inválido. Valores: ${VALID_CONTENT_TYPES.join(', ')}`);
  if (!VALID_PLATFORMS.includes(data.platform))
    throw new Error(`platform inválido. Valores: ${VALID_PLATFORMS.join(', ')}`);
  const id = uid(); const ts = now();
  getDb().prepare(`
    INSERT INTO publicaciones
      (id,client_id,contenido_id,content_type,platform,published_at,url,caption,notes,tags,ig_media_id,source,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, data.clientId||null, data.contenidoId||null,
    data.contentType, data.platform,
    data.publishedAt||ts, data.url||null, data.caption||null,
    data.notes||null,
    Array.isArray(data.tags) ? JSON.stringify(data.tags) : null,
    data.igMediaId||null, data.source||'manual', ts, ts
  );
  const c = getClient(data.clientId);
  addAudit({
    entity:'publicacion', entityId:id, clientId:data.clientId, action:'created',
    detail:`Publicación registrada: ${data.contentType} en ${data.platform} para ${c?.name||data.clientId} — ${(data.publishedAt||ts).substring(0,10)}`,
  });
  return getPublicacion(id);
};

const updatePublicacion = (id, data) => {
  if (data.contentType && !VALID_CONTENT_TYPES.includes(data.contentType))
    throw new Error(`contentType inválido. Valores: ${VALID_CONTENT_TYPES.join(', ')}`);
  if (data.platform && !VALID_PLATFORMS.includes(data.platform))
    throw new Error(`platform inválido. Valores: ${VALID_PLATFORMS.join(', ')}`);
  const keyMap = { contentType:'content_type', platform:'platform', publishedAt:'published_at',
    url:'url', caption:'caption', notes:'notes', igMediaId:'ig_media_id', source:'source' };
  const sets = []; const vals = [];
  for (const [k,v] of Object.entries(data)) {
    if (keyMap[k]) {
      sets.push(`${keyMap[k]} = ?`);
      vals.push(k === 'tags' ? JSON.stringify(v) : v);
    }
  }
  if (data.tags !== undefined) { sets.push('tags = ?'); vals.push(JSON.stringify(data.tags)); }
  if (!sets.length) return getPublicacion(id);
  sets.push('updated_at = ?'); vals.push(now()); vals.push(id);
  getDb().prepare(`UPDATE publicaciones SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const p = getPublicacion(id);
  if (p) addAudit({ entity:'publicacion', entityId:id, clientId:p.clientId, action:'updated',
    detail:`Publicación actualizada: ${p.contentType} en ${p.platform}` });
  return p;
};

const deletePublicacion = (id) => {
  const p = getPublicacion(id);
  const result = getDb().prepare('DELETE FROM publicaciones WHERE id = ?').run(id);
  if (result.changes > 0 && p) {
    addAudit({ entity:'publicacion', entityId:id, clientId:p.clientId, action:'deleted',
      detail:`Publicación eliminada: ${p.contentType} en ${p.platform} — ${p.publishedAt.substring(0,10)}` });
  }
  return result.changes > 0;
};


// ── MIGRACIONES (inlineadas desde migrate.js) ────────────────
// Crea todas las tablas si no existen. Idempotente.
function runMigrations() {
  const db = getDb();

  // Ejecutar todas las creaciones en una transacción atómica
  db.transaction(() => {

    // ── clients ─────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        email       TEXT NOT NULL,
        notes       TEXT,
        wa_phone    TEXT,
        wa_account  TEXT,
        wa_notes    TEXT,
        ig_account  TEXT,
        ig_link     TEXT,
        ig_phone    TEXT,
        ig_notes    TEXT,
        fb_account  TEXT,
        fb_link     TEXT,
        fb_phone    TEXT,
        fb_notes    TEXT,
        tt_account  TEXT,
        tt_link     TEXT,
        tt_phone    TEXT,
        tt_notes    TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
    `);

    // ── tasks ────────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           TEXT PRIMARY KEY,
        client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        type         TEXT NOT NULL,
        content_type TEXT,
        content_name TEXT,
        platform     TEXT,
        due          TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','sent','overdue')),
        created_at   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
    `);

    // ── history ──────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id            TEXT PRIMARY KEY,
        channel       TEXT NOT NULL CHECK (channel IN ('gmail','whatsapp')),
        client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name   TEXT,
        to_address    TEXT NOT NULL,
        subject       TEXT,
        preview       TEXT,
        content_type  TEXT,
        content_name  TEXT,
        platform      TEXT,
        contenido_id  TEXT,
        message_id    TEXT,
        sid           TEXT,
        status        TEXT NOT NULL DEFAULT 'sent',
        replied       INTEGER NOT NULL DEFAULT 0,
        replied_at    TEXT,
        reply_content TEXT,
        reply_channel TEXT,
        created_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_history_client    ON history(client_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_history_contenido ON history(contenido_id);
    `);

    // ── scheduled ────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled (
        id            TEXT PRIMARY KEY,
        channel       TEXT NOT NULL CHECK (channel IN ('gmail','whatsapp')),
        client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name   TEXT,
        to_address    TEXT NOT NULL,
        subject       TEXT,
        body          TEXT NOT NULL,
        scheduled_at  TEXT NOT NULL,
        recurrence    TEXT,
        content_type  TEXT,
        content_name  TEXT,
        platform      TEXT,
        contenido_id  TEXT,
        status        TEXT NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled','sent','failed','cancelled')),
        sent_at       TEXT,
        created_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled(status, scheduled_at);
    `);
    try { db.exec(`ALTER TABLE scheduled ADD COLUMN last_error TEXT`); } catch {}
    try { db.exec(`ALTER TABLE scheduled ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0`); } catch {}
    try { db.exec(`ALTER TABLE scheduled ADD COLUMN next_retry_at TEXT`); } catch {}
    // ── acuerdos ─────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS acuerdos (
        id            TEXT PRIMARY KEY,
        client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        platform      TEXT NOT NULL,
        daily         INTEGER NOT NULL DEFAULT 0,
        weekly        INTEGER NOT NULL DEFAULT 0,
        monthly       INTEGER NOT NULL DEFAULT 0,
        content_types TEXT,
        start_date    TEXT,
        end_date      TEXT,
        notes         TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_acuerdos_client ON acuerdos(client_id);
    `);

    // ── contenido ────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS contenido (
        id          TEXT PRIMARY KEY,
        client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        name        TEXT NOT NULL,
        type        TEXT NOT NULL,
        platform    TEXT,
        status      TEXT NOT NULL DEFAULT 'agreed'
                      CHECK (status IN ('agreed','reminded','replied','inprod','delivered','published','overdue')),
        due         TEXT,
        description TEXT,
        reply       TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_contenido_client ON contenido(client_id, status);
    `);

    // ── propuestas ───────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS propuestas (
        id                    TEXT PRIMARY KEY,
        client_id             TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        plan                  TEXT,
        monthly_value         REAL NOT NULL DEFAULT 0,
        currency              TEXT NOT NULL DEFAULT 'CLP',
        contract_months       INTEGER NOT NULL DEFAULT 3,
        content_qty_daily     INTEGER NOT NULL DEFAULT 0,
        content_qty_weekly    INTEGER NOT NULL DEFAULT 0,
        content_qty_monthly   INTEGER NOT NULL DEFAULT 0,
        platforms             TEXT,
        content_types         TEXT,
        status                TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','sent','in_review','approved','rejected','cancelled')),
        sent_date             TEXT,
        review_date           TEXT,
        approval_date         TEXT,
        start_date            TEXT,
        additional_conditions TEXT,
        comments              TEXT,
        internal_notes        TEXT,
        prepared_by           TEXT,
        imported_from_excel   INTEGER NOT NULL DEFAULT 0,
        created_at            TEXT NOT NULL,
        updated_at            TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_propuestas_client ON propuestas(client_id);
    `);

    // ── audit_log ────────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id           TEXT PRIMARY KEY,
        timestamp    TEXT NOT NULL,
        entity       TEXT NOT NULL,
        entity_id    TEXT,
        client_id    TEXT REFERENCES clients(id) ON DELETE SET NULL,
        action       TEXT NOT NULL,
        detail       TEXT NOT NULL,
        channel      TEXT,
        content_type TEXT,
        content_name TEXT,
        user         TEXT NOT NULL DEFAULT 'system'
      );
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_client    ON audit_log(client_id, timestamp DESC);
    `);

    // ── respuestas_cliente ───────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS respuestas_cliente (
        id           TEXT PRIMARY KEY,
        client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        message_id   TEXT REFERENCES history(id) ON DELETE SET NULL,
        contenido_id TEXT REFERENCES contenido(id) ON DELETE SET NULL,
        acuerdo_id   TEXT REFERENCES acuerdos(id) ON DELETE SET NULL,
        channel      TEXT NOT NULL,
        received_at  TEXT NOT NULL,
        content      TEXT NOT NULL,
        sender_phone TEXT,
        sender_email TEXT,
        auto_capture INTEGER NOT NULL DEFAULT 0,
        raw          TEXT,
        created_at   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_respuestas_client    ON respuestas_cliente(client_id, received_at DESC);
      CREATE INDEX IF NOT EXISTS idx_respuestas_contenido ON respuestas_cliente(contenido_id);
    `);

    // ── materiales ───────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS materiales (
        id            TEXT PRIMARY KEY,
        client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        contenido_id  TEXT REFERENCES contenido(id) ON DELETE SET NULL,
        acuerdo_id    TEXT REFERENCES acuerdos(id) ON DELETE SET NULL,
        filename      TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mimetype      TEXT NOT NULL,
        size          INTEGER NOT NULL,
        path          TEXT NOT NULL,
        uploaded_at   TEXT NOT NULL,
        uploaded_by   TEXT NOT NULL DEFAULT 'admin',
        notes         TEXT,
        created_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_materiales_client    ON materiales(client_id);
      CREATE INDEX IF NOT EXISTS idx_materiales_contenido ON materiales(contenido_id);
    `);

    // ── publicaciones ────────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS publicaciones (
        id            TEXT PRIMARY KEY,
        client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
        contenido_id  TEXT REFERENCES contenido(id) ON DELETE SET NULL,
        content_type  TEXT NOT NULL
                        CHECK (content_type IN ('reel','post','story','carrusel','video','otro')),
        platform      TEXT NOT NULL
                        CHECK (platform IN ('instagram','facebook','tiktok','youtube','otro')),
        published_at  TEXT NOT NULL,
        url           TEXT,
        caption       TEXT,
        notes         TEXT,
        tags          TEXT,
        ig_media_id   TEXT,
        source        TEXT NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('manual','meta_api')),
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_publicaciones_client   ON publicaciones(client_id, published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_platform ON publicaciones(platform, published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_type     ON publicaciones(content_type);
    `);

  })(); // ejecutar transacción inmediatamente

  console.log('[DB] Migraciones completadas — todas las tablas verificadas');
}

// Entrada de auditoría al iniciar (se llama desde server.js post-migrate)
function logStartup() {
  runMigrations();
  addAudit({ entity:'system', action:'startup', detail:'RemindFlow v4.3.0 iniciado' });
}

module.exports = {
  getClients, getClient, createClient, updateClient, deleteClient,
  getTasks, getTask, createTask, updateTask, deleteTask,
  getHistory, addHistory, updateHistory,
  getScheduledMessages, addScheduledMessage, updateScheduledMessage, deleteScheduledMessage,
  getAcuerdos, getAcuerdo, createAcuerdo, updateAcuerdo, deleteAcuerdo,
  getContenido, getContenidoItem, createContenido, updateContenido, deleteContenido,
  getPropuestas, getPropuesta, createPropuesta, updatePropuesta, deletePropuesta,
  addAudit, getAuditLog,
  getRespuestas, addRespuesta,
  getMateriales, addMaterial, deleteMaterial,
  getPublicaciones, getPublicacion, createPublicacion, updatePublicacion, deletePublicacion,
  VALID_CONTENT_TYPES, VALID_PLATFORMS,
  logStartup,
};
