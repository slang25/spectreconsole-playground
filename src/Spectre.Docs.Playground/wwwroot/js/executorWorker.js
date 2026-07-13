/**
 * Executor worker: hosts a dedicated single-threaded .NET runtime that runs
 * user code. Blocking this thread is safe — the page stays responsive, and
 * the page can hard-kill this worker at any time (worker.terminate()).
 *
 * Control SAB (Int32Array):
 *   [0] cancel flag (0 = run, 1 = cancel requested)
 *   [1] sleep cell — always 0; cancellation notifies it to cut sleeps short
 */

import { SabRing } from './sabRing.js';

// Sidecar mode: tells dotnet.js this worker hosts its own standalone runtime.
// Without it the loader assumes any worker is a pthread worker and parks the
// boot sequence forever waiting for a main thread to drive it.
globalThis.dotnetSidecar = true;

// Surface async boot failures that would otherwise stall silently.
self.addEventListener('unhandledrejection', (e) => {
    console.error('[executorWorker] unhandled rejection:', e.reason);
    self.postMessage({ type: 'init-error', error: String(e.reason?.message ?? e.reason) });
});

// dotnet.js occasionally touches `document` (e.g. boot-resource cache naming);
// give it a minimal stand-in so those paths work in a worker.
if (typeof document === 'undefined') {
    self.document = { baseURI: self.location.href, location: self.location };
}

let outputRing = null;
let inputRing = null;
let control = null;
let exports = null;

const encoder = new TextEncoder();

// Matches the legacy cancel packet: [keyCode=0, keyChar=0x03, 0x00, modifiers=0xFF]
function isCancelPacket(b) {
    return b[0] === 0 && b[1] === 0x03 && b[2] === 0x00 && b[3] === 0xFF;
}

function packKey(b) {
    return b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
}

function cancelled() {
    return Atomics.load(control, 0) !== 0;
}

const executorIO = {
    writeOutput(text) {
        let bytes = encoder.encode(text);
        while (bytes.length > 0) {
            if (cancelled()) {
                return; // drop output once cancelled; the page is tearing down
            }
            const free = outputRing.freeSpace();
            if (free === 0) {
                outputRing.waitForSpace(100);
                continue;
            }
            const chunk = bytes.subarray(0, Math.min(free, bytes.length));
            outputRing.write(chunk);
            bytes = bytes.subarray(chunk.length);
        }
    },

    readKeyBlocking() {
        for (;;) {
            if (cancelled()) {
                return -1;
            }
            if (inputRing.available() >= 4) {
                const b = inputRing.read(4);
                if (isCancelPacket(b)) {
                    return -1;
                }
                return packKey(b);
            }
            inputRing.waitForData(200);
        }
    },

    isInputAvailable() {
        return inputRing.available() >= 4;
    },

    isCancelled() {
        return cancelled();
    },

    sleep(ms) {
        // Blocking zero-CPU sleep; control[1] is never non-zero, so this waits
        // the full timeout unless cancellation notifies the cell.
        if (ms > 0 && !cancelled()) {
            Atomics.wait(control, 1, 0, ms);
        }
    },
};

self.onmessage = async (e) => {
    const msg = e.data;

    if (msg.type === 'init') {
        try {
            outputRing = new SabRing(msg.output);
            inputRing = new SabRing(msg.input);
            control = new Int32Array(msg.control);

            const { dotnet } = await import(msg.dotnetUrl);
            console.log('[executorWorker] dotnet.js imported, creating runtime...');
            // The Blazor-built runtime enables boot-resource caching, whose cache-name
            // derivation reads `document.baseURI` — undefined in a worker. Disable it.
            const runtime = await dotnet
                .withConfig({ cacheBootResources: false })
                .create();
            console.log('[executorWorker] runtime created');
            runtime.setModuleImports('executorIO', executorIO);
            const config = runtime.getConfig();
            exports = await runtime.getAssemblyExports(config.mainAssemblyName);

            self.postMessage({ type: 'ready' });
        } catch (err) {
            console.error('[executorWorker] init failed:', err);
            self.postMessage({ type: 'init-error', error: String(err?.message ?? err) });
        }
        return;
    }

    if (msg.type === 'run') {
        try {
            await exports.Spectre.Docs.Playground.Executor.ExecutorHost.ExecuteAsync(
                msg.assembly, msg.cols, msg.rows);
            self.postMessage({ type: 'done' });
        } catch (err) {
            self.postMessage({ type: 'done', error: String(err?.message ?? err) });
        }
        return;
    }
};
