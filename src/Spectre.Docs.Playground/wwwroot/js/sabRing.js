/**
 * SharedArrayBuffer-backed ring buffer shared between the page and the executor worker.
 *
 * Layout (Int32 header, little-endian):
 *   [0] write index (bytes, into data region)
 *   [1] read index
 *   [2] data signal  — incremented + notified after every write
 *   [3] space signal — incremented + notified after every read
 * Data region follows the 16-byte header.
 *
 * The page main thread may read/write/notify but must never Atomics.wait;
 * only the worker blocks.
 */

export const HEADER_INTS = 4;
export const HEADER_BYTES = HEADER_INTS * 4;

export class SabRing {
    constructor(sab) {
        this.sab = sab;
        this.header = new Int32Array(sab, 0, HEADER_INTS);
        this.data = new Uint8Array(sab, HEADER_BYTES);
        this.dataSize = this.data.length;
    }

    static create(dataSize) {
        return new SabRing(new SharedArrayBuffer(HEADER_BYTES + dataSize));
    }

    available() {
        const w = Atomics.load(this.header, 0);
        const r = Atomics.load(this.header, 1);
        return w >= r ? w - r : this.dataSize - r + w;
    }

    freeSpace() {
        return this.dataSize - this.available() - 1;
    }

    /** Write bytes if they fit. Returns false when the buffer is full. */
    write(bytes) {
        if (bytes.length > this.freeSpace()) {
            return false;
        }
        let w = Atomics.load(this.header, 0);
        for (let i = 0; i < bytes.length; i++) {
            this.data[w] = bytes[i];
            w = (w + 1) % this.dataSize;
        }
        Atomics.store(this.header, 0, w);
        Atomics.add(this.header, 2, 1);
        Atomics.notify(this.header, 2);
        return true;
    }

    /** Read up to maxBytes. Returns a (possibly empty) Uint8Array. */
    read(maxBytes) {
        const avail = this.available();
        if (avail === 0) {
            return new Uint8Array(0);
        }
        const toRead = Math.min(maxBytes, avail);
        const result = new Uint8Array(toRead);
        let r = Atomics.load(this.header, 1);
        for (let i = 0; i < toRead; i++) {
            result[i] = this.data[r];
            r = (r + 1) % this.dataSize;
        }
        Atomics.store(this.header, 1, r);
        Atomics.add(this.header, 3, 1);
        Atomics.notify(this.header, 3);
        return result;
    }

    readAll() {
        return this.read(this.available());
    }

    /** Worker-only: block until data arrives or timeout. Returns availability. */
    waitForData(timeoutMs) {
        if (this.available() > 0) {
            return true;
        }
        const signal = Atomics.load(this.header, 2);
        if (this.available() > 0) {
            return true;
        }
        Atomics.wait(this.header, 2, signal, timeoutMs);
        return this.available() > 0;
    }

    /** Worker-only: block until space frees up or timeout. Returns free byte count. */
    waitForSpace(timeoutMs) {
        const free = this.freeSpace();
        if (free > 0) {
            return free;
        }
        const signal = Atomics.load(this.header, 3);
        if (this.freeSpace() > 0) {
            return this.freeSpace();
        }
        Atomics.wait(this.header, 3, signal, timeoutMs);
        return this.freeSpace();
    }

    reset() {
        Atomics.store(this.header, 0, 0);
        Atomics.store(this.header, 1, 0);
        Atomics.store(this.header, 2, 0);
        Atomics.store(this.header, 3, 0);
    }
}
