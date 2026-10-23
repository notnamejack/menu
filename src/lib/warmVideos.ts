type Task = {
  run: () => Promise<void>;
  cancelled: boolean;
};

const pending: Task[] = [];
let active = 0;
let armed = false;
const LIMIT = 2;

function pump() {
  while (active < LIMIT && pending.length > 0) {
    const task = pending.shift();
    if (!task || task.cancelled) continue;
    active += 1;
    task.run().finally(() => {
      active -= 1;
      pump();
    });
  }
}

function arm() {
  if (armed) return;
  armed = true;
  const start = () => window.setTimeout(pump, 200);
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

export function enqueueVideoWarm(run: () => Promise<void>) {
  const task: Task = { run, cancelled: false };
  pending.push(task);
  arm();
  return () => {
    task.cancelled = true;
  };
}
