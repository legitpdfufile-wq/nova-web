const fields = ['project', 'audience', 'outcome', 'spark'];
const state = { format: 'A useful website' };
const $ = id => document.getElementById(id);
const clean = value => value.trim();

function titleCase(value) { return value.replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function firstSentence(value) { const trimmed = clean(value); return trimmed ? trimmed.replace(/[.?!]+$/, '') + '.' : ''; }
function load() {
  try { Object.assign(state, JSON.parse(localStorage.getItem('signal-room-brief') || '{}')); } catch { /* intentionally ignore a bad local draft */ }
  fields.forEach(id => { $(id).value = state[id] || ''; });
  document.querySelectorAll('.format').forEach(button => button.classList.toggle('active', button.dataset.format === state.format));
}
function save() { localStorage.setItem('signal-room-brief', JSON.stringify(state)); }
function render() {
  fields.forEach(id => state[id] = $(id).value);
  const filled = fields.filter(id => clean(state[id])).length;
  $('progressBar').style.width = `${filled / fields.length * 100}%`;
  const project = clean(state.project);
  const audience = clean(state.audience);
  const outcome = clean(state.outcome);
  const spark = clean(state.spark);
  $('releaseTitle').textContent = project ? titleCase(project) : 'Name the thing.';
  $('formatOut').textContent = state.format;
  $('firstMove').textContent = audience ? `Put it in front of ${audience.toLowerCase()}.` : 'Start with the people who need it most.';
  $('signalState').textContent = filled === 4 ? 'BRIEF HAS A SIGNAL' : `${filled}/4 SIGNALS CAPTURED`;
  $('releasePitch').textContent = project && audience
    ? `${project} is a ${state.format.toLowerCase()} for ${audience.toLowerCase()}${outcome ? `—so ${firstSentence(outcome).toLowerCase()}` : '.'}`
    : 'A clear sentence will show up here when you give the idea a little shape.';
  $('export').disabled = !(project && audience && outcome && spark);
  $('savedMessage').textContent = filled ? 'Saved only in this browser.' : 'Nothing saved yet.';
  save();
}
function exportBrief() {
  const text = `SIGNAL ROOM / FIRST RELEASE BRIEF\n\nName: ${titleCase(clean(state.project))}\nFormat: ${state.format}\nFor: ${clean(state.audience)}\n\nOutcome\n${clean(state.outcome)}\n\nThe line\n${clean(state.spark)}\n\nFirst move\n${$('firstMove').textContent}\n\nCreated locally in Signal Room. This file contains only the words entered in this browser.`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${clean(state.project).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'signal-room'}-brief.txt`;
  document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
  $('savedMessage').textContent = 'Brief exported. Your draft is still saved here.';
}
fields.forEach(id => $(id).addEventListener('input', render));
document.querySelectorAll('.format').forEach(button => button.addEventListener('click', () => { state.format = button.dataset.format; document.querySelectorAll('.format').forEach(item => item.classList.toggle('active', item === button)); render(); }));
$('briefForm').addEventListener('submit', event => event.preventDefault());
$('export').addEventListener('click', exportBrief);
$('reset').addEventListener('click', () => { if (!confirm('Start a fresh brief? This removes the browser-only draft.')) return; fields.forEach(id => $(id).value = ''); state.format = 'A useful website'; localStorage.removeItem('signal-room-brief'); document.querySelectorAll('.format').forEach(button => button.classList.toggle('active', button.dataset.format === state.format)); render(); });
load(); render();
