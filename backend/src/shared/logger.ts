type Meta = Record<string, unknown>;

function emit(level: 'info' | 'warn' | 'error', msg: string, meta: Meta): void {
  const entry = { ts: new Date().toISOString(), level, msg, ...meta };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (msg: string, meta: Meta = {}) => emit('info', msg, meta),
  warn: (msg: string, meta: Meta = {}) => emit('warn', msg, meta),
  error: (msg: string, meta: Meta = {}) => emit('error', msg, meta),
};
