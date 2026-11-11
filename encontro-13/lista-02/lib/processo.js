import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export function iniciar(caminho, armazenamento = 'sqlite') {
  return new Promise((resolve, reject) => {
    const filho = fork(fileURLToPath(new URL('../src/server.js', import.meta.url)), [], {
      env: { ...process.env, DB_PATH: caminho, PORT: '0', ARMAZENAMENTO: armazenamento },
      stdio: ['ignore', 'ignore', 'pipe', 'ipc']
    });
    let erros = '';
    filho.stderr.on('data', chunk => { erros += chunk.toString(); });
    const timer = setTimeout(() => { filho.kill(); reject(new Error('Timeout iniciando API: ' + erros)); }, 10000);
    filho.once('error', erro => { clearTimeout(timer); reject(erro); });
    filho.once('exit', code => { clearTimeout(timer); reject(new Error(`API encerrou (${code}): ${erros}`)); });
    filho.once('message', ({ port }) => {
      clearTimeout(timer);
      resolve({
        pid: filho.pid,
        url: `http://127.0.0.1:${port}`,
        parar: () => new Promise((ok, falhou) => {
          if (filho.exitCode !== null) return ok();
          const limite = setTimeout(() => { filho.kill('SIGKILL'); falhou(new Error('API não encerrou')); }, 10000);
          filho.once('exit', code => { clearTimeout(limite); code === 0 ? ok() : falhou(new Error(`Saída ${code}`)); });
          filho.send('encerrar');
        })
      });
    });
  });
}
export async function requisitar(api, metodo, caminho, dados, usuario = 1) {
  const r = await fetch(api.url + caminho, {
    method: metodo, headers: { 'Content-Type': 'application/json', 'X-Usuario-Id': String(usuario) },
    body: dados === undefined ? undefined : JSON.stringify(dados), signal: AbortSignal.timeout(5000)
  });
  return { status: r.status, body: r.status === 204 ? null : await r.json() };
}
