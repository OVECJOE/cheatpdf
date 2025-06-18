importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/idb-keyval-iife.min.js');

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'exam-timer-sync') {
    event.waitUntil(syncExamTimer());
  }
});

async function syncExamTimer() {
  const examId = await idbKeyval.get('currentExamId');
  if (!examId) return;

  const res = await fetch(`/api/exams/${examId}/timer`);
  const data = await res.json();

  if (data.status !== 'IN_PROGRESS' || (data.startedAt && data.timeLimit && (new Date(data.startedAt).getTime() + data.timeLimit * 60 * 1000 < Date.now()))) {
    await fetch(`/api/exams/${examId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
  }
}