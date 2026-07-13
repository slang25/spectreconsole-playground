/**
 * Page-side controller for the executor worker.
 *
 * Owns the worker lifecycle and the SharedArrayBuffer rings the terminal uses.
 * Cancellation is two-stage: set the cancel flag (cooperative), then hard-kill
 * the worker if the run doesn't end promptly — this stops even `while(true){}`.
 */

import { SabRing } from './sabRing.js';

const OUTPUT_RING_BYTES = 256 * 1024;
const INPUT_RING_BYTES = 4 * 1024;
const HARD_KILL_GRACE_MS = 2000;
const DOTNET_URL = '/executor/_framework/dotnet.js';
const WORKER_URL = '/js/executorWorker.js';

let worker = null;
let readyPromise = null;
let outputRing = null;
let inputRing = null;
let control = null;
let currentRun = null; // { resolve, reject, killTimer }
let hardKillCallback = null;

/** Register a callback invoked when a stuck run is forcibly terminated. */
export function onHardKill(callback) {
    hardKillCallback = callback;
}

function spawnWorker() {
    const outputSab = new SharedArrayBuffer(16 + OUTPUT_RING_BYTES);
    const inputSab = new SharedArrayBuffer(16 + INPUT_RING_BYTES);
    const controlSab = new SharedArrayBuffer(8);

    outputRing = new SabRing(outputSab);
    inputRing = new SabRing(inputSab);
    control = new Int32Array(controlSab);

    worker = new Worker(WORKER_URL, { type: 'module' });

    readyPromise = new Promise((resolve, reject) => {
        const onMessage = (e) => {
            const msg = e.data;
            if (msg.type === 'ready') {
                console.log('[executor] Worker runtime ready');
                resolve();
            } else if (msg.type === 'init-error') {
                console.error('[executor] Worker init failed:', msg.error);
                reject(new Error(msg.error));
            } else if (msg.type === 'done') {
                finishRun(msg.error);
            }
        };
        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', (e) => {
            console.error('[executor] Worker error:', e.message);
            reject(new Error(e.message || 'executor worker failed'));
            finishRun(e.message || 'executor worker failed');
        });
    });

    worker.postMessage({
        type: 'init',
        output: outputSab,
        input: inputSab,
        control: controlSab,
        dotnetUrl: DOTNET_URL,
    });

    return readyPromise;
}

function finishRun(error) {
    if (!currentRun) {
        return;
    }
    const run = currentRun;
    currentRun = null;
    if (run.killTimer) {
        clearTimeout(run.killTimer);
    }
    if (error) {
        run.reject(new Error(error));
    } else {
        run.resolve();
    }
}

/**
 * Boot the worker runtime ahead of time (e.g. after page load) so the first
 * Run doesn't pay the download + boot cost.
 */
export async function ensureStarted() {
    if (!readyPromise) {
        spawnWorker();
    }
    return readyPromise;
}

/**
 * Execute a compiled user assembly. Resolves when the program finishes.
 */
export async function run(assemblyBytes, cols, rows) {
    if (currentRun) {
        throw new Error('An execution is already in progress.');
    }
    await ensureStarted();

    Atomics.store(control, 0, 0);
    Atomics.store(control, 1, 0);
    inputRing.reset();

    const bytes = assemblyBytes instanceof Uint8Array ? assemblyBytes : new Uint8Array(assemblyBytes);

    return new Promise((resolve, reject) => {
        currentRun = { resolve, reject, killTimer: null };
        worker.postMessage({ type: 'run', assembly: bytes, cols, rows });
    });
}

/**
 * Request cancellation. Cooperative first (flag + wake all waits); if the run
 * is still alive after the grace period, terminate and respawn the worker.
 */
export function cancel() {
    if (!control) {
        return;
    }

    Atomics.store(control, 0, 1);
    Atomics.notify(control, 1); // cut short any sleep
    // Wake a blocking key read so it observes the flag.
    Atomics.add(inputRing.header, 2, 1);
    Atomics.notify(inputRing.header, 2);
    // Wake a writer blocked on a full output ring.
    Atomics.add(outputRing.header, 3, 1);
    Atomics.notify(outputRing.header, 3);

    if (currentRun && !currentRun.killTimer) {
        currentRun.killTimer = setTimeout(() => {
            if (currentRun) {
                console.warn('[executor] Run did not stop after cancel; terminating worker');
                hardKill();
            }
        }, HARD_KILL_GRACE_MS);
    }
}

/** Terminate the worker outright and reset state. A new worker spawns lazily. */
export function hardKill() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    readyPromise = null;
    const run = currentRun;
    currentRun = null;
    if (run) {
        if (run.killTimer) {
            clearTimeout(run.killTimer);
        }
        run.resolve(); // cancelled runs resolve; the page writes its own notice
    }
    try { hardKillCallback?.(); } catch { /* notification only */ }
}

export function isRunning() {
    return currentRun !== null;
}

/** Read everything currently in the output ring (page render loop). */
export function readOutput() {
    return outputRing ? outputRing.readAll() : new Uint8Array(0);
}

/**
 * Queue a key packet for the executor: [keyCode u8, keyChar u16 LE, modifiers u8].
 */
export function writeKeyPacket(keyCode, keyChar, shift, alt, ctrl) {
    if (!inputRing) {
        return;
    }
    const data = new Uint8Array(4);
    data[0] = keyCode & 0xFF;
    data[1] = keyChar & 0xFF;
    data[2] = (keyChar >> 8) & 0xFF;
    data[3] = (shift ? 1 : 0) | (alt ? 2 : 0) | (ctrl ? 4 : 0);
    inputRing.write(data);
}

export function resetIO() {
    outputRing?.reset();
    inputRing?.reset();
}
