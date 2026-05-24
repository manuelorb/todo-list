/**
 * =====================================================
 * GESTOR DE TAREAS JERÁRQUICO — app.js
 * =====================================================
 * Funcionalidades:
 *  - Tareas y subtareas ilimitadas anidadas
 *  - Checkbox de completado con estilos visuales
 *  - Edición inline con doble clic
 *  - Añadir / eliminar tareas y subtareas
 *  - Drag & drop para reordenar
 *  - Persistencia en localStorage
 *  - Exportación a Markdown
 *  - Tema claro / oscuro
 *  - Cambio de idioma (ES / EN)
 *  - Undo / Redo (Ctrl+Z / Ctrl+Y) con botones
 *  - Atajos de teclado
 * =====================================================
 */

/* ---------- Referencias DOM ---------- */
const rootList       = document.getElementById('rootList');
const emptyState     = document.getElementById('emptyState');
const taskCountEl    = document.getElementById('taskCount');
const progressFill   = document.getElementById('progressFill');
const shortcutsToast = document.getElementById('shortcutsToast');
const themeBtn       = document.getElementById('themeBtn');
const langBtn        = document.getElementById('langBtn');
const undoBtn        = document.getElementById('undoBtn');
const redoBtn        = document.getElementById('redoBtn');

/* ---------- Estado global ---------- */
let dragSrc    = null;
let toastTimer = null;

/* =====================================================
   INTERNACIONALIZACIÓN (i18n)
   ===================================================== */

const i18n = {
  es: {
    title:        'Tareas',
    addLabel:     'Añadir tarea',
    downloadLabel:'Descargar Markdown',
    newTask:      'Nueva tarea',
    newSubtask:   'Nueva subtarea',
    pending:      n => `${n} pendiente${n !== 1 ? 's' : ''}`,
    allDone:      '¡Todo listo! 🎉',
    noPending:    '0 pendientes',
    emptyMsg:     'No hay tareas todavía.<br>Pulsa <strong>+ Añadir tarea</strong> o usa <kbd>N</kbd> para empezar.',
    toastTitle:   'Atajos de teclado',
    sk1: 'Nueva tarea',      sk2: 'Cambiar tema',
    sk3: 'Cambiar idioma',   sk4: 'Descargar Markdown',
    sk5: 'Deshacer',         sk6: 'Rehacer',
    sk7: 'Ver atajos',       sk8: 'Confirmar edición',
    sk9: 'Cancelar edición',
    undoTitle:    'Deshacer (Ctrl+Z)',
    redoTitle:    'Rehacer (Ctrl+Y)',
    langTitle:    'Cambiar idioma (L)',
    themeTitle:   'Cambiar tema (T)',
    downloadTitle:'Descargar como Markdown (M)',
    addTaskTitle: 'Añadir tarea (N)',
    addSubtask:   'Añadir subtarea',
    deleteTask:   'Eliminar tarea',
    dragHandle:   'Arrastrar para reordenar',
    checkLabel:   'Marcar tarea como completada',
    taskLabel:    'Texto de la tarea',
    actionsLabel: 'Acciones',
  },
  en: {
    title:        'Tasks',
    addLabel:     'Add task',
    downloadLabel:'Download Markdown',
    newTask:      'New task',
    newSubtask:   'New subtask',
    pending:      n => `${n} pending`,
    allDone:      'All done! 🎉',
    noPending:    '0 pending',
    emptyMsg:     'No tasks yet.<br>Click <strong>+ Add task</strong> or press <kbd>N</kbd> to start.',
    toastTitle:   'Keyboard shortcuts',
    sk1: 'New task',         sk2: 'Toggle theme',
    sk3: 'Toggle language',  sk4: 'Download Markdown',
    sk5: 'Undo',             sk6: 'Redo',
    sk7: 'Show shortcuts',   sk8: 'Confirm edit',
    sk9: 'Cancel edit',
    undoTitle:    'Undo (Ctrl+Z)',
    redoTitle:    'Redo (Ctrl+Y)',
    langTitle:    'Change language (L)',
    themeTitle:   'Toggle theme (T)',
    downloadTitle:'Download as Markdown (M)',
    addTaskTitle: 'Add task (N)',
    addSubtask:   'Add subtask',
    deleteTask:   'Delete task',
    dragHandle:   'Drag to reorder',
    checkLabel:   'Mark task as completed',
    taskLabel:    'Task text',
    actionsLabel: 'Actions',
  },
};

let currentLang = localStorage.getItem('lang') || 'es';

/** Devuelve las traducciones del idioma activo */
function t() { return i18n[currentLang]; }

/** Aplica todas las traducciones estáticas de la UI */
function applyLang() {
  const tr = t();
  document.documentElement.lang = currentLang;
  document.getElementById('appTitle').textContent        = tr.title;
  document.getElementById('addLabel').textContent        = tr.addLabel;
  document.getElementById('downloadLabel').textContent   = tr.downloadLabel;
  document.getElementById('emptyMsg').innerHTML          = tr.emptyMsg;
  document.getElementById('toastTitle').textContent      = tr.toastTitle;
  document.getElementById('sk1').textContent = tr.sk1;
  document.getElementById('sk2').textContent = tr.sk2;
  document.getElementById('sk3').textContent = tr.sk3;
  document.getElementById('sk4').textContent = tr.sk4;
  document.getElementById('sk5').textContent = tr.sk5;
  document.getElementById('sk6').textContent = tr.sk6;
  document.getElementById('sk7').textContent = tr.sk7;
  document.getElementById('sk8').textContent = tr.sk8;
  document.getElementById('sk9').textContent = tr.sk9;
  undoBtn.title  = tr.undoTitle;
  redoBtn.title  = tr.redoTitle;
  langBtn.title  = tr.langTitle;
  themeBtn.title = tr.themeTitle;
  document.getElementById('downloadBtn').title = tr.downloadTitle;
  document.getElementById('addRootBtn').title  = tr.addTaskTitle;
  langBtn.textContent = currentLang.toUpperCase();
  /* Actualizar titles de botones en tareas ya renderizadas */
  document.querySelectorAll('.btn-add').forEach(b => b.title = tr.addSubtask);
  document.querySelectorAll('.btn-del').forEach(b => b.title = tr.deleteTask);
  document.querySelectorAll('.drag-handle').forEach(b => b.title = tr.dragHandle);
  updateStats(); // actualiza badge de conteo en el idioma correcto
}

/** Alterna entre ES y EN */
function toggleLang() {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  localStorage.setItem('lang', currentLang);
  applyLang();
}

/* =====================================================
   UTILIDADES
   ===================================================== */

function genId() {
  return '_' + Math.random().toString(36).slice(2, 9);
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateEmptyState() {
  emptyState.style.display = rootList.children.length === 0 ? 'block' : 'none';
}

/* =====================================================
   UNDO / REDO
   ===================================================== */

const history = {
  past:   [],   // snapshots anteriores
  future: [],   // snapshots para redo
  MAX:    50,   // límite de estados guardados
};

/** Guarda el estado actual antes de un cambio (llamar ANTES de modificar el DOM) */
function pushHistory() {
  history.past.push(JSON.stringify(serializeTasks(rootList)));
  if (history.past.length > history.MAX) history.past.shift();
  history.future = []; // nueva acción borra el historial de redo
  updateUndoRedoBtns();
}

/** Deshace el último cambio */
function undo() {
  if (!history.past.length) return;
  history.future.push(JSON.stringify(serializeTasks(rootList)));
  const prev = JSON.parse(history.past.pop());
  rootList.innerHTML = '';
  loadTasks(rootList, prev);
  saveState();
  updateUndoRedoBtns();
}

/** Rehace el último cambio deshecho */
function redo() {
  if (!history.future.length) return;
  history.past.push(JSON.stringify(serializeTasks(rootList)));
  const next = JSON.parse(history.future.pop());
  rootList.innerHTML = '';
  loadTasks(rootList, next);
  saveState();
  updateUndoRedoBtns();
}

/** Activa o desactiva los botones undo/redo según el estado del historial */
function updateUndoRedoBtns() {
  undoBtn.disabled = history.past.length === 0;
  redoBtn.disabled = history.future.length === 0;
}

/* =====================================================
   ESTADÍSTICAS Y PROGRESO
   ===================================================== */

function confettiCannon() {
  confetti({
    particleCount: 300,
    spread: 90,
    origin: { x: 0, y: .9 }
  });

  confetti({
    particleCount: 300,
    spread: 90,
    origin: { x: 1, y: .9 }
  });
}

function countAll(ul) {
  let total = 0, done = 0;
  for (const li of ul.children) {
    total++;
    if (li.classList.contains('checked')) done++;
    const sub = li.querySelector(':scope > .subtasks');
    if (sub) { const s = countAll(sub); total += s.total; done += s.done; }
  }
  return { total, done };
}

function updateStats() {
  const { total, done } = countAll(rootList);
  const pending = total - done;
  const tr = t();

  if (total === 0){
    taskCountEl.textContent = tr.noPending;
  }
  else if (pending === 0){
    taskCountEl.textContent = tr.allDone;
  }
  else {
    taskCountEl.textContent = tr.pending(pending);
  }

  progressFill.style.width = total > 0 ? (done / total * 100) + '%' : '0%';
  updateEmptyState();
}

/* =====================================================
   PERSISTENCIA (localStorage)
   ===================================================== */

function getState() {
  try { return JSON.parse(localStorage.getItem('tasks_v2') || 'null'); }
  catch (e) { return null; }
}

function serializeTasks(ul) {
  const items = [];
  for (const li of ul.children) {
    const textEl = li.querySelector(':scope > .task-row .task-text');
    const subUl  = li.querySelector(':scope > .subtasks');
    items.push({
      id:       li.dataset.id,
      text:     textEl.innerText.trim(),
      checked:  li.classList.contains('checked'),
      children: subUl ? serializeTasks(subUl) : [],
    });
  }
  return items;
}

function saveState() {
  localStorage.setItem('tasks_v2', JSON.stringify(serializeTasks(rootList)));
  updateStats();
}

/* =====================================================
   CONSTRUCCIÓN DE TAREAS (DOM)
   ===================================================== */

function makeTask(id, text, checked) {
  const tr = t();
  const li = document.createElement('li');
  li.className  = 'task-item adding-in' + (checked ? ' checked' : '');
  li.dataset.id = id || genId();
  li.setAttribute('draggable', 'true');

  li.innerHTML = `
    <div class="task-row">
      <span class="drag-handle" title="${tr.dragHandle}" aria-hidden="true">⠿</span>
      <div class="check-wrap">
        <input type="checkbox" ${checked ? 'checked' : ''} aria-label="${tr.checkLabel}">
      </div>
      <div class="task-text"
           contenteditable="false"
           spellcheck="false"
           role="textbox"
           aria-label="${tr.taskLabel}">${escHtml(text || '')}</div>
      <div class="task-actions" aria-label="${tr.actionsLabel}">
        <button class="btn-action btn-add" title="${tr.addSubtask}">+</button>
        <button class="btn-action btn-del" title="${tr.deleteTask}">✕</button>
      </div>
    </div>
    <ul class="subtasks" aria-label="Subtareas"></ul>`;

  setTimeout(() => li.classList.remove('adding-in'), 250);

  const checkbox = li.querySelector('input[type="checkbox"]');
  const textEl   = li.querySelector('.task-text');
  const btnAdd   = li.querySelector('.btn-add');
  const btnDel   = li.querySelector('.btn-del');
  const subList  = li.querySelector('.subtasks');

  /* ---- Checkbox ---- */
  checkbox.addEventListener('change', () => {
    pushHistory();
    li.classList.toggle('checked', checkbox.checked);
    li.querySelectorAll('.task-item').forEach(child => {
      child.classList.toggle('checked', checkbox.checked);
      const cb = child.querySelector(':scope > .task-row input[type="checkbox"]');
      if (cb) cb.checked = checkbox.checked;
    });

     if (checkbox.checked) {
      const { total, done } = countAll(rootList);
      if (total > 0 && total === done) confettiCannon();
    }

    saveState();
  });

  /* ---- Edición inline ---- */
  let origText = '';

  textEl.addEventListener('dblclick', () => {
    textEl.contentEditable = 'true';
    origText = textEl.innerText;
    textEl.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textEl);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  textEl.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); textEl.blur(); }
    if (e.key === 'Escape') { textEl.innerText = origText; textEl.blur(); }
  });

  textEl.addEventListener('blur', () => {
    const changed = textEl.innerText.trim() !== origText;
    textEl.contentEditable = 'false';
    if (!textEl.innerText.trim()) textEl.innerText = origText || t().newTask;
    if (changed) { pushHistory(); saveState(); }
    else saveState();
  });

  /* ---- Añadir subtarea ---- */
  btnAdd.addEventListener('click', () => {
    pushHistory();
    const child = makeTask(null, t().newSubtask, false);
    subList.appendChild(child);
    focusText(child);
    saveState();
  });

  /* ---- Eliminar tarea ---- */
  btnDel.addEventListener('click', () => {
    pushHistory();
    li.classList.add('removing');
    setTimeout(() => { li.remove(); saveState(); }, 200);
  });

  /* ---- Drag & Drop en el <li> ---- */
  li.addEventListener('dragstart', e => {
    dragSrc = li;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  });

  li.addEventListener('dragend', () => {
    dragSrc = null;
    li.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    saveState();
  });

  li.addEventListener('dragover', e => {
    e.preventDefault(); e.stopPropagation();
    if (dragSrc && dragSrc !== li && !li.contains(dragSrc)) {
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      li.classList.add('drag-over');
    }
  });

  li.addEventListener('dragleave', e => {
    if (!li.contains(e.relatedTarget)) li.classList.remove('drag-over');
  });

  li.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation();
    if (dragSrc && dragSrc !== li && !li.contains(dragSrc)) {
      pushHistory();
      li.parentNode.insertBefore(dragSrc, li);
      li.classList.remove('drag-over');
    }
  });

  /* ---- Drag & Drop en la sublista ---- */
  subList.addEventListener('dragover', e => {
    e.preventDefault(); e.stopPropagation();
    if (dragSrc && !subList.contains(dragSrc)) {
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      subList.classList.add('drag-over');
    }
  });

  subList.addEventListener('dragleave', e => {
    if (!subList.contains(e.relatedTarget)) subList.classList.remove('drag-over');
  });

  subList.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation();
    if (dragSrc && !subList.contains(dragSrc)) {
      pushHistory();
      subList.appendChild(dragSrc);
      subList.classList.remove('drag-over');
    }
  });

  return li;
}

function focusText(li) {
  setTimeout(() => {
    const textEl = li.querySelector(':scope > .task-row .task-text');
    textEl.contentEditable = 'true';
    textEl.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textEl);
    sel.removeAllRanges();
    sel.addRange(range);
  }, 50);
}

/* =====================================================
   CARGA DE DATOS
   ===================================================== */

function loadTasks(ul, data) {
  if (!data) return;
  for (const item of data) {
    const li = makeTask(item.id, item.text, item.checked);
    const subList = li.querySelector('.subtasks');
    if (item.children && item.children.length) loadTasks(subList, item.children);
    ul.appendChild(li);
    li.classList.remove('adding-in');
  }
}

/* =====================================================
   EXPORTACIÓN A MARKDOWN
   ===================================================== */

function generateMarkdown(ul, depth) {
  let md = '';
  const indent = '  '.repeat(depth);
  for (const li of ul.children) {
    const text    = li.querySelector(':scope > .task-row .task-text').innerText.trim();
    const checked = li.classList.contains('checked');
    md += `${indent}- [${checked ? 'x' : ' '}] ${text}\n`;
    const sub = li.querySelector(':scope > .subtasks');
    if (sub && sub.children.length) md += generateMarkdown(sub, depth + 1);
  }
  return md;
}

function downloadMarkdown() {
  const date = new Date().toLocaleDateString('en-GB');
  const heading = currentLang === 'es' ? 'Tareas' : 'Tasks';
  const exported = currentLang === 'es' ? `*Exportado el ${date}*` : `*Exported on ${date}*`;
  const content = `# ${heading}\n\n${exported}\n\n` + generateMarkdown(rootList, 0);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'TODO.md';
  document.body.appendChild(a); 
  a.click();
  document.body.removeChild(a); 
  URL.revokeObjectURL(url);
}

/* =====================================================
   TEMA CLARO / OSCURO
   ===================================================== */

function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeBtn.textContent = dark ? '☀️' : '🌙';
  themeBtn.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'light');
}

/* =====================================================
   TOAST DE ATAJOS
   ===================================================== */

function showToast() {
  shortcutsToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => shortcutsToast.classList.remove('show'), 12000);
}

/* =====================================================
   ATAJOS DE TECLADO GLOBALES
   ===================================================== */

document.addEventListener('keydown', e => {
  const editing = e.target.getAttribute('contenteditable') === 'true'
               || e.target.tagName === 'INPUT'
               || e.target.tagName === 'TEXTAREA';

  /* Ctrl+Z — Undo (funciona también en modo edición para no interferir) */
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    if (!editing) { e.preventDefault(); undo(); }
    return;
  }

  /* Ctrl+Y — Redo */
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    if (!editing) { e.preventDefault(); redo(); }
    return;
  }

  if (editing) return;

  switch (e.key) {
    case 'n': 
    case 'N': 
      e.preventDefault(); 
      addRootTask();      
    break;
    case 't':
    case 'T':
      toggleTheme();
    break;
    case 'l': 
    case 'L':
      toggleLang();
    break;
    case 'm': 
    case 'M':
      downloadMarkdown(); 
    break;
    case 'h':
    case 'H':
      showToast();
    break;
  }
});

/* =====================================================
   ACCIONES DE LA INTERFAZ
   ===================================================== */

function addRootTask() {
  pushHistory();
  const li = makeTask(null, t().newTask, false);
  rootList.appendChild(li);
  focusText(li);
  saveState();
}

document.getElementById('addRootBtn').addEventListener('click', addRootTask);
document.getElementById('downloadBtn').addEventListener('click', downloadMarkdown);
themeBtn.addEventListener('click', toggleTheme);
langBtn.addEventListener('click', toggleLang);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

/* =====================================================
   OBSERVADOR DE CAMBIOS
   ===================================================== */

const observer = new MutationObserver(() => updateStats());
observer.observe(rootList, {
  childList: true, subtree: true,
  attributes: true, attributeFilter: ['class'],
});

/* =====================================================
   INICIALIZACIÓN
   ===================================================== */

(function init() {
  /* Tema */
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) setTheme(savedTheme === 'dark');
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme(true);

  /* Idioma */
  applyLang();

  /* Tareas */
  const saved = getState();
  if (saved && saved.length) {
    loadTasks(rootList, saved);
  }

  updateStats();
  updateUndoRedoBtns();
})();
