// Generated from srcts/index.ts by esbuild — do not edit by hand.
"use strict";
(() => {
  // node_modules/flatqueue/index.js
  var FlatQueue = class {
    /**
     * Creates an empty queue. If `capacity` is provided, the queue is backed by fixed-size typed
     * arrays for better performance and memory use, but can't grow beyond `capacity`. `values` uses
     * `ValuesArray` (default `Float64Array`) and `ids` uses `IdsArray` (default `Uint32Array`); pass
     * narrower constructors like `Uint16Array` if your values or ids are known to fit them.
     *
     * @param {number} [capacity]
     * @param {TypedArrayConstructor} [ValuesArray]
     * @param {TypedArrayConstructor} [IdsArray]
     */
    constructor(capacity = Infinity, ValuesArray = Float64Array, IdsArray = Uint32Array) {
      const fixed = capacity !== Infinity;
      this.ids = fixed ? (
        /** @type {T[]} */
        /** @type {unknown} */
        new IdsArray(capacity)
      ) : [];
      this.values = fixed ? (
        /** @type {number[]} */
        /** @type {unknown} */
        new ValuesArray(capacity)
      ) : [];
      this.capacity = capacity;
      this.length = 0;
    }
    /** Removes all items from the queue. */
    clear() {
      this.length = 0;
    }
    /**
     * Adds `item` to the queue with the specified `priority`.
     *
     * `priority` must be a number. Items are sorted and returned from low to high priority. Multiple items
     * with the same priority value can be added to the queue, but there is no guaranteed order between these items.
     *
     * For fixed-capacity queues, throws a `RangeError` if the queue is already full.
     *
     * @param {T} item
     * @param {number} priority
     */
    push(item, priority) {
      if (this.length === this.capacity) throw new RangeError("Queue is at capacity.");
      let pos = this.length++;
      while (pos > 0) {
        const parent = pos - 1 >> 1;
        const parentValue = this.values[parent];
        if (priority >= parentValue) break;
        this.ids[pos] = this.ids[parent];
        this.values[pos] = parentValue;
        pos = parent;
      }
      this.ids[pos] = item;
      this.values[pos] = priority;
    }
    /**
     * Removes and returns the item from the head of this queue, which is one of
     * the items with the lowest priority. If this queue is empty, returns `undefined`.
     */
    pop() {
      if (this.length === 0) return void 0;
      const ids = this.ids, values = this.values, top = ids[0], last = --this.length;
      if (last > 0) {
        const id = ids[last];
        const value = values[last];
        let pos = 0;
        const halfLen = last >> 1;
        while (pos < halfLen) {
          const left = (pos << 1) + 1;
          const right = left + 1;
          const child = left + (+(right < last) & +(values[right] < values[left]));
          if (values[child] >= value) break;
          ids[pos] = ids[child];
          values[pos] = values[child];
          pos = child;
        }
        ids[pos] = id;
        values[pos] = value;
      }
      return top;
    }
    /** Returns the item from the head of this queue without removing it. If this queue is empty, returns `undefined`. */
    peek() {
      return this.length > 0 ? this.ids[0] : void 0;
    }
    /**
     * Returns the priority value of the item at the head of this queue without
     * removing it. If this queue is empty, returns `undefined`.
     */
    peekValue() {
      return this.length > 0 ? this.values[0] : void 0;
    }
    /**
     * Shrinks the internal arrays to `this.length`. No-op for queues with fixed capacity.
     *
     * `pop()` and `clear()` calls don't free memory automatically to avoid unnecessary resize operations.
     * This also means that items that have been added to the queue can't be garbage collected until
     * a new item is pushed in their place, or this method is called.
     */
    shrink() {
      if (Array.isArray(this.ids)) this.ids.length = this.length;
      if (Array.isArray(this.values)) this.values.length = this.length;
    }
  };

  // node_modules/flatbush/index.js
  var ARRAY_TYPES = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
  var VERSION = 3;
  var Flatbush = class _Flatbush {
    /**
     * Recreate a Flatbush index from raw `ArrayBuffer` or `SharedArrayBuffer` data.
     * @param {ArrayBufferLike} data
     * @param {number} [byteOffset=0] byte offset to the start of the Flatbush buffer in the referenced ArrayBuffer.
     * @returns {Flatbush} index
     */
    static from(data, byteOffset = 0) {
      if (byteOffset % 8 !== 0) {
        throw new Error("byteOffset must be 8-byte aligned.");
      }
      if (!data || data.byteLength === void 0 || "buffer" in data) {
        throw new Error("Data must be an instance of ArrayBuffer or SharedArrayBuffer.");
      }
      const [magic, versionAndType] = new Uint8Array(data, byteOffset + 0, 2);
      if (magic !== 251) {
        throw new Error("Data does not appear to be in a Flatbush format.");
      }
      const version = versionAndType >> 4;
      if (version !== VERSION) {
        throw new Error(`Got v${version} data when expected v${VERSION}.`);
      }
      const ArrayType = ARRAY_TYPES[versionAndType & 15];
      if (!ArrayType) {
        throw new Error("Unrecognized array type.");
      }
      const [nodeSize] = new Uint16Array(data, byteOffset + 2, 1);
      const [numItems] = new Uint32Array(data, byteOffset + 4, 1);
      return new _Flatbush(numItems, nodeSize, ArrayType, void 0, data, byteOffset);
    }
    /**
     * Create a Flatbush index that will hold a given number of items.
     * @param {number} numItems
     * @param {number} [nodeSize=16] Size of the tree node (16 by default).
     * @param {TypedArrayConstructor} [ArrayType=Float64Array] The array type used for coordinates storage (`Float64Array` by default).
     * @param {ArrayBufferConstructor | SharedArrayBufferConstructor} [ArrayBufferType=ArrayBuffer] The array buffer type used to store data (`ArrayBuffer` by default).
     * @param {ArrayBufferLike} [data] (Only used internally)
     * @param {number} [byteOffset=0] (Only used internally)
     */
    constructor(numItems, nodeSize = 16, ArrayType = Float64Array, ArrayBufferType = ArrayBuffer, data, byteOffset = 0) {
      if (numItems === void 0) throw new Error("Missing required argument: numItems.");
      if (isNaN(numItems) || numItems <= 0) throw new Error(`Unexpected numItems value: ${numItems}.`);
      this.numItems = +numItems;
      this.nodeSize = Math.min(Math.max(+nodeSize, 2), 65535);
      this.byteOffset = byteOffset;
      let n = numItems;
      let numNodes = n;
      this._levelBounds = [n * 4];
      do {
        n = Math.ceil(n / this.nodeSize);
        numNodes += n;
        this._levelBounds.push(numNodes * 4);
      } while (n !== 1);
      this.ArrayType = ArrayType;
      this.IndexArrayType = numNodes < 16384 ? Uint16Array : Uint32Array;
      const arrayTypeIndex = ARRAY_TYPES.indexOf(ArrayType);
      const nodesByteSize = numNodes * 4 * ArrayType.BYTES_PER_ELEMENT;
      if (arrayTypeIndex < 0) {
        throw new Error(`Unexpected typed array class: ${ArrayType}.`);
      }
      const BoxCtor = ArrayType;
      const IdxCtor = this.IndexArrayType;
      if (data) {
        this.data = data;
        this._boxes = new BoxCtor(data, byteOffset + 8, numNodes * 4);
        this._indices = new IdxCtor(data, byteOffset + 8 + nodesByteSize, numNodes);
        this._pos = numNodes * 4;
        this.minX = this._boxes[this._pos - 4];
        this.minY = this._boxes[this._pos - 3];
        this.maxX = this._boxes[this._pos - 2];
        this.maxY = this._boxes[this._pos - 1];
      } else {
        const data2 = this.data = new ArrayBufferType(8 + nodesByteSize + numNodes * this.IndexArrayType.BYTES_PER_ELEMENT);
        this._boxes = new BoxCtor(data2, 8, numNodes * 4);
        this._indices = new IdxCtor(data2, 8 + nodesByteSize, numNodes);
        this._pos = 0;
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        new Uint8Array(data2, 0, 2).set([251, (VERSION << 4) + arrayTypeIndex]);
        new Uint16Array(data2, 2, 1)[0] = nodeSize;
        new Uint32Array(data2, 4, 1)[0] = numItems;
      }
      this._queue = new FlatQueue();
    }
    /**
     * Add a given rectangle to the index.
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @returns {number} A zero-based, incremental number that represents the newly added rectangle.
     */
    add(minX, minY, maxX = minX, maxY = minY) {
      const pos = this._pos;
      const index = pos >> 2;
      const boxes = this._boxes;
      this._indices[index] = index;
      boxes[pos] = minX;
      boxes[pos + 1] = minY;
      boxes[pos + 2] = maxX;
      boxes[pos + 3] = maxY;
      this._pos = pos + 4;
      if (minX < this.minX) this.minX = minX;
      if (minY < this.minY) this.minY = minY;
      if (maxX > this.maxX) this.maxX = maxX;
      if (maxY > this.maxY) this.maxY = maxY;
      return index;
    }
    /** Perform indexing of the added rectangles. */
    finish() {
      if (this._pos >> 2 !== this.numItems) {
        throw new Error(`Added ${this._pos >> 2} items when expected ${this.numItems}.`);
      }
      const boxes = this._boxes;
      if (this.numItems <= this.nodeSize) {
        boxes[this._pos++] = this.minX;
        boxes[this._pos++] = this.minY;
        boxes[this._pos++] = this.maxX;
        boxes[this._pos++] = this.maxY;
        return;
      }
      const { numItems, minX, minY, nodeSize, _indices: indices, _levelBounds: levelBounds } = this;
      const width = this.maxX - minX || 1;
      const height = this.maxY - minY || 1;
      const hilbertValues = new Int32Array(numItems);
      const hilbertMax = (1 << 16) - 1;
      const sx = hilbertMax / width;
      const sy = hilbertMax / height;
      for (let i = 0, pos2 = 0; i < numItems; i++) {
        const itemMinX = boxes[pos2++];
        const itemMinY = boxes[pos2++];
        const itemMaxX = boxes[pos2++];
        const itemMaxY = boxes[pos2++];
        const x = sx * ((itemMinX + itemMaxX) / 2 - minX) | 0;
        const y = sy * ((itemMinY + itemMaxY) / 2 - minY) | 0;
        hilbertValues[i] = hilbert(x, y);
      }
      sort(hilbertValues, boxes, indices, 0, numItems - 1, nodeSize);
      let pos = numItems * 4;
      for (let i = 0, readPos = 0; i < levelBounds.length - 1; i++) {
        const end = levelBounds[i];
        while (readPos < end) {
          const nodeIndex = readPos;
          let nodeMinX = boxes[readPos++];
          let nodeMinY = boxes[readPos++];
          let nodeMaxX = boxes[readPos++];
          let nodeMaxY = boxes[readPos++];
          for (let j = 1; j < nodeSize && readPos < end; j++) {
            nodeMinX = Math.min(nodeMinX, boxes[readPos++]);
            nodeMinY = Math.min(nodeMinY, boxes[readPos++]);
            nodeMaxX = Math.max(nodeMaxX, boxes[readPos++]);
            nodeMaxY = Math.max(nodeMaxY, boxes[readPos++]);
          }
          indices[pos >> 2] = nodeIndex;
          boxes[pos++] = nodeMinX;
          boxes[pos++] = nodeMinY;
          boxes[pos++] = nodeMaxX;
          boxes[pos++] = nodeMaxY;
        }
      }
      this._pos = pos;
    }
    /**
     * Search the index by a bounding box.
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @param {(index: number, x0: number, y0: number, x1: number, y1: number) => boolean} [filterFn] An optional function that is called on every found item; if supplied, only items for which this function returns true will be included in the results array.
     * @returns {number[]} An array of indices of items intersecting or touching the given bounding box.
     */
    search(minX, minY, maxX, maxY, filterFn) {
      if (this._pos !== this._boxes.length) {
        throw new Error("Data not yet indexed - call index.finish().");
      }
      const { _boxes: boxes, _levelBounds: levelBounds, _indices: indices, nodeSize } = this;
      const numItems4 = this.numItems * 4;
      let nodeIndex = boxes.length - 4;
      let level = levelBounds.length - 1;
      const q = [];
      const results = [];
      let contained = false;
      while (nodeIndex !== void 0) {
        const end = Math.min(nodeIndex + nodeSize * 4, levelBounds[level]);
        const isNode = nodeIndex >= numItems4;
        if (contained) {
          this._collectContained(nodeIndex, end, level, numItems4, results, filterFn);
        } else {
          for (let pos = nodeIndex; pos < end; pos += 4) {
            const x0 = boxes[pos];
            if (maxX < x0) continue;
            const y0 = boxes[pos + 1];
            if (maxY < y0) continue;
            const x1 = boxes[pos + 2];
            if (minX > x1) continue;
            const y1 = boxes[pos + 3];
            if (minY > y1) continue;
            const index = indices[pos >> 2] | 0;
            if (isNode) {
              const c = +(minX <= x0 && minY <= y0 && maxX >= x1 && maxY >= y1);
              q.push(index | c, level - 1);
            } else if (filterFn === void 0 || filterFn(index, x0, y0, x1, y1)) {
              results.push(index);
            }
          }
        }
        level = /** @type {number} */
        q.pop();
        nodeIndex = q.pop();
        if (nodeIndex !== void 0) {
          contained = (nodeIndex & 1) === 1;
          nodeIndex &= ~1;
        }
      }
      return results;
    }
    /**
     * Collect all leaves of a subtree that's fully inside the query, skipping intersection tests.
     * Because the tree is packed bottom-up, those leaves occupy one contiguous block of the leaf
     * level, so we skip traversal entirely: descend to the first leaf, then sweep the flat range.
     * @param {number} nodeIndex
     * @param {number} end
     * @param {number} level
     * @param {number} numItems4
     * @param {number[]} results
     * @param {((index: number, x0: number, y0: number, x1: number, y1: number) => boolean) | undefined} filterFn
     */
    _collectContained(nodeIndex, end, level, numItems4, results, filterFn) {
      const boxes = this._boxes;
      const indices = this._indices;
      let pos = nodeIndex;
      for (let l = level; l > 0; l--) pos = indices[pos >> 2];
      const leafEnd = Math.min(pos + (end - nodeIndex) * this.nodeSize ** level, numItems4);
      if (filterFn === void 0) {
        for (; pos < leafEnd; pos += 4) results.push(indices[pos >> 2] | 0);
      } else {
        for (; pos < leafEnd; pos += 4) {
          const index = indices[pos >> 2] | 0;
          if (filterFn(index, boxes[pos], boxes[pos + 1], boxes[pos + 2], boxes[pos + 3])) results.push(index);
        }
      }
    }
    /**
     * Search items in order of distance from the given point.
     * @param {number} x
     * @param {number} y
     * @param {number} [maxResults=Infinity]
     * @param {number} [maxDistance=Infinity]
     * @param {(index: number) => boolean} [filterFn] An optional function for filtering the results.
     * @returns {number[]} An array of indices of items found.
     */
    neighbors(x, y, maxResults = Infinity, maxDistance = Infinity, filterFn) {
      if (this._pos !== this._boxes.length) {
        throw new Error("Data not yet indexed - call index.finish().");
      }
      const { _boxes: boxes, _levelBounds: levelBounds, _indices: indices, _queue: q, nodeSize } = this;
      const numItems4 = this.numItems * 4;
      const nodeSize4 = nodeSize * 4;
      const results = [];
      const maxDistSquared = maxDistance * maxDistance;
      const trackNearest = maxResults === 1;
      let bound = maxDistSquared;
      q.push(boxes.length - 4 << 1, 0);
      while (q.length) {
        const top = q.ids[0];
        if (top & 1) {
          q.pop();
          results.push(top >> 1);
          if (results.length === maxResults) break;
          continue;
        }
        q.pop();
        const nodeIndex = top >> 1;
        const isLeafLevel = nodeIndex < numItems4;
        const end = Math.min(nodeIndex + nodeSize4, upperBound(nodeIndex, levelBounds));
        for (let pos = nodeIndex; pos < end; pos += 4) {
          const minX = boxes[pos];
          const minY = boxes[pos + 1];
          const maxX = boxes[pos + 2];
          const maxY = boxes[pos + 3];
          const dx = Math.max(Math.max(minX - x, x - maxX), 0);
          const dy = Math.max(Math.max(minY - y, y - maxY), 0);
          const dist = dx * dx + dy * dy;
          if (dist > bound) continue;
          const childIndex = indices[pos >> 2] | 0;
          if (isLeafLevel) {
            if (filterFn === void 0 || filterFn(childIndex)) {
              q.push(childIndex << 1 | 1, dist);
              if (trackNearest && dist < bound) bound = dist;
            }
          } else {
            q.push(childIndex << 1, dist);
          }
        }
      }
      q.clear();
      return results;
    }
  };
  function upperBound(value, arr) {
    let i = 0;
    let j = arr.length - 1;
    while (i < j) {
      const m = i + j >> 1;
      if (arr[m] > value) {
        j = m;
      } else {
        i = m + 1;
      }
    }
    return arr[i];
  }
  function sort(values, boxes, indices, left, right, nodeSize) {
    const stack = [left, right];
    while (stack.length) {
      const r = stack.pop() || 0;
      const l = stack.pop() || 0;
      if (r - l <= nodeSize && Math.floor(l / nodeSize) >= Math.floor(r / nodeSize)) continue;
      const a = values[l];
      const b = values[l + r >> 1];
      const c = values[r];
      const pivot = a > b !== a > c ? a : b < a !== b < c ? b : c;
      let i = l - 1;
      let j = r + 1;
      while (true) {
        do
          i++;
        while (values[i] < pivot);
        do
          j--;
        while (values[j] > pivot);
        if (i >= j) break;
        swap(values, boxes, indices, i, j);
      }
      stack.push(l, j, j + 1, r);
    }
  }
  function swap(values, boxes, indices, i, j) {
    const temp = values[i];
    values[i] = values[j];
    values[j] = temp;
    const k = 4 * i;
    const m = 4 * j;
    const a = boxes[k];
    const b = boxes[k + 1];
    const c = boxes[k + 2];
    const d = boxes[k + 3];
    boxes[k] = boxes[m];
    boxes[k + 1] = boxes[m + 1];
    boxes[k + 2] = boxes[m + 2];
    boxes[k + 3] = boxes[m + 3];
    boxes[m] = a;
    boxes[m + 1] = b;
    boxes[m + 2] = c;
    boxes[m + 3] = d;
    const e = indices[i];
    indices[i] = indices[j];
    indices[j] = e;
  }
  function hilbert(x, y) {
    let a = x ^ y;
    let b = 65535 ^ a;
    let c = 65535 ^ (x | y);
    let d = x & (y ^ 65535);
    let A = a | b >> 1;
    let B = a >> 1 ^ a;
    let C = c ^ (c >> 1 ^ b & d >> 1);
    let D = d ^ (a & c >> 1 ^ d >> 1);
    a = A & A >> 2 ^ B & B >> 2;
    b = A & B >> 2 ^ B & (A ^ B) >> 2;
    c = C ^ (A & C >> 2 ^ B & D >> 2);
    d = D ^ (B & C >> 2 ^ (A ^ B) & D >> 2);
    A = a & a >> 4 ^ b & b >> 4;
    B = a & b >> 4 ^ b & (a ^ b) >> 4;
    C = c ^ (a & c >> 4 ^ b & d >> 4);
    D = d ^ (b & c >> 4 ^ (a ^ b) & d >> 4);
    c = C ^ (A & C >> 8 ^ B & D >> 8);
    d = D ^ (B & C >> 8 ^ (A ^ B) & D >> 8);
    c ^= c >> 1;
    d ^= d >> 1;
    a = x ^ y;
    b = d | 65535 ^ (a | c);
    a = (a | a << 8) & 16711935;
    a = (a | a << 4) & 252645135;
    a = (a | a << 2) & 858993459;
    a = (a | a << 1) & 1431655765;
    b = (b | b << 8) & 16711935;
    b = (b | b << 4) & 252645135;
    b = (b | b << 2) & 858993459;
    b = (b | b << 1) & 1431655765;
    return ((b << 1 | a) >>> 0) - 2147483648;
  }

  // srcts/index.ts
  function rectsIntersect(a, b) {
    return a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0;
  }
  function distToBbox(x, y, b) {
    const dx = Math.max(b.x0 - x, 0, x - b.x1);
    const dy = Math.max(b.y0 - y, 0, y - b.y1);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function hasBbox(e) {
    return typeof e.x0 === "number" && typeof e.y0 === "number";
  }
  function isRoundMark(mark) {
    return mark === "point" || mark === "points" || mark === "circle" || mark === "circles";
  }
  function distToSegment2(x, y, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay;
    const len2 = vx * vx + vy * vy;
    let t = len2 > 0 ? ((x - ax) * vx + (y - ay) * vy) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = x - (ax + t * vx), dy = y - (ay + t * vy);
    return dx * dx + dy * dy;
  }
  function distToGeom(x, y, g, gx, gy, box) {
    const at = g.at, n = g.n;
    if (n <= 0) return Infinity;
    if (g.kind === "point") {
      const dx = x - gx[at], dy = y - gy[at];
      const d = Math.sqrt(dx * dx + dy * dy);
      const r = box ? Math.min(box.x1 - box.x0, box.y1 - box.y0) / 2 : 0;
      return d > r ? d - r : 0;
    }
    if (n === 1) {
      const dx = x - gx[at], dy = y - gy[at];
      return Math.sqrt(dx * dx + dy * dy);
    }
    if (g.kind === "rect" || g.kind === "text" || g.kind === "roundrect") {
      return distToBbox(x, y, {
        x0: Math.min(gx[at], gx[at + 1]),
        x1: Math.max(gx[at], gx[at + 1]),
        y0: Math.min(gy[at], gy[at + 1]),
        y1: Math.max(gy[at], gy[at + 1])
      });
    }
    const closed = g.kind === "polygon" || g.kind === "path";
    if (closed && n >= 3) {
      let inside = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = gx[at + i], yi = gy[at + i];
        const xj = gx[at + j], yj = gy[at + j];
        if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) return 0;
    }
    let best = Infinity;
    for (let i = 1; i < n; i++) {
      const d2 = distToSegment2(x, y, gx[at + i - 1], gy[at + i - 1], gx[at + i], gy[at + i]);
      if (d2 < best) best = d2;
    }
    if (closed && n >= 3) {
      const d2 = distToSegment2(x, y, gx[at + n - 1], gy[at + n - 1], gx[at], gy[at]);
      if (d2 < best) best = d2;
    }
    return Math.sqrt(best);
  }
  function asColumn(v) {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }
  function normalizeElements(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw;
    const c = raw;
    const key = asColumn(c.key);
    const n = key.length;
    if (!n) return [];
    const x0 = asColumn(c.x0);
    const y0 = asColumn(c.y0);
    const x1 = asColumn(c.x1);
    const y1 = asColumn(c.y1);
    const mark = c.mark != null ? asColumn(c.mark) : null;
    const tooltip = c.tooltip != null ? asColumn(c.tooltip) : null;
    const hoverGroup = c.hover_group != null ? asColumn(c.hover_group) : null;
    const hoverColor = c.hover_color != null ? asColumn(c.hover_color) : null;
    const selectedColor = c.selected_color != null ? asColumn(c.selected_color) : null;
    const legendFor = c.legend_for != null ? asColumn(c.legend_for) : null;
    const legend = c.legend != null ? asColumn(c.legend) : null;
    const filterValue = c.filter_value != null ? asColumn(c.filter_value) : null;
    const cond = c.cond != null ? asColumn(c.cond) : null;
    const filt = c.filt != null ? asColumn(c.filt) : null;
    const join = c.join != null ? asColumn(c.join) : null;
    const source = c.source != null ? asColumn(c.source) : null;
    const target = c.target != null ? asColumn(c.target) : null;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const e = { key: String(key[i]) };
      if (mark && mark[i] != null) e.mark = String(mark[i]);
      if (typeof x0[i] === "number") e.x0 = x0[i];
      if (typeof y0[i] === "number") e.y0 = y0[i];
      if (typeof x1[i] === "number") e.x1 = x1[i];
      if (typeof y1[i] === "number") e.y1 = y1[i];
      if (tooltip && tooltip[i] != null) e.tooltip = String(tooltip[i]);
      if (hoverGroup && hoverGroup[i] != null) e.hover_group = String(hoverGroup[i]);
      if (hoverColor && hoverColor[i] != null) e.hover_color = String(hoverColor[i]);
      if (selectedColor && selectedColor[i] != null) e.selected_color = String(selectedColor[i]);
      if (legendFor && legendFor[i] != null) e.legend_for = String(legendFor[i]);
      if (legend) {
        const v = legend[i];
        if (v != null && !(Array.isArray(v) && v.length === 0)) e.legend = v;
      }
      if (filterValue && typeof filterValue[i] === "number") e.filter_value = filterValue[i];
      if (cond) {
        const v = cond[i];
        if (v != null && !(Array.isArray(v) && v.length === 0)) {
          e.cond = Array.isArray(v) ? v : [String(v)];
        }
      }
      if (filt) {
        const v = filt[i];
        if (v != null && !(Array.isArray(v) && v.length === 0)) {
          e.filt = Array.isArray(v) ? v : [String(v)];
        }
      }
      if (join && join[i] != null) e.join = String(join[i]);
      if (source && source[i] != null) e.source = String(source[i]);
      if (target && target[i] != null) e.target = String(target[i]);
      out[i] = e;
    }
    return out;
  }
  function normalizePanels(raw) {
    if (raw == null) return [];
    return Array.isArray(raw) ? raw : [raw];
  }
  function brushKeys(elems, brush) {
    const out = [];
    const seen = {};
    for (let i = 0; i < elems.length; i++) {
      const e = elems[i];
      if (hasBbox(e) && rectsIntersect(e, brush) && !seen[e.key]) {
        seen[e.key] = true;
        out.push(e.key);
      }
    }
    return out;
  }
  function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function lassoKeys(elems, poly) {
    const out = [];
    const seen = {};
    if (poly.length < 3) return out;
    for (let i = 0; i < elems.length; i++) {
      const e = elems[i];
      if (!hasBbox(e) || seen[e.key]) continue;
      if (pointInPolygon((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2, poly)) {
        seen[e.key] = true;
        out.push(e.key);
      }
    }
    return out;
  }
  function polyBounds(poly) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      if (poly[i].x < x0) x0 = poly[i].x;
      if (poly[i].y < y0) y0 = poly[i].y;
      if (poly[i].x > x1) x1 = poly[i].x;
      if (poly[i].y > y1) y1 = poly[i].y;
    }
    return { x0, y0, x1, y1 };
  }
  function nearestKey(elems, x, y, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (let i = 0; i < elems.length; i++) {
      const e = elems[i];
      if (!hasBbox(e)) continue;
      const d = distToBbox(x, y, e);
      if (d <= bestD) {
        bestD = d;
        best = e.key;
      }
    }
    return best;
  }
  function nearestSortedIdx(sorted, target) {
    const n = sorted.length;
    if (!n) return -1;
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (sorted[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0 && Math.abs(sorted[lo - 1] - target) <= Math.abs(sorted[lo] - target)) return lo - 1;
    return lo;
  }
  function columnTolerance(sorted) {
    let minGap = Infinity;
    for (let i = 1; i < sorted.length; i++) {
      const g = sorted[i] - sorted[i - 1];
      if (g > 1e-6 && g < minGap) minGap = g;
    }
    return isFinite(minGap) ? minGap / 2 : 1;
  }
  var INVERTIBLE = { identity: true, log10: true, sqrt: true, reverse: true };
  var GLYPH_MARKS = { point: true, circle: true, hexagon: true, sector: true };
  function canInvert(ax) {
    return !!ax && INVERTIBLE[ax.transform] === true;
  }
  function nativeToData(ax, nv) {
    switch (ax.transform) {
      case "log10":
        return Math.pow(10, nv);
      case "sqrt":
        return nv * nv;
      case "reverse":
        return nv;
      // identity map; the reversal is the decreasing domain
      default:
        return nv;
    }
  }
  function pxToDataX(p, px) {
    const ax = p.x;
    if (!canInvert(ax) || p.px1 === p.px0) return null;
    const nv = ax.native_lo + (px - p.px0) / (p.px1 - p.px0) * (ax.native_hi - ax.native_lo);
    return nativeToData(ax, nv);
  }
  function pxToDataY(p, py) {
    const ax = p.y;
    if (!canInvert(ax) || p.py1 === p.py0) return null;
    const frac = (py - p.py0) / (p.py1 - p.py0);
    const nv = ax.native_hi + frac * (ax.native_lo - ax.native_hi);
    return nativeToData(ax, nv);
  }
  function zoomViewBox(vb, factor, cx, cy) {
    const w = vb.w / factor;
    const h = vb.h / factor;
    return { x: cx - (cx - vb.x) / factor, y: cy - (cy - vb.y) / factor, w, h };
  }
  function parseViewBox(s) {
    if (!s) return null;
    const p = s.trim().split(/[ ,]+/).map(Number);
    if (p.length !== 4 || p.some((n) => !isFinite(n))) return null;
    return { x: p[0], y: p[1], w: p[2], h: p[3] };
  }
  function fmtViewBox(vb) {
    return vb.x + " " + vb.y + " " + vb.w + " " + vb.h;
  }
  function isZoomedIn(vb, vb0) {
    return vb.w < vb0.w * 0.999 || vb.h < vb0.h * 0.999;
  }
  function userToCanvas(vb, cw, ch, x, y) {
    return { px: (x - vb.x) / vb.w * cw, py: (y - vb.y) / vb.h * ch };
  }
  function viewToPan(vb, vb0) {
    const sx = vb.w ? vb0.w / vb.w : 1;
    const sy = vb.h ? vb0.h / vb.h : 1;
    return { sx, sy, tx: vb0.x - vb.x * sx, ty: vb0.y - vb.y * sy };
  }
  function panToView(vb, vb0, x, y) {
    const t = viewToPan(vb, vb0);
    return { x: t.sx ? vb.x + (x - vb0.x) / t.sx : x, y: t.sy ? vb.y + (y - vb0.y) / t.sy : y };
  }
  function niceTicks(lo, hi, count) {
    if (!isFinite(lo) || !isFinite(hi) || hi <= lo || count < 1) return [];
    const step0 = (hi - lo) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) {
      out.push(Math.round(v / step) * step);
    }
    return out;
  }
  function fmtTick(v, step) {
    if (v === 0) return "0";
    const decimals = Math.min(20, Math.max(0, -Math.floor(Math.log10(Math.abs(step)) + 1e-9)));
    let s = v.toFixed(decimals);
    if (s.indexOf(".") >= 0) s = s.replace(/\.?0+$/, "");
    return s;
  }
  function dataToNative(ax, d) {
    switch (ax.transform) {
      case "log10":
        return Math.log10(d);
      case "sqrt":
        return Math.sqrt(d);
      default:
        return d;
    }
  }
  function unionBbox(elems, keys) {
    let out = null;
    for (let i = 0; i < elems.length; i++) {
      const e = elems[i];
      if (!hasBbox(e) || !keys[e.key]) continue;
      if (!out) out = { x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1 };
      else {
        out.x0 = Math.min(out.x0, e.x0);
        out.y0 = Math.min(out.y0, e.y0);
        out.x1 = Math.max(out.x1, e.x1);
        out.y1 = Math.max(out.y1, e.y1);
      }
    }
    return out;
  }
  var STYLE_ID = "vellumwidget-style";
  var VELLUMWIDGET_CSS = `
.vellumwidget-root { position: relative; display: inline-block; max-width: 100%; }
/* The stage shrink-wraps the base svg in BOTH dimensions (inline-block sizes to
   content), so its box equals the svg's rendered box. The absolute overlays below
   fill THIS box, not the root's \u2014 the root can be taller AND wider than the svg
   (htmlwidgets stamps an explicit height; a fluid layout can stretch the width),
   and sizing the overlays to the root would letterbox their viewBox and shift
   every ring (down if the root is taller, sideways if it is wider). */
.vellumwidget-root .vellumwidget-stage { position: relative; display: inline-block; }
.vellumwidget-root .vellumwidget-svg-holder svg { max-width: 100%; height: auto; display: block; }
.vellumwidget-gesture .vellumwidget-svg-holder svg { touch-action: none; }
.vellumwidget-root.vellumwidget-mode-pan .vellumwidget-svg-holder svg { cursor: grab; }
.vellumwidget-root.vellumwidget-panning .vellumwidget-svg-holder svg { cursor: grabbing; }
.vellumwidget-root [data-key] { cursor: pointer; }
[data-key].vellumwidget-filtered { display: none; }
/* Legend click-to-hide / -mute (independent of the crosstalk cross-filter above,
   so the two never clobber each other). hidden removes the series' marks; muted
   keeps them but fades them right back; legend-off dims the toggled-off swatch
   so the legend shows which series are on. */
[data-key].vellumwidget-legend-hidden { display: none; }
[data-key].vellumwidget-legend-muted { opacity: 0.12; }
[data-key].vellumwidget-legend.vellumwidget-legend-off { opacity: 0.4; }
.vellumwidget-hovering [data-key]:not(.vellumwidget-legend) { opacity: var(--vellumwidget-dim-opacity, 0.28); }
.vellumwidget-hovering [data-key].vellumwidget-hl { opacity: 1; }
/* Conditional encoding (condition()): a non-member of an active selection with no
   explicit if_false is dimmed to the theme's dim opacity (the spotlight). An
   explicit if_false colour is applied inline (see applyConditions()). */
[data-key].vellumwidget-cond-dim { opacity: var(--vellumwidget-dim-opacity, 0.28); }
/* Large-scene hover: instead of the CSS rule above restyling every keyed node
   (O(n) per hover), the whole plot is dimmed once via the holder's opacity and the
   hovered marks are re-drawn crisp in this overlay (O(hovered)). See setHover(). */
.vellumwidget-root .vellumwidget-svg-holder { transition: none; }
/* Crisp-zoom point layer: above the base image, below the overlay rings. Never
   intercepts hit-testing (that stays on the base svg). Hidden until zoomed in. */
.vellumwidget-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 2; display: none;
}
.vellumwidget-dim-layer {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 5; overflow: visible;
}
/* Continuous colorbar filter: an overlay on the gradient bar. The dim rects cover
   the out-of-range ends; the handles are draggable. Out-of-range marks fade. */
.vellumwidget-colorbar-layer {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 6; overflow: visible;
}
.vellumwidget-cb-dim { fill: rgba(255,255,255,0.66); pointer-events: none; }
@media (prefers-color-scheme: dark) { .vellumwidget-cb-dim { fill: rgba(17,24,39,0.66); } }
.vellumwidget-cb-handle {
  fill: #ffffff; stroke: #2563eb; stroke-width: 1.5px; pointer-events: auto;
}
.vellumwidget-root.vellumwidget-cb-v .vellumwidget-cb-handle { cursor: ns-resize; }
.vellumwidget-root.vellumwidget-cb-h .vellumwidget-cb-handle { cursor: ew-resize; }
[data-key].vellumwidget-colorfiltered { opacity: var(--vellumwidget-colorfilter-opacity, 0.12); }
/* Crosshair guide rule(s) for unified hover \u2014 above the base image / canvas,
   below the highlight rings so a highlighted mark still reads on top. */
.vellumwidget-crosshair-layer {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 4; overflow: visible;
}
/* Axis-aware zoom: re-ticked axis LABELS overlay (gridlines are drawn inside the
   base svg's panel, under the marks). Pinned to the fixed base coordinate space. */
.vellumwidget-retick-layer {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 3; overflow: visible;
}
.vellumwidget-crosshair-line {
  stroke: var(--vellumwidget-crosshair-stroke, rgba(75,85,99,0.85));
  stroke-width: 1px; stroke-dasharray: 4 3;
}
@media (prefers-color-scheme: dark) {
  .vellumwidget-crosshair-line { stroke: var(--vellumwidget-crosshair-stroke, rgba(209,213,219,0.85)); }
}
/* Raster-mode feedback rings (hover / selection), drawn on the overlay since the
   marks are a base image with no per-element nodes. Colours reuse the same CSS
   variables as the SVG-mode highlight/selection so theming carries over. */
.vellumwidget-fb-hov { fill: none; stroke: var(--vellumwidget-hl-stroke, #2563eb); stroke-width: 2px; }
.vellumwidget-fb-sel { fill: none; stroke: var(--vellumwidget-selected-stroke, #111827); stroke-width: 1.6px; }
@media (prefers-color-scheme: dark) {
  .vellumwidget-fb-sel { stroke: var(--vellumwidget-selected-stroke, #f9fafb); }
}
/* Optional hover stroke, opt-in per element (.vellumwidget-hc) or widget-wide
   (.vellumwidget-hc-all on the root). Never applied to a mark that has no hover colour,
   so a bordered shape is not clobbered on hover. Colour resolves from the nearest
   --vellumwidget-hl-stroke (element var overrides the root var). */
.vellumwidget-hc-all [data-key].vellumwidget-hl, [data-key].vellumwidget-hc.vellumwidget-hl {
  stroke: var(--vellumwidget-hl-stroke); stroke-width: var(--vellumwidget-hl-width, 2px); paint-order: stroke fill;
}
[data-key].vellumwidget-selected {
  stroke: var(--vellumwidget-selected-stroke, #111827);
  stroke-width: var(--vellumwidget-selected-width, 1.4px); paint-order: stroke fill;
}
/* Keyboard focus ring on the currently-traversed mark (a11y). */
[data-key].vellumwidget-focus {
  stroke: var(--vellumwidget-focus-stroke, #2563eb);
  stroke-width: var(--vellumwidget-focus-width, 2.5px); paint-order: stroke fill;
}
[data-key]:focus { outline: none; }
[data-key]:focus-visible { outline: 2px solid var(--vellumwidget-focus-stroke, #2563eb); outline-offset: 1px; }
/* Visually-hidden but exposed to assistive technology (live region + data table). */
.vellumwidget-sr-only {
  position: absolute !important; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden; border: 0;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
}
.vellumwidget-tip {
  position: absolute; left: 0; top: 0; pointer-events: none; z-index: 20;
  background: var(--vellumwidget-tip-bg, rgba(17,24,39,0.94)); color: var(--vellumwidget-tip-fg, #fff);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: var(--vellumwidget-tip-fontsize, 12px); line-height: 1.45;
  padding: 5px 8px; border-radius: 5px; white-space: pre-wrap;
  max-width: var(--vellumwidget-tip-maxwidth, 320px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  opacity: 0; transition: opacity 0.08s ease; will-change: transform;
}
.vellumwidget-tip.vellumwidget-show { opacity: 1; }
/* Sticky tooltip: accepts pointer events so links/buttons inside it are usable. */
.vellumwidget-tip.vellumwidget-tip-sticky { pointer-events: auto; }
.vellumwidget-brush {
  position: absolute; pointer-events: none; z-index: 15;
  border: 1px solid #2563eb; background: rgba(37,99,235,0.12); display: none;
}
/* Overview navigator: a full-width strip below the plot (a squashed mini-render
   of the whole scene) with a draggable/resizable window marking the visible x-range. */
.vellumwidget-nav {
  position: relative; width: 100%; margin-top: 4px; box-sizing: border-box;
  border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; overflow: hidden;
  background: rgba(0,0,0,0.02); touch-action: none; user-select: none;
}
.vellumwidget-nav-mini { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.85; }
.vellumwidget-nav-mini svg { width: 100%; height: 100%; display: block; }
/* The two regions outside the window are dimmed; the window itself is clear. */
.vellumwidget-nav-window {
  position: absolute; top: 0; bottom: 0; z-index: 2; cursor: grab;
  border-left: 1px solid #2563eb; border-right: 1px solid #2563eb;
  background: rgba(37,99,235,0.10); box-shadow: 0 0 0 100vmax rgba(0,0,0,0.12);
}
.vellumwidget-nav-window.vellumwidget-nav-grabbing { cursor: grabbing; }
.vellumwidget-nav-handle {
  position: absolute; top: 0; bottom: 0; width: 8px; z-index: 3; cursor: ew-resize;
  background: #2563eb; opacity: 0.35;
}
.vellumwidget-nav-handle-l { left: -1px; }
.vellumwidget-nav-handle-r { right: -1px; }
@media (prefers-color-scheme: dark) {
  .vellumwidget-nav { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.03); }
}
.vellumwidget-root.vellumwidget-mode-lasso .vellumwidget-svg-holder svg { cursor: crosshair; }
.vellumwidget-lasso {
  fill: rgba(37,99,235,0.10); stroke: #2563eb; stroke-width: 1px; stroke-dasharray: 4 3;
}
.vellumwidget-toolbar {
  position: absolute; top: 6px; right: 6px; z-index: 25; display: flex; gap: 2px;
  padding: 3px; border-radius: 6px; background: rgba(255,255,255,0.82);
  box-shadow: 0 1px 4px rgba(0,0,0,0.18); opacity: 0; transition: opacity 0.12s;
}
.vellumwidget-root:hover .vellumwidget-toolbar { opacity: 1; }
.vellumwidget-toolbar button {
  border: 0; background: transparent; cursor: pointer; border-radius: 4px;
  font: 13px/1 system-ui, sans-serif; padding: 4px 6px; color: #111827;
}
.vellumwidget-toolbar button:hover { background: rgba(0,0,0,0.08); }
.vellumwidget-toolbar button.vellumwidget-active { background: rgba(37,99,235,0.18); }
@media (prefers-color-scheme: dark) {
  .vellumwidget-tip { background: var(--vellumwidget-tip-bg, rgba(243,244,246,0.96)); color: var(--vellumwidget-tip-fg, #111827); }
  [data-key].vellumwidget-selected { stroke: var(--vellumwidget-selected-stroke, #f9fafb); }
  .vellumwidget-toolbar { background: rgba(31,41,55,0.9); }
  .vellumwidget-toolbar button { color: #f3f4f6; }
  .vellumwidget-toolbar button:hover { background: rgba(255,255,255,0.12); }
}
`;
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = VELLUMWIDGET_CSS;
    document.head.appendChild(s);
  }
  function cssEscape(value) {
    const anyCss = window.CSS;
    if (anyCss && typeof anyCss.escape === "function") return anyCss.escape(value);
    return value.replace(/["\\\]\[#.:;,()>~+*^$|=@!%&{}\/\s]/g, "\\$&");
  }
  var TIP_TAGS = ["b", "i", "em", "strong", "br", "span"];
  function sanitizeTip(s) {
    let out = String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    for (const t of TIP_TAGS) {
      out = out.replace(new RegExp("&lt;" + t + "&gt;", "gi"), "<" + t + ">").replace(new RegExp("&lt;/" + t + "&gt;", "gi"), "</" + t + ">").replace(new RegExp("&lt;" + t + "\\s*/&gt;", "gi"), "<" + t + ">");
    }
    return out;
  }
  function stripTags(s) {
    return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  function keyOf(target) {
    const el = target;
    if (!el || typeof el.closest !== "function") return null;
    const hit = el.closest("[data-key]");
    return hit ? hit.getAttribute("data-key") : null;
  }
  function vellumIdOf(target) {
    const el = target;
    if (!el || typeof el.closest !== "function") return null;
    const hit = el.closest("[data-vellum-id]");
    return hit ? hit.getAttribute("data-vellum-id") : null;
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  var DRAG_THRESHOLD = 3;
  var vellumwidgetBus = {};
  function busJoin(group, m) {
    (vellumwidgetBus[group] = vellumwidgetBus[group] || []).push(m);
  }
  function busPublish(group, sender, keys) {
    const members = vellumwidgetBus[group] || [];
    for (let i = 0; i < members.length; i++) {
      if (members[i].token !== sender) members[i].onSelect(keys);
    }
  }
  function busPublishView(group, sender, v) {
    const members = vellumwidgetBus[group] || [];
    for (let i = 0; i < members.length; i++) {
      if (members[i].token !== sender && members[i].onView) members[i].onView(v);
    }
  }
  function getCrosstalk() {
    return window.crosstalk || null;
  }
  HTMLWidgets.widget({
    name: "vellumwidget",
    type: "output",
    factory: function(el) {
      ensureStyle();
      el.classList.add("vellumwidget-root");
      const tip = document.createElement("div");
      tip.className = "vellumwidget-tip";
      const brushBox = document.createElement("div");
      brushBox.className = "vellumwidget-brush";
      let holder = null;
      let stage = null;
      let svgEl = null;
      let toolbarEl = null;
      let navEl = null;
      let navWindow = null;
      let colorbar = null;
      let colorbarLayer = null;
      let interactions = null;
      let provenance = null;
      let condTagElems = {};
      let filtSelElems = {};
      let joinOf = {};
      let lastHoverKeys = [];
      let colorRange = null;
      let colorHiddenSet = {};
      let meta = {};
      let groups = {};
      let incidentEdges = {};
      let neighbourNodes = {};
      let edgeEndpoints = {};
      let neighbourExpand = null;
      let legendIndex = {};
      let legendSwatch = {};
      let legendOff = {};
      let hiddenKeySet = {};
      let filteredKeySet = {};
      let elements = [];
      let panels = [];
      let selected = {};
      let nodesByKey = {};
      let hoverRAF = 0;
      let spatialIndex = null;
      let indexToElem = [];
      let geomByKey = {};
      let gx = new Float64Array(0);
      let gy = new Float64Array(0);
      let haveGeometry = false;
      const DIM_OVERLAY_MIN = 2e3;
      let largeDim = false;
      let dimLayer = null;
      let crosshairLayer = null;
      let sortedCx = [];
      let sortedCxKeys = [];
      let sortedCy = [];
      let sortedCyKeys = [];
      let tolX = 1;
      let tolY = 1;
      let rasterMode = false;
      let selGroup = null;
      let hovGroup = null;
      let canvasEl = null;
      let ctx = null;
      let ptCx = null;
      let ptCy = null;
      let ptRad = null;
      let ptRGB = null;
      let ptN = 0;
      const OVERLAY_MARK_CAP = 2e3;
      let opts = {
        tooltip: true,
        hover: true,
        select: true,
        brush: true,
        lasso: true,
        zoom: true,
        toolbar: true,
        nearest: true,
        a11y: true,
        selectMode: "multiple",
        hoverMode: "closest",
        crosshair: false,
        navigator: false
      };
      let liveRegion = null;
      let tableEl = null;
      let focusables = [];
      let focusIdx = -1;
      let vb0 = null;
      let vb = null;
      let panGroup = null;
      let outerPanelGroup = null;
      let axisPanel = null;
      let axisZoomActive = false;
      let retickLayer = null;
      let retickGrid = null;
      let xZoom = false;
      const axisStyle = {
        // presentation scraped from vellum's own axis/grid nodes so the re-tick matches the theme
        textFill: "#333333",
        fontFamily: "sans-serif",
        fontSize: 12,
        gridStroke: "#ffffff",
        gridWidth: 1,
        xBaselineY: 0,
        yLabelX: 0
        // device-px placement of the x/y tick labels
      };
      let mode = "brush";
      let lastBrush = null;
      let lassoPts = [];
      let lassoEl = null;
      const selfToken = {};
      let group = null;
      let receivingView = false;
      let joined = false;
      let ctSel = null;
      let ctFilt = null;
      function currentViewBox() {
        if (vb) return vb;
        const parsed = svgEl ? parseViewBox(svgEl.getAttribute("viewBox")) : null;
        if (parsed) return parsed;
        const r = (svgEl || el).getBoundingClientRect();
        return { x: 0, y: 0, w: r.width || 1, h: r.height || 1 };
      }
      function toUser(clientX, clientY) {
        const r = (svgEl || el).getBoundingClientRect();
        const view = currentViewBox();
        const fx = r.width ? (clientX - r.left) / r.width : 0;
        const fy = r.height ? (clientY - r.top) / r.height : 0;
        return { x: view.x + fx * view.w, y: view.y + fy * view.h };
      }
      function toView(clientX, clientY) {
        const u = toUser(clientX, clientY);
        if (axisZoomActive && vb && vb0) return panToView(vb, vb0, u.x, u.y);
        return u;
      }
      function calibrateXform() {
        let xi = null, xj = null;
        let yi = null, yj = null;
        for (let i = 0; i < elements.length; i++) {
          const e = elements[i];
          if (!hasBbox(e)) continue;
          const scx = (e.x0 + e.x1) / 2, scy = (e.y0 + e.y1) / 2;
          if (!xi || scx < (xi.x0 + xi.x1) / 2) xi = e;
          if (!xj || scx > (xj.x0 + xj.x1) / 2) xj = e;
          if (!yi || scy < (yi.y0 + yi.y1) / 2) yi = e;
          if (!yj || scy > (yj.y0 + yj.y1) / 2) yj = e;
        }
        if (!xi || !xj || !yi || !yj) return null;
        const scr = (e) => {
          const n = elementsForKey(e.key)[0];
          if (!n) return null;
          const r = n.getBoundingClientRect();
          if (!r.width && !r.height) return null;
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        };
        const xa = scr(xi), xb = scr(xj), ya = scr(yi), yb = scr(yj);
        if (!xa || !xb || !ya || !yb) return null;
        const dScx = (xj.x0 + xj.x1) / 2 - (xi.x0 + xi.x1) / 2;
        const dScrx = xb.x - xa.x;
        const dScy = (yj.y0 + yj.y1) / 2 - (yi.y0 + yi.y1) / 2;
        const dScry = yb.y - ya.y;
        if (Math.abs(dScrx) < 1 || Math.abs(dScry) < 1) return null;
        const sx = dScx / dScrx, ox = (xi.x0 + xi.x1) / 2 - xa.x * sx;
        const sy = dScy / dScry, oy = (yi.y0 + yi.y1) / 2 - ya.y * sy;
        return { sx, ox, sy, oy };
      }
      function clientToScene(clientX, clientY) {
        const f = calibrateXform();
        if (!f) return toView(clientX, clientY);
        return { x: f.ox + clientX * f.sx, y: f.oy + clientY * f.sy };
      }
      function elementsForKey(k) {
        const cached = nodesByKey[k];
        if (cached) return cached;
        if (!holder) return [];
        return Array.prototype.slice.call(holder.querySelectorAll('[data-key="' + cssEscape(k) + '"]'));
      }
      function addClassForKeys(keys, cls) {
        for (let i = 0; i < keys.length; i++) {
          const nodes = elementsForKey(keys[i]);
          for (let j = 0; j < nodes.length; j++) nodes[j].classList.add(cls);
        }
      }
      function clearClass(cls) {
        if (!holder) return;
        const nodes = holder.querySelectorAll("." + cls);
        for (let i = 0; i < nodes.length; i++) nodes[i].classList.remove(cls);
      }
      function graphNeighbourhood(k, degree, edges) {
        const seen = { [k]: true };
        const out = [k];
        let frontier = [k];
        for (let d = 0; d < degree; d++) {
          const next = [];
          for (let i = 0; i < frontier.length; i++) {
            const u = frontier[i];
            if (edges) {
              const inc = incidentEdges[u] || [];
              for (let j = 0; j < inc.length; j++) {
                if (!seen[inc[j]]) {
                  seen[inc[j]] = true;
                  out.push(inc[j]);
                }
              }
            }
            const nb = neighbourNodes[u] || [];
            for (let j = 0; j < nb.length; j++) {
              if (!seen[nb[j]]) {
                seen[nb[j]] = true;
                out.push(nb[j]);
                next.push(nb[j]);
              }
            }
          }
          frontier = next;
        }
        return out;
      }
      function linkedKeys(k) {
        const m = meta[k];
        if (m && m.legend_for != null) return (legendIndex[m.legend_for] || []).concat([k]);
        if (neighbourExpand) {
          const ep = edgeEndpoints[k];
          if (ep) return [k, ep[0], ep[1]];
          if (incidentEdges[k] || neighbourNodes[k]) {
            return graphNeighbourhood(k, neighbourExpand.degree, neighbourExpand.edges);
          }
        }
        const g = m && m.hover_group;
        return g && groups[g] ? groups[g] : [k];
      }
      function legendPolicy() {
        return opts.legendClick || "select";
      }
      function swatchSeries(k) {
        if (k == null) return null;
        const m = meta[k];
        return m && m.legend_for != null ? m.legend_for : null;
      }
      function applyLegend() {
        clearClass("vellumwidget-legend-hidden");
        clearClass("vellumwidget-legend-muted");
        clearClass("vellumwidget-legend-off");
        hiddenKeySet = {};
        const pol = legendPolicy();
        if (pol === "select") return;
        const cls = pol === "mute" ? "vellumwidget-legend-muted" : "vellumwidget-legend-hidden";
        for (const s in legendOff) {
          if (!legendOff[s]) continue;
          const members = legendIndex[s] || [];
          addClassForKeys(members, cls);
          if (pol === "hide") for (let i = 0; i < members.length; i++) hiddenKeySet[members[i]] = true;
          addClassForKeys(legendSwatch[s] || [], "vellumwidget-legend-off");
        }
      }
      function legendToggle(series) {
        legendOff[series] = !legendOff[series];
        applyLegend();
      }
      function legendIsolate(series) {
        const all = Object.keys(legendIndex);
        const others = all.filter((s) => s !== series);
        const isolated = !legendOff[series] && others.every((s) => legendOff[s]);
        legendOff = {};
        if (!isolated) for (let i = 0; i < others.length; i++) legendOff[others[i]] = true;
        applyLegend();
      }
      function buildSpatialIndex() {
        spatialIndex = null;
        indexToElem = [];
        let count = 0;
        for (let i = 0; i < elements.length; i++) if (hasBbox(elements[i])) count++;
        if (!count) return;
        const idx = new Flatbush(count);
        for (let i = 0; i < elements.length; i++) {
          const e = elements[i];
          if (!hasBbox(e)) continue;
          idx.add(e.x0, e.y0, e.x1, e.y1);
          indexToElem.push(i);
        }
        idx.finish();
        spatialIndex = idx;
      }
      function buildGeometry(g) {
        geomByKey = {};
        gx = new Float64Array(0);
        gy = new Float64Array(0);
        haveGeometry = false;
        if (!g) return;
        const keys = asColumn(g.key);
        const kinds = asColumn(g.kind);
        const ns = asColumn(g.n);
        const xs = asColumn(g.x);
        const ys = asColumn(g.y);
        if (!keys.length || xs.length !== ys.length) return;
        gx = Float64Array.from(xs);
        gy = Float64Array.from(ys);
        let at = 0;
        for (let i = 0; i < keys.length; i++) {
          const n = ns[i] | 0;
          if (n <= 0 || at + n > gx.length) break;
          (geomByKey[keys[i]] || (geomByKey[keys[i]] = [])).push({ kind: kinds[i], at, n });
          at += n;
        }
        haveGeometry = at > 0;
      }
      function distToElem(x, y, e) {
        const box = hasBbox(e) ? e : null;
        const gs = geomByKey[e.key];
        if (!gs) {
          if (!box) return Infinity;
          if (isRoundMark(e.mark)) {
            const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
            const r = Math.min(box.x1 - box.x0, box.y1 - box.y0) / 2;
            const dx = x - cx, dy = y - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            return d > r ? d - r : 0;
          }
          return distToBbox(x, y, box);
        }
        let best = Infinity;
        for (let i = 0; i < gs.length; i++) {
          const d = distToGeom(x, y, gs[i], gx, gy, box);
          if (d < best) best = d;
        }
        return best;
      }
      function buildHoverAxis() {
        const cx = [];
        const cy = [];
        for (let i = 0; i < elements.length; i++) {
          const e = elements[i];
          if (!hasBbox(e)) continue;
          cx.push({ c: (e.x0 + e.x1) / 2, k: e.key });
          cy.push({ c: (e.y0 + e.y1) / 2, k: e.key });
        }
        cx.sort((a, b) => a.c - b.c);
        cy.sort((a, b) => a.c - b.c);
        sortedCx = cx.map((p) => p.c);
        sortedCxKeys = cx.map((p) => p.k);
        sortedCy = cy.map((p) => p.c);
        sortedCyKeys = cy.map((p) => p.k);
        tolX = columnTolerance(sortedCx);
        tolY = columnTolerance(sortedCy);
      }
      function nearestAxisKey(axis, coord) {
        const sorted = axis === "x" ? sortedCx : sortedCy;
        const keys = axis === "x" ? sortedCxKeys : sortedCyKeys;
        const i = nearestSortedIdx(sorted, coord);
        return i >= 0 ? keys[i] : null;
      }
      function columnKeys(primary, axis) {
        const m = meta[primary];
        if (!m || !hasBbox(m)) return [primary];
        const cx = (m.x0 + m.x1) / 2;
        const cy = (m.y0 + m.y1) / 2;
        const SPAN = 1e7;
        const rect = axis === "x" ? { x0: cx - tolX, x1: cx + tolX, y0: -SPAN, y1: SPAN } : { x0: -SPAN, x1: SPAN, y0: cy - tolY, y1: cy + tolY };
        const ks = brushKeysIn(rect);
        return ks.length ? ks : [primary];
      }
      const PICK_CANDIDATES = 256;
      function nearestKeyAt(x, y, maxDist) {
        let best = null;
        let bestD = maxDist;
        const rank = (e) => {
          if (e.source != null && !geomByKey[e.key]) return;
          const d = distToElem(x, y, e);
          if (d <= bestD) {
            bestD = d;
            best = e.key;
          }
        };
        if (spatialIndex) {
          const ids = spatialIndex.neighbors(x, y, PICK_CANDIDATES, maxDist);
          for (let i = 0; i < ids.length; i++) rank(elements[indexToElem[ids[i]]]);
        } else {
          for (let i = 0; i < elements.length; i++) rank(elements[i]);
        }
        return best;
      }
      function brushKeysIn(rect) {
        if (!spatialIndex) return brushKeys(elements, rect);
        const eids = spatialIndex.search(rect.x0, rect.y0, rect.x1, rect.y1).map((id) => indexToElem[id]).sort((a, b) => a - b);
        const out = [];
        const seen = {};
        for (let i = 0; i < eids.length; i++) {
          const k = elements[eids[i]].key;
          if (!seen[k]) {
            seen[k] = true;
            out.push(k);
          }
        }
        return out;
      }
      function lassoKeysIn(poly) {
        if (poly.length < 3) return [];
        if (!spatialIndex) return lassoKeys(elements, poly);
        const b = polyBounds(poly);
        const eids = spatialIndex.search(b.x0, b.y0, b.x1, b.y1).map((id) => indexToElem[id]).sort((a, b2) => a - b2);
        const out = [];
        const seen = {};
        for (let i = 0; i < eids.length; i++) {
          const e = elements[eids[i]];
          if (seen[e.key] || !hasBbox(e)) continue;
          if (pointInPolygon((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2, poly)) {
            seen[e.key] = true;
            out.push(e.key);
          }
        }
        return out;
      }
      function dimOpacityVal() {
        const d = opts.style && opts.style.dimOpacity;
        return d == null || d === "" ? "0.28" : String(d);
      }
      function showHighlightOverlay(keys) {
        if (!holder || !dimLayer) return;
        holder.style.opacity = dimOpacityVal();
        while (dimLayer.firstChild) dimLayer.removeChild(dimLayer.firstChild);
        for (let i = 0; i < keys.length; i++) {
          const nodes = elementsForKey(keys[i]);
          for (let j = 0; j < nodes.length; j++) {
            const c = nodes[j].cloneNode(true);
            c.classList.add("vellumwidget-hl");
            dimLayer.appendChild(c);
          }
        }
      }
      function hideHighlightOverlay() {
        if (holder) holder.style.opacity = "";
        if (dimLayer) while (dimLayer.firstChild) dimLayer.removeChild(dimLayer.firstChild);
      }
      function ensureCanvas() {
        if (canvasEl) return;
        canvasEl = document.createElement("canvas");
        canvasEl.className = "vellumwidget-canvas";
        canvasEl.setAttribute("aria-hidden", "true");
        (stage || el).appendChild(canvasEl);
        ctx = typeof canvasEl.getContext === "function" ? canvasEl.getContext("2d") : null;
      }
      function clearPointData() {
        ptCx = ptCy = ptRad = null;
        ptRGB = null;
        ptN = 0;
        if (canvasEl) canvasEl.style.display = "none";
      }
      function sampleBaseRaster() {
        clearPointData();
        if (!rasterMode || !svgEl || !vb0) return;
        const imgNode = svgEl.querySelector("image");
        const href = imgNode && (imgNode.getAttribute("href") || imgNode.getAttribute("xlink:href"));
        if (!href) return;
        const off = document.createElement("canvas");
        const octx = typeof off.getContext === "function" ? off.getContext("2d") : null;
        if (!octx) return;
        const iw = Math.max(1, Math.round(vb0.w));
        const ih = Math.max(1, Math.round(vb0.h));
        const els = elements;
        const v0 = vb0;
        const img = new Image();
        img.onload = function() {
          if (els !== elements || v0 !== vb0) return;
          off.width = iw;
          off.height = ih;
          octx.drawImage(img, 0, 0, iw, ih);
          let data;
          try {
            data = octx.getImageData(0, 0, iw, ih).data;
          } catch (e) {
            return;
          }
          const cx = [], cy = [], rad = [], rgb = [];
          for (let i = 0; i < els.length; i++) {
            const e = els[i];
            if (!hasBbox(e)) continue;
            const mx = (e.x0 + e.x1) / 2, my = (e.y0 + e.y1) / 2;
            const sx = Math.min(iw - 1, Math.max(0, Math.round(mx)));
            const sy = Math.min(ih - 1, Math.max(0, Math.round(my)));
            const o = (sy * iw + sx) * 4;
            if (data[o + 3] < 8) continue;
            cx.push(mx);
            cy.push(my);
            rad.push(Math.max(e.x1 - e.x0, e.y1 - e.y0) / 2 + 0.5);
            rgb.push(data[o], data[o + 1], data[o + 2]);
          }
          ptN = cx.length;
          ptCx = Float64Array.from(cx);
          ptCy = Float64Array.from(cy);
          ptRad = Float64Array.from(rad);
          ptRGB = Uint8Array.from(rgb);
          drawPoints();
        };
        img.onerror = function() {
        };
        img.src = href;
      }
      function drawPoints() {
        if (!rasterMode || !canvasEl || !ctx || !vb || !vb0) return;
        if (!isZoomedIn(vb, vb0) || !ptCx || !ptCy || !ptRad || !ptRGB || !ptN) {
          canvasEl.style.display = "none";
          return;
        }
        const rect = (svgEl || el).getBoundingClientRect();
        const cw = Math.max(1, Math.round(rect.width || vb0.w));
        const ch = Math.max(1, Math.round(rect.height || vb0.h));
        const dpr = window.devicePixelRatio || 1;
        if (canvasEl.width !== cw * dpr || canvasEl.height !== ch * dpr) {
          canvasEl.width = cw * dpr;
          canvasEl.height = ch * dpr;
        }
        canvasEl.style.width = cw + "px";
        canvasEl.style.height = ch + "px";
        canvasEl.style.display = "block";
        const W = canvasEl.width, H = canvasEl.height;
        ctx.clearRect(0, 0, W, H);
        const rScale = opts.zoomMarks === "scale" ? Math.min(W / vb.w, H / vb.h) : Math.min(W / vb0.w, H / vb0.h);
        const x0 = vb.x, y0 = vb.y, x1 = vb.x + vb.w, y1 = vb.y + vb.h;
        for (let i = 0; i < ptN; i++) {
          const px = ptCx[i], py = ptCy[i];
          if (px < x0 || px > x1 || py < y0 || py > y1) continue;
          const p = userToCanvas(vb, W, H, px, py);
          ctx.beginPath();
          ctx.arc(p.px, p.py, Math.max(0.75, ptRad[i] * rScale), 0, 6.283185307179586);
          ctx.fillStyle = "rgb(" + ptRGB[i * 3] + "," + ptRGB[i * 3 + 1] + "," + ptRGB[i * 3 + 2] + ")";
          ctx.fill();
        }
      }
      const SVGNS = "http://www.w3.org/2000/svg";
      function ringFor(k, cls) {
        const m = meta[k];
        if (!m || !hasBbox(m)) return null;
        const cx = (m.x0 + m.x1) / 2;
        const cy = (m.y0 + m.y1) / 2;
        const r = Math.max(m.x1 - m.x0, m.y1 - m.y0) / 2 + 2;
        const c = document.createElementNS(SVGNS, "circle");
        c.setAttribute("cx", String(cx));
        c.setAttribute("cy", String(cy));
        c.setAttribute("r", String(r));
        c.setAttribute("class", cls);
        c.setAttribute("vector-effect", "non-scaling-stroke");
        return c;
      }
      function clearGroup(g) {
        if (g) while (g.firstChild) g.removeChild(g.firstChild);
      }
      function drawSelFeedback() {
        clearGroup(selGroup);
        if (!selGroup) return;
        const keys = selectedKeys();
        if (keys.length > OVERLAY_MARK_CAP) return;
        for (let i = 0; i < keys.length; i++) {
          const c = ringFor(keys[i], "vellumwidget-fb-sel");
          if (c) selGroup.appendChild(c);
        }
      }
      function drawHovFeedback(keys) {
        clearGroup(hovGroup);
        if (!hovGroup) return;
        for (let i = 0; i < keys.length; i++) {
          const c = ringFor(keys[i], "vellumwidget-fb-hov");
          if (c) hovGroup.appendChild(c);
        }
      }
      function setHoverKeys(keys) {
        if (!opts.hover) return;
        if (rasterMode) {
          drawHovFeedback(keys);
          return;
        }
        lastHoverKeys = keys;
        clearClass("vellumwidget-hl");
        addClassForKeys(keys, "vellumwidget-hl");
        reevaluateInteractions();
        if (largeDim) showHighlightOverlay(keys);
        else el.classList.add("vellumwidget-hovering");
      }
      function setHover(k) {
        setHoverKeys(linkedKeys(k));
      }
      function crosshairLine(x1, y1, x2, y2) {
        const l = document.createElementNS(SVGNS, "line");
        l.setAttribute("x1", String(x1));
        l.setAttribute("y1", String(y1));
        l.setAttribute("x2", String(x2));
        l.setAttribute("y2", String(y2));
        l.setAttribute("class", "vellumwidget-crosshair-line");
        l.setAttribute("vector-effect", "non-scaling-stroke");
        return l;
      }
      function clearCrosshair() {
        if (crosshairLayer) while (crosshairLayer.firstChild) crosshairLayer.removeChild(crosshairLayer.firstChild);
      }
      function drawCrosshair(k, hm) {
        clearCrosshair();
        if (!crosshairLayer) return;
        const m = meta[k];
        if (!m || !hasBbox(m)) return;
        const view = vb || vb0;
        if (!view) return;
        const cx = (m.x0 + m.x1) / 2;
        const cy = (m.y0 + m.y1) / 2;
        const x0 = view.x, x1 = view.x + view.w, y0 = view.y, y1 = view.y + view.h;
        if (hm !== "y") crosshairLayer.appendChild(crosshairLine(cx, y0, cx, y1));
        if (hm !== "x") crosshairLayer.appendChild(crosshairLine(x0, cy, x1, cy));
      }
      let tipShowTimer = 0;
      let tipHideTimer = 0;
      function tipDelay() {
        const d = opts.tooltipDelay;
        return typeof d === "number" && d > 0 ? d : 0;
      }
      function markClient(k) {
        const m = meta[k];
        if (!m || !hasBbox(m)) return null;
        const nodes = elementsForKey(k);
        if (nodes.length) {
          const r2 = nodes[0].getBoundingClientRect();
          if (r2.width || r2.height) return { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 };
        }
        const cx = (m.x0 + m.x1) / 2;
        const cy = (m.y0 + m.y1) / 2;
        const f = calibrateXform();
        if (f && f.sx && f.sy) return { x: (cx - f.ox) / f.sx, y: (cy - f.oy) / f.sy };
        if (!svgEl) return null;
        const r = svgEl.getBoundingClientRect();
        const view = currentViewBox();
        if (!view.w || !view.h || !r.width || !r.height) return null;
        return {
          x: r.left + (cx - view.x) / view.w * r.width,
          y: r.top + (cy - view.y) / view.h * r.height
        };
      }
      function placeTip(clientX, clientY, anchorKey) {
        const box = el.getBoundingClientRect();
        let ax = clientX - box.left;
        let ay = clientY - box.top;
        if (opts.tooltipFollow === false && anchorKey) {
          const c = markClient(anchorKey);
          if (c) {
            ax = c.x - box.left;
            ay = c.y - box.top;
          }
        }
        const tw = tip.offsetWidth || 0;
        const th = tip.offsetHeight || 0;
        const below = ay - th - 12 < 0;
        if (tw && box.width) ax = Math.max(tw / 2, Math.min(box.width - tw / 2, ax));
        tip.style.transform = "translate(" + Math.round(ax) + "px," + Math.round(ay) + "px) " + (below ? "translate(-50%, 12px)" : "translate(-50%, calc(-100% - 12px))");
      }
      function revealTip(build, clientX, clientY, anchorKey) {
        if (tipHideTimer) {
          clearTimeout(tipHideTimer);
          tipHideTimer = 0;
        }
        const doShow = () => {
          tipShowTimer = 0;
          build();
          placeTip(clientX, clientY, anchorKey);
          tip.classList.add("vellumwidget-show");
        };
        const d = tipDelay();
        if (d > 0 && !tip.classList.contains("vellumwidget-show")) {
          if (tipShowTimer) clearTimeout(tipShowTimer);
          tipShowTimer = setTimeout(doShow, d);
        } else {
          doShow();
        }
      }
      function showTip(clientX, clientY, k) {
        const m = meta[k];
        revealTip(() => {
          tip.innerHTML = sanitizeTip(m && m.tooltip || k);
        }, clientX, clientY, k);
      }
      const TIP_MULTI_CAP = 30;
      function showTipMulti(clientX, clientY, keys) {
        revealTip(() => {
          const rows = [];
          for (let i = 0; i < keys.length && rows.length < TIP_MULTI_CAP; i++) {
            const m = meta[keys[i]];
            rows.push(sanitizeTip(m && m.tooltip || keys[i]));
          }
          if (keys.length > TIP_MULTI_CAP) rows.push("\u2026");
          tip.innerHTML = rows.join("<br>");
        }, clientX, clientY, keys[0] || null);
      }
      function hideTip() {
        if (tipShowTimer) {
          clearTimeout(tipShowTimer);
          tipShowTimer = 0;
        }
        if (tipHideTimer) {
          clearTimeout(tipHideTimer);
          tipHideTimer = 0;
        }
        tip.classList.remove("vellumwidget-show");
      }
      function scheduleHideTip() {
        if (tipShowTimer) {
          clearTimeout(tipShowTimer);
          tipShowTimer = 0;
        }
        if (opts.tooltipSticky) {
          if (tipHideTimer) clearTimeout(tipHideTimer);
          tipHideTimer = setTimeout(() => {
            tipHideTimer = 0;
            tip.classList.remove("vellumwidget-show");
          }, 260);
        } else {
          tip.classList.remove("vellumwidget-show");
        }
      }
      function clearHover() {
        if (rasterMode) clearGroup(hovGroup);
        if (largeDim) hideHighlightOverlay();
        el.classList.remove("vellumwidget-hovering");
        clearClass("vellumwidget-hl");
        clearCrosshair();
        scheduleHideTip();
        shinyInput("hover", null);
        if (lastHoverKeys.length) {
          lastHoverKeys = [];
          reevaluateInteractions();
        }
      }
      function shinyInput(event, value, opts2) {
        const hw = HTMLWidgets;
        const sh = window.Shiny;
        if (hw.shinyMode && sh && sh.setInputValue && el.id) {
          sh.setInputValue(el.id + "_" + event, value, opts2);
        }
      }
      function refreshSelected() {
        if (rasterMode) {
          drawSelFeedback();
          return;
        }
        clearClass("vellumwidget-selected");
        for (const k in selected) if (selected[k]) addClassForKeys([k], "vellumwidget-selected");
        reevaluateInteractions();
      }
      function selectedKeys() {
        return Object.keys(selected).filter((k) => selected[k]);
      }
      function broadcast() {
        const keys = selectedKeys();
        if (group) busPublish(group, selfToken, keys);
        if (ctSel) ctSel.set(keys);
        shinyInput("selected", keys);
      }
      function toggleSelect(k) {
        const ks = linkedKeys(k);
        if (opts.selectMode === "single") {
          const allOn = ks.every((x) => selected[x]) && selectedKeys().length === ks.length;
          selected = {};
          if (!allOn) ks.forEach((x) => selected[x] = true);
        } else {
          const turnOn = !ks.every((x) => selected[x]);
          ks.forEach((x) => selected[x] = turnOn);
        }
        refreshSelected();
        broadcast();
      }
      function setSelection(keys) {
        selected = {};
        for (let i = 0; i < keys.length; i++) selected[keys[i]] = true;
        refreshSelected();
        broadcast();
      }
      function clearSelection() {
        selected = {};
        refreshSelected();
        broadcast();
      }
      function applyLinkedSelection(keys) {
        selected = {};
        for (let i = 0; i < keys.length; i++) selected[keys[i]] = true;
        refreshSelected();
        shinyInput("selected", selectedKeys());
      }
      function applyFilter(showKeys) {
        clearClass("vellumwidget-filtered");
        filteredKeySet = {};
        if (showKeys == null) return;
        const show = {};
        for (let i = 0; i < showKeys.length; i++) show[showKeys[i]] = true;
        for (let i = 0; i < elements.length; i++) {
          const key = elements[i].key;
          if (!show[key]) {
            addClassForKeys([key], "vellumwidget-filtered");
            filteredKeySet[key] = true;
          }
        }
      }
      function inert(k) {
        return !!hiddenKeySet[k] || !!filteredKeySet[k] || !!colorHiddenSet[k];
      }
      function dropInert(keys) {
        return keys.filter((k) => !inert(k));
      }
      function setupInteractions() {
        condTagElems = {};
        filtSelElems = {};
        joinOf = {};
        if (!interactions) return;
        for (let i = 0; i < elements.length; i++) {
          const e = elements[i];
          if (e.cond) {
            for (let t = 0; t < e.cond.length; t++) {
              (condTagElems[e.cond[t]] = condTagElems[e.cond[t]] || []).push(e.key);
            }
          }
          if (e.filt) {
            for (let t = 0; t < e.filt.length; t++) {
              (filtSelElems[e.filt[t]] = filtSelElems[e.filt[t]] || []).push(e.key);
            }
          }
          if (e.join != null) joinOf[e.key] = e.join;
        }
      }
      function selectionMembers(sel) {
        const set = {};
        let keys = sel.on === "hover" ? lastHoverKeys : selectedKeys();
        if (sel.on !== "hover" && sel.expand && sel.expand.mode === "neighbours" && neighbourExpand) {
          const out = [];
          const seen = {};
          for (let i = 0; i < keys.length; i++) {
            const proj = linkedKeys(keys[i]);
            for (let j = 0; j < proj.length; j++) {
              if (!seen[proj[j]]) {
                seen[proj[j]] = true;
                out.push(proj[j]);
              }
            }
          }
          keys = out;
        }
        for (let i = 0; i < keys.length; i++) set[keys[i]] = true;
        return set;
      }
      function styleCondNode(node, color) {
        if (color == null) {
          node.classList.add("vellumwidget-cond-dim");
          return;
        }
        const n = node;
        const f = node.getAttribute("fill");
        if (f && f !== "none") n.style.fill = color;
        const s = node.getAttribute("stroke");
        if (s && s !== "none") n.style.stroke = color;
      }
      function clearCondNode(node) {
        node.classList.remove("vellumwidget-cond-dim");
        const n = node;
        if (n.style.fill) n.style.fill = "";
        if (n.style.stroke) n.style.stroke = "";
      }
      function applyConditions() {
        if (rasterMode || !interactions || !interactions.conditions) return;
        const selByName = {};
        (interactions.selections || []).forEach((s) => selByName[s.name] = s);
        for (let ci = 0; ci < interactions.conditions.length; ci++) {
          const c = interactions.conditions[ci];
          const tag = c.selection + ":" + c.aes;
          const tagged = condTagElems[tag] || [];
          const sel = selByName[c.selection];
          const members = sel ? selectionMembers(sel) : {};
          const active = Object.keys(members).length > 0 || c.empty === false;
          for (let i = 0; i < tagged.length; i++) {
            const nodes = elementsForKey(tagged[i]);
            const member = !!members[tagged[i]];
            for (let j = 0; j < nodes.length; j++) {
              clearCondNode(nodes[j]);
              if (active && !member) styleCondNode(nodes[j], c.if_false);
            }
          }
        }
      }
      function memberJoins(members) {
        const js = {};
        for (const k in members) js[joinOf[k] != null ? joinOf[k] : k] = true;
        return js;
      }
      function applyFilters() {
        const ix = interactions;
        if (rasterMode || !ix || !ix.filters || !ix.filters.length) return;
        const filters = ix.filters;
        const selByName = {};
        (ix.selections || []).forEach((s) => selByName[s.name] = s);
        const hide = {};
        let restrict = false;
        for (let i = 0; i < filters.length; i++) {
          const selName = filters[i].selection;
          const sel = selByName[selName];
          const members = sel ? selectionMembers(sel) : {};
          const active = Object.keys(members).length > 0 || sel && sel.empty === false;
          if (!active) continue;
          restrict = true;
          const keep = memberJoins(members);
          const targets = filtSelElems[selName] || [];
          for (let t = 0; t < targets.length; t++) {
            const k = targets[t];
            const j = joinOf[k] != null ? joinOf[k] : k;
            if (!keep[j]) hide[k] = true;
          }
        }
        if (!restrict) {
          applyFilter(null);
          return;
        }
        const show = [];
        for (let i = 0; i < elements.length; i++) {
          if (!hide[elements[i].key]) show.push(elements[i].key);
        }
        applyFilter(show);
      }
      function reevaluateInteractions() {
        applyConditions();
        applyFilters();
      }
      function proxyCall(method, args) {
        const keys = Array.isArray(args) ? args : args == null ? [] : [String(args)];
        switch (method) {
          case "select":
            setSelection(keys);
            break;
          case "clearSelection":
            clearSelection();
            break;
          case "filter":
            applyFilter(keys);
            break;
          case "clearFilter":
            applyFilter(null);
            break;
          case "zoom":
            proxyZoomToKeys(keys);
            break;
          case "resetZoom":
            resetZoom();
            break;
          default:
            break;
        }
      }
      function proxyZoomToKeys(keys) {
        if (!keys.length) {
          resetZoom();
          return;
        }
        const sel = {};
        for (let i = 0; i < keys.length; i++) sel[keys[i]] = true;
        const bb = unionBbox(elements, sel);
        if (bb) zoomTo(bb);
      }
      function setupLinking() {
        if (joined) return;
        joined = true;
        if (group) busJoin(group, { token: selfToken, onSelect: applyLinkedSelection, onView: applyLinkedView });
        const ct = getCrosstalk();
        if (opts.crosstalk && ct) {
          ctSel = new ct.SelectionHandle(opts.crosstalk);
          ctFilt = new ct.FilterHandle(opts.crosstalk);
          ctSel.on("change", function(e) {
            if (e.sender !== ctSel) applyLinkedSelection(e.value || []);
          });
          ctFilt.on("change", function(e) {
            applyFilter(e.value);
          });
        }
      }
      function panelAt(x, y) {
        for (let i = 0; i < panels.length; i++) {
          const p = panels[i];
          if (x >= p.px0 && x <= p.px1 && y >= p.py0 && y <= p.py1) return p;
        }
        return panels.length === 1 ? panels[0] : null;
      }
      function dataRangeOf(p, dx0, dy0, dx1, dy1) {
        const out = { panel: p.name };
        if (p.x) {
          const a = pxToDataX(p, dx0), b = pxToDataX(p, dx1);
          if (a != null && b != null) out.x = [Math.min(a, b), Math.max(a, b)];
        }
        if (p.y) {
          const a = pxToDataY(p, dy0), b = pxToDataY(p, dy1);
          if (a != null && b != null) out.y = [Math.min(a, b), Math.max(a, b)];
        }
        return out.x || out.y ? out : null;
      }
      function brushDataFields(bb) {
        const p = panelAt((bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2);
        if (!p) return {};
        const d = dataRangeOf(p, bb.x0, bb.y0, bb.x1, bb.y1);
        if (!d) return {};
        const f = { panel: d.panel };
        if (d.x) {
          f.x0d = d.x[0];
          f.x1d = d.x[1];
        }
        if (d.y) {
          f.y0d = d.y[0];
          f.y1d = d.y[1];
        }
        return f;
      }
      function reportView() {
        if (!vb) return;
        const payload = { x: vb.x, y: vb.y, w: vb.w, h: vb.h, zoomed: vb0 ? isZoomedIn(vb, vb0) : false };
        if (panels.length === 1) {
          let d;
          if (axisZoomActive && vb0) {
            const p = panels[0];
            const a = panToView(vb, vb0, p.px0, p.py0);
            const b = panToView(vb, vb0, p.px1, p.py1);
            d = dataRangeOf(p, a.x, a.y, b.x, b.y);
          } else {
            d = dataRangeOf(panels[0], vb.x, vb.y, vb.x + vb.w, vb.y + vb.h);
          }
          if (d) payload.data = d;
        }
        shinyInput("zoom", payload);
        if (group && vb0 && !receivingView && vb0.w && vb0.h) {
          busPublishView(group, selfToken, {
            x: (vb.x - vb0.x) / vb0.w,
            y: (vb.y - vb0.y) / vb0.h,
            w: vb.w / vb0.w,
            h: vb.h / vb0.h
          });
        }
      }
      function applyLinkedView(v) {
        if (!vb0) return;
        const next = {
          x: vb0.x + v.x * vb0.w,
          y: vb0.y + v.y * vb0.h,
          w: v.w * vb0.w,
          h: v.h * vb0.h
        };
        if (!(next.w > 0) || !(next.h > 0)) return;
        if (vb && Math.abs(next.x - vb.x) < 1e-6 && Math.abs(next.y - vb.y) < 1e-6 && Math.abs(next.w - vb.w) < 1e-6 && Math.abs(next.h - vb.h) < 1e-6) return;
        receivingView = true;
        vb = next;
        applyViewBox();
        receivingView = false;
      }
      function applyAspect() {
        const par = xZoom && !axisZoomActive ? "none" : "xMidYMid meet";
        if (svgEl) svgEl.setAttribute("preserveAspectRatio", par);
        if (dimLayer) dimLayer.setAttribute("preserveAspectRatio", par);
        if (crosshairLayer) crosshairLayer.setAttribute("preserveAspectRatio", par);
        if (colorbarLayer) colorbarLayer.setAttribute("preserveAspectRatio", par);
      }
      function applyViewBox() {
        if (xZoom && vb && vb0) {
          vb.y = vb0.y;
          vb.h = vb0.h;
        }
        if (axisZoomActive && panGroup && vb && vb0) {
          const t = viewToPan(vb, vb0);
          panGroup.setAttribute(
            "transform",
            "matrix(" + t.sx + " 0 0 " + t.sy + " " + t.tx + " " + t.ty + ")"
          );
          setPanScaleVars(t);
          if (svgEl) svgEl.setAttribute("viewBox", fmtViewBox(vb0));
          retick();
        } else if (svgEl && vb) {
          svgEl.setAttribute("viewBox", fmtViewBox(vb));
        }
        if (dimLayer && vb) dimLayer.setAttribute("viewBox", fmtViewBox(vb));
        if (crosshairLayer && vb) crosshairLayer.setAttribute("viewBox", fmtViewBox(vb));
        if (colorbarLayer && (vb || vb0)) {
          colorbarLayer.setAttribute("viewBox", fmtViewBox(axisZoomActive && vb0 ? vb0 : vb));
        }
        drawPoints();
        updateNav();
        if (dragging !== "pan" && pinchDist === 0) reportView();
      }
      function resetZoom() {
        if (vb0) {
          vb = { x: vb0.x, y: vb0.y, w: vb0.w, h: vb0.h };
          applyViewBox();
        }
      }
      function zoomTo(rect, pad = 0.05) {
        if (!vb) return;
        const w = Math.max(rect.x1 - rect.x0, 1e-6);
        const h = Math.max(rect.y1 - rect.y0, 1e-6);
        const px = w * pad;
        const py = h * pad;
        vb = { x: rect.x0 - px, y: rect.y0 - py, w: w + 2 * px, h: h + 2 * py };
        applyViewBox();
      }
      function isLinearAxis(ax) {
        return !!ax && ax.type === "continuous" && (ax.transform === "identity" || ax.transform === "reverse");
      }
      function setupAxisZoom() {
        panGroup = null;
        outerPanelGroup = null;
        axisPanel = null;
        axisZoomActive = false;
        if (retickLayer) {
          retickLayer.remove();
          retickLayer = null;
        }
        retickGrid = null;
        if (!opts.axisZoom || rasterMode || !svgEl || !vb0 || !stage || panels.length !== 1) return;
        const p = panels[0];
        if (!isLinearAxis(p.x) || !isLinearAxis(p.y)) return;
        if (!svgEl.querySelector('[data-vellum-panel^="axis-x"] text, [data-vellum-panel^="axis-y"] text')) return;
        const pan = svgEl.querySelector('[data-vellum-pan="' + cssEscape(p.name) + '"]');
        const outer = svgEl.querySelector('[data-vellum-panel="' + cssEscape(p.name) + '"]');
        if (!pan || !outer) return;
        panGroup = pan;
        outerPanelGroup = outer;
        axisPanel = p;
        axisZoomActive = true;
        scrapeAxisStyle(p);
        hideStaticAxes();
        retickGrid = document.createElementNS(SVGNS, "g");
        retickGrid.setAttribute("class", "vellumwidget-retick-grid");
        outer.insertBefore(retickGrid, pan);
        retickLayer = document.createElementNS(SVGNS, "svg");
        retickLayer.setAttribute("class", "vellumwidget-retick-layer");
        retickLayer.setAttribute("aria-hidden", "true");
        retickLayer.setAttribute("viewBox", fmtViewBox(vb0));
        stage.appendChild(retickLayer);
        const t = viewToPan(vb || vb0, vb0);
        panGroup.setAttribute(
          "transform",
          "matrix(" + t.sx + " 0 0 " + t.sy + " " + t.tx + " " + t.ty + ")"
        );
        setPanScaleVars(t);
        setupConstantMarks();
        retick();
      }
      function setPanScaleVars(t) {
        if (!panGroup) return;
        panGroup.style.setProperty("--vw-ix", String(t.sx ? 1 / t.sx : 1));
        panGroup.style.setProperty("--vw-iy", String(t.sy ? 1 / t.sy : 1));
      }
      function setupConstantMarks() {
        if (!axisZoomActive || opts.zoomMarks === "scale" || !panGroup) return;
        for (let i = 0; i < elements.length; i++) {
          const e = elements[i];
          if (!e.mark) continue;
          const nodes = nodesByKey[e.key];
          if (!nodes) continue;
          const glyph = GLYPH_MARKS[e.mark] === true;
          for (let j = 0; j < nodes.length; j++) {
            const node = nodes[j];
            if (!panGroup.contains(node)) continue;
            if (glyph) {
              node.style.setProperty("transform-box", "fill-box");
              node.style.setProperty("transform-origin", "center");
              const place = transAsCss(node);
              node.style.setProperty(
                "transform",
                (place ? place + " " : "") + "scale(var(--vw-ix,1),var(--vw-iy,1))"
              );
            } else {
              node.setAttribute("vector-effect", "non-scaling-stroke");
            }
          }
        }
      }
      function transAsCss(node) {
        const t = (node.getAttribute("transform") || "").trim();
        if (!t) return "";
        const N = "([-+\\d.eE]+)";
        const m = new RegExp(
          "matrix\\(\\s*" + [N, N, N, N, N, N].join("[\\s,]+") + "\\s*\\)"
        ).exec(t);
        if (m) {
          const v = m.slice(1, 7).map(Number);
          if (v.some(function(x) {
            return !isFinite(x);
          })) return "";
          return "matrix(" + v.join(",") + ")";
        }
        const tr = new RegExp(
          "translate\\(\\s*" + N + "(?:[\\s,]+" + N + ")?\\s*\\)"
        ).exec(t);
        if (tr) {
          const tx = Number(tr[1]), ty = tr[2] === void 0 ? 0 : Number(tr[2]);
          if (!isFinite(tx) || !isFinite(ty)) return "";
          return "translate(" + tx + "px," + ty + "px)";
        }
        return "";
      }
      function transTranslate(node) {
        const t = node.getAttribute("transform") || "";
        const m = /matrix\(\s*[-\d.eE]+\s+[-\d.eE]+\s+[-\d.eE]+\s+[-\d.eE]+\s+([-\d.eE]+)\s+([-\d.eE]+)\s*\)/.exec(t) || /translate\(\s*([-\d.eE]+)[ ,]+([-\d.eE]+)\s*\)/.exec(t);
        return m ? { tx: parseFloat(m[1]), ty: parseFloat(m[2]) } : { tx: 0, ty: 0 };
      }
      function scrapeAxisStyle(p) {
        if (!svgEl) return;
        const xText = svgEl.querySelector('[data-vellum-panel^="axis-x"] text');
        if (xText) {
          axisStyle.textFill = xText.getAttribute("fill") || axisStyle.textFill;
          axisStyle.fontFamily = xText.getAttribute("font-family") || axisStyle.fontFamily;
          const fs = parseFloat(xText.getAttribute("font-size") || "");
          if (fs) axisStyle.fontSize = fs;
          const y = parseFloat(xText.getAttribute("y") || "");
          axisStyle.xBaselineY = isFinite(y) ? transTranslate(xText).ty + y : p.py1 + axisStyle.fontSize;
        } else {
          axisStyle.xBaselineY = p.py1 + axisStyle.fontSize;
        }
        const yText = svgEl.querySelector('[data-vellum-panel^="axis-y"] text');
        if (yText) {
          const x = parseFloat(yText.getAttribute("x") || "");
          axisStyle.yLabelX = isFinite(x) ? transTranslate(yText).tx + x : p.px0 - 6;
        } else {
          axisStyle.yLabelX = p.px0 - 6;
        }
        const grid = svgEl.querySelector('[role="grid"] path, [role="grid"] line');
        if (grid) {
          axisStyle.gridStroke = grid.getAttribute("stroke") || axisStyle.gridStroke;
          const sw = parseFloat(grid.getAttribute("stroke-width") || "");
          if (sw) axisStyle.gridWidth = sw;
        }
      }
      function hideStaticAxes() {
        if (!svgEl) return;
        const hide = svgEl.querySelectorAll(
          '[role="grid"], [data-vellum-panel^="axis-x"], [data-vellum-panel^="axis-y"]'
        );
        for (let i = 0; i < hide.length; i++) hide[i].style.display = "none";
      }
      function gridLine(x1, y1, x2, y2) {
        const l = document.createElementNS(SVGNS, "line");
        l.setAttribute("x1", String(x1));
        l.setAttribute("y1", String(y1));
        l.setAttribute("x2", String(x2));
        l.setAttribute("y2", String(y2));
        l.setAttribute("stroke", axisStyle.gridStroke);
        l.setAttribute("stroke-width", String(axisStyle.gridWidth));
        return l;
      }
      function axisLabel(text, x, y, anchor, baseline) {
        const t = document.createElementNS(SVGNS, "text");
        t.setAttribute("x", String(x));
        t.setAttribute("y", String(y));
        t.setAttribute("fill", axisStyle.textFill);
        t.setAttribute("font-family", axisStyle.fontFamily);
        t.setAttribute("font-size", String(axisStyle.fontSize));
        t.setAttribute("text-anchor", anchor);
        t.setAttribute("dominant-baseline", baseline);
        t.textContent = text;
        return t;
      }
      function retick() {
        if (!axisZoomActive || !axisPanel || !vb || !vb0 || !retickGrid || !retickLayer) return;
        const p = axisPanel;
        while (retickGrid.firstChild) retickGrid.removeChild(retickGrid.firstChild);
        while (retickLayer.firstChild) retickLayer.removeChild(retickLayer.firstChild);
        const t = viewToPan(vb, vb0);
        const cTL = panToView(vb, vb0, p.px0, p.py0);
        const cBR = panToView(vb, vb0, p.px1, p.py1);
        if (p.x) {
          const a = pxToDataX(p, cTL.x), b = pxToDataX(p, cBR.x);
          if (a != null && b != null) {
            const lo = Math.min(a, b), hi = Math.max(a, b);
            const ticks = niceTicks(lo, hi, 5);
            const step = ticks.length > 1 ? ticks[1] - ticks[0] : hi - lo;
            const nlo = p.x.native_lo, nhi = p.x.native_hi;
            for (let i = 0; i < ticks.length; i++) {
              const nx = dataToNative(p.x, ticks[i]);
              const px = p.px0 + (nx - nlo) / (nhi - nlo) * (p.px1 - p.px0);
              const sx = t.sx * px + t.tx;
              if (sx < p.px0 - 0.5 || sx > p.px1 + 0.5) continue;
              retickGrid.appendChild(gridLine(sx, p.py0, sx, p.py1));
              retickLayer.appendChild(
                axisLabel(fmtTick(ticks[i], step), sx, axisStyle.xBaselineY, "middle", "text-before-edge")
              );
            }
          }
        }
        if (p.y) {
          const a = pxToDataY(p, cTL.y), b = pxToDataY(p, cBR.y);
          if (a != null && b != null) {
            const lo = Math.min(a, b), hi = Math.max(a, b);
            const ticks = niceTicks(lo, hi, 5);
            const step = ticks.length > 1 ? ticks[1] - ticks[0] : hi - lo;
            const nlo = p.y.native_lo, nhi = p.y.native_hi;
            for (let i = 0; i < ticks.length; i++) {
              const ny = dataToNative(p.y, ticks[i]);
              const py = p.py0 + (nhi - ny) / (nhi - nlo) * (p.py1 - p.py0);
              const sy = t.sy * py + t.ty;
              if (sy < p.py0 - 0.5 || sy > p.py1 + 0.5) continue;
              retickGrid.appendChild(gridLine(p.px0, sy, p.px1, sy));
              retickLayer.appendChild(
                axisLabel(fmtTick(ticks[i], step), axisStyle.yLabelX, sy, "end", "central")
              );
            }
          }
        }
      }
      function navToView(xFrac, wFrac) {
        if (!vb0) return;
        wFrac = Math.min(1, Math.max(0.02, wFrac));
        xFrac = Math.min(1 - wFrac, Math.max(0, xFrac));
        const w = wFrac * vb0.w;
        if (xZoom) {
          vb = { x: vb0.x + xFrac * vb0.w, y: vb0.y, w, h: vb0.h };
        } else {
          const cy = vb ? vb.y + vb.h / 2 : vb0.y + vb0.h / 2;
          const h = wFrac * vb0.h;
          vb = { x: vb0.x + xFrac * vb0.w, y: cy - h / 2, w, h };
        }
        applyViewBox();
      }
      function updateNav() {
        if (!navWindow || !vb || !vb0 || !vb0.w) return;
        const xFrac = (vb.x - vb0.x) / vb0.w;
        const wFrac = vb.w / vb0.w;
        navWindow.style.left = xFrac * 100 + "%";
        navWindow.style.width = wFrac * 100 + "%";
      }
      function buildNavigator() {
        if (navEl) {
          navEl.remove();
          navEl = null;
          navWindow = null;
        }
        if (!opts.navigator || !svgEl || !vb0) return;
        const h = opts.navigatorHeight && opts.navigatorHeight > 0 ? opts.navigatorHeight : 56;
        navEl = document.createElement("div");
        navEl.className = "vellumwidget-nav";
        navEl.style.height = h + "px";
        navEl.setAttribute("aria-hidden", "true");
        const mini = document.createElement("div");
        mini.className = "vellumwidget-nav-mini";
        const clone = svgEl.cloneNode(true);
        clone.setAttribute("viewBox", fmtViewBox(vb0));
        clone.setAttribute("preserveAspectRatio", "none");
        clone.removeAttribute("width");
        clone.removeAttribute("height");
        const defs = clone.querySelector("defs");
        if (defs) defs.remove();
        const clipped = clone.querySelectorAll("[clip-path]");
        for (let i = 0; i < clipped.length; i++) clipped[i].removeAttribute("clip-path");
        const keyed = clone.querySelectorAll("[data-key],[tabindex],[role]");
        for (let i = 0; i < keyed.length; i++) {
          keyed[i].removeAttribute("data-key");
          keyed[i].removeAttribute("tabindex");
          keyed[i].removeAttribute("role");
        }
        clone.removeAttribute("id");
        mini.appendChild(clone);
        navEl.appendChild(mini);
        navWindow = document.createElement("div");
        navWindow.className = "vellumwidget-nav-window";
        const hL = document.createElement("div");
        hL.className = "vellumwidget-nav-handle vellumwidget-nav-handle-l";
        const hR = document.createElement("div");
        hR.className = "vellumwidget-nav-handle vellumwidget-nav-handle-r";
        navWindow.appendChild(hL);
        navWindow.appendChild(hR);
        navEl.appendChild(navWindow);
        el.appendChild(navEl);
        wireNavigator(hL, hR);
        updateNav();
      }
      function wireNavigator(hL, hR) {
        if (!navEl || !navWindow) return;
        let mode2 = "";
        let startFracX = 0, startFracW = 0, startPointer = 0;
        const stripFrac = (clientX) => {
          const r = navEl.getBoundingClientRect();
          return r.width ? (clientX - r.left) / r.width : 0;
        };
        const onMove = (ev) => {
          if (!mode2 || !vb0) return;
          const d = stripFrac(ev.clientX) - startPointer;
          if (mode2 === "pan") navToView(startFracX + d, startFracW);
          else if (mode2 === "l") {
            const nx = startFracX + d;
            navToView(nx, startFracW + (startFracX - nx));
          } else if (mode2 === "r") navToView(startFracX, startFracW + d);
        };
        const onUp = (ev) => {
          mode2 = "";
          navWindow.classList.remove("vellumwidget-nav-grabbing");
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          if (ev && ev.target.releasePointerCapture) {
          }
        };
        const start = (m) => (ev) => {
          if (!vb0) return;
          ev.preventDefault();
          ev.stopPropagation();
          mode2 = m;
          startFracX = (vb.x - vb0.x) / vb0.w;
          startFracW = vb.w / vb0.w;
          startPointer = stripFrac(ev.clientX);
          if (m === "pan") navWindow.classList.add("vellumwidget-nav-grabbing");
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        };
        navWindow.addEventListener("pointerdown", start("pan"));
        hL.addEventListener("pointerdown", start("l"));
        hR.addEventListener("pointerdown", start("r"));
      }
      function cbPos(v) {
        const cb = colorbar;
        const t = cb.hi === cb.lo ? 0 : (v - cb.lo) / (cb.hi - cb.lo);
        if (cb.orientation === "h") {
          const f2 = cb.reverse ? 1 - t : t;
          return cb.x0 + f2 * (cb.x1 - cb.x0);
        }
        const f = cb.reverse ? t : 1 - t;
        return cb.y0 + f * (cb.y1 - cb.y0);
      }
      function cbValueAt(pos) {
        const cb = colorbar;
        if (cb.orientation === "h") {
          let f2 = cb.x1 === cb.x0 ? 0 : (pos - cb.x0) / (cb.x1 - cb.x0);
          const t2 = cb.reverse ? 1 - f2 : f2;
          return cb.lo + t2 * (cb.hi - cb.lo);
        }
        let f = cb.y1 === cb.y0 ? 0 : (pos - cb.y0) / (cb.y1 - cb.y0);
        const t = cb.reverse ? f : 1 - f;
        return cb.lo + t * (cb.hi - cb.lo);
      }
      function cbRect(x, y, w, h, cls) {
        const r = document.createElementNS(SVGNS, "rect");
        r.setAttribute("x", String(x));
        r.setAttribute("y", String(y));
        r.setAttribute("width", String(Math.max(0, w)));
        r.setAttribute("height", String(Math.max(0, h)));
        r.setAttribute("class", cls);
        return r;
      }
      function drawColorbarControl() {
        if (!colorbarLayer) return;
        while (colorbarLayer.firstChild) colorbarLayer.removeChild(colorbarLayer.firstChild);
        if (!colorbar || !colorRange) return;
        const cb = colorbar;
        const pa = cbPos(colorRange.a);
        const pb = cbPos(colorRange.b);
        const lo = Math.min(pa, pb);
        const hi = Math.max(pa, pb);
        const mkHandle = (pos, which) => {
          const H = 4;
          const r = cb.orientation === "h" ? cbRect(pos - H / 2, cb.y0 - 2, H, cb.y1 - cb.y0 + 4, "vellumwidget-cb-handle") : cbRect(cb.x0 - 2, pos - H / 2, cb.x1 - cb.x0 + 4, H, "vellumwidget-cb-handle");
          r.setAttribute("vector-effect", "non-scaling-stroke");
          r.setAttribute("data-cb", which);
          return r;
        };
        if (cb.orientation === "h") {
          colorbarLayer.appendChild(cbRect(cb.x0, cb.y0, lo - cb.x0, cb.y1 - cb.y0, "vellumwidget-cb-dim"));
          colorbarLayer.appendChild(cbRect(hi, cb.y0, cb.x1 - hi, cb.y1 - cb.y0, "vellumwidget-cb-dim"));
        } else {
          colorbarLayer.appendChild(cbRect(cb.x0, cb.y0, cb.x1 - cb.x0, lo - cb.y0, "vellumwidget-cb-dim"));
          colorbarLayer.appendChild(cbRect(cb.x0, hi, cb.x1 - cb.x0, cb.y1 - hi, "vellumwidget-cb-dim"));
        }
        colorbarLayer.appendChild(mkHandle(pa, "a"));
        colorbarLayer.appendChild(mkHandle(pb, "b"));
      }
      function applyColorFilter() {
        clearClass("vellumwidget-colorfiltered");
        colorHiddenSet = {};
        if (!colorbar || !colorRange) {
          shinyInput("colorfilter", null);
          return;
        }
        const a = colorRange.a;
        const b = colorRange.b;
        const full = a <= colorbar.lo + 1e-9 && b >= colorbar.hi - 1e-9;
        if (!full) {
          const outKeys = [];
          for (let i = 0; i < elements.length; i++) {
            const e = elements[i];
            if (typeof e.filter_value === "number" && (e.filter_value < a || e.filter_value > b) && !colorHiddenSet[e.key]) {
              colorHiddenSet[e.key] = true;
              outKeys.push(e.key);
            }
          }
          addClassForKeys(outKeys, "vellumwidget-colorfiltered");
        }
        shinyInput("colorfilter", full ? null : [a, b]);
      }
      function setColorRange(a, b) {
        if (!colorbar) return;
        const lo = colorbar.lo, hi = colorbar.hi;
        a = Math.min(hi, Math.max(lo, a));
        b = Math.min(hi, Math.max(lo, b));
        colorRange = { a: Math.min(a, b), b: Math.max(a, b) };
        drawColorbarControl();
        applyColorFilter();
      }
      function buildColorbar() {
        if (colorbarLayer) {
          colorbarLayer.remove();
          colorbarLayer = null;
        }
        colorHiddenSet = {};
        colorRange = null;
        el.classList.remove("vellumwidget-cb-v", "vellumwidget-cb-h");
        if (!colorbar || rasterMode || !stage) return;
        colorbarLayer = document.createElementNS(SVGNS, "svg");
        colorbarLayer.setAttribute("class", "vellumwidget-colorbar-layer");
        colorbarLayer.setAttribute("aria-hidden", "true");
        if (vb0) colorbarLayer.setAttribute("viewBox", fmtViewBox(vb0));
        stage.appendChild(colorbarLayer);
        el.classList.add(colorbar.orientation === "h" ? "vellumwidget-cb-h" : "vellumwidget-cb-v");
        colorRange = { a: colorbar.lo, b: colorbar.hi };
        drawColorbarControl();
        wireColorbar();
      }
      function wireColorbar() {
        if (!colorbarLayer) return;
        let dragWhich = "";
        const onMove = (ev) => {
          if (!dragWhich || !colorbar || !colorRange) return;
          const u = toUser(ev.clientX, ev.clientY);
          const v = cbValueAt(colorbar.orientation === "h" ? u.x : u.y);
          if (dragWhich === "a") setColorRange(v, colorRange.b);
          else setColorRange(colorRange.a, v);
        };
        const onUp = () => {
          dragWhich = "";
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };
        colorbarLayer.addEventListener("pointerdown", function(ev) {
          const w = ev.target.getAttribute && ev.target.getAttribute("data-cb");
          if (w !== "a" && w !== "b") return;
          ev.preventDefault();
          ev.stopPropagation();
          dragWhich = w;
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        });
        colorbarLayer.addEventListener("dblclick", function(ev) {
          if (!colorbar) return;
          ev.preventDefault();
          setColorRange(colorbar.lo, colorbar.hi);
        });
      }
      function positionBrush(x, y, w, h) {
        brushBox.style.left = x + "px";
        brushBox.style.top = y + "px";
        brushBox.style.width = w + "px";
        brushBox.style.height = h + "px";
        brushBox.style.display = "block";
      }
      function hideBrush() {
        brushBox.style.display = "none";
      }
      function lassoPointsAttr() {
        let s = "";
        for (let i = 0; i < lassoPts.length; i++) s += (i ? " " : "") + lassoPts[i].x + "," + lassoPts[i].y;
        return s;
      }
      function updateLassoPath() {
        if (!crosshairLayer) return;
        if (!lassoEl) {
          lassoEl = document.createElementNS(SVGNS, "polygon");
          lassoEl.setAttribute("class", "vellumwidget-lasso");
          lassoEl.setAttribute("vector-effect", "non-scaling-stroke");
          crosshairLayer.appendChild(lassoEl);
        }
        lassoEl.setAttribute("points", lassoPointsAttr());
      }
      function clearLasso() {
        lassoPts = [];
        if (lassoEl && lassoEl.parentNode) lassoEl.parentNode.removeChild(lassoEl);
        lassoEl = null;
      }
      let down = null;
      let dragging = "";
      let movedDuringDrag = false;
      const pointers = /* @__PURE__ */ new Map();
      let pinchDist = 0;
      function hoverAt(k, clientX, clientY) {
        if (k != null && inert(k)) k = null;
        if (k == null) {
          clearHover();
          return;
        }
        shinyInput("hover", k);
        const hm = opts.hoverMode || "closest";
        if (hm === "x" || hm === "y") {
          const keys = dropInert(columnKeys(k, hm));
          if (!keys.length) {
            clearHover();
            return;
          }
          setHoverKeys(keys);
          if (opts.crosshair) drawCrosshair(k, hm);
          if (opts.tooltip) showTipMulti(clientX, clientY, keys);
        } else {
          const keys = dropInert(linkedKeys(k));
          if (!keys.length) {
            clearHover();
            return;
          }
          setHoverKeys(keys);
          if (opts.crosshair) drawCrosshair(k, "closest");
          if (opts.tooltip) showTip(clientX, clientY, k);
        }
      }
      function onHoverMove(ev) {
        if (down || pinchDist > 0) return;
        const hm = opts.hoverMode || "closest";
        const k = keyOf(ev.target);
        if (k != null) {
          if (hoverRAF) {
            cancelAnimationFrame(hoverRAF);
            hoverRAF = 0;
          }
          hoverAt(k, ev.clientX, ev.clientY);
          return;
        }
        if (!elements.length || hm === "closest" && !opts.nearest) {
          clearHover();
          return;
        }
        const cx = ev.clientX;
        const cy = ev.clientY;
        if (hoverRAF) return;
        hoverRAF = requestAnimationFrame(function() {
          hoverRAF = 0;
          const u = clientToScene(cx, cy);
          let seed;
          if (hm === "x") seed = nearestAxisKey("x", u.x);
          else if (hm === "y") seed = nearestAxisKey("y", u.y);
          else seed = nearestKeyAt(u.x, u.y, vb ? vb.w * 0.02 : 8);
          hoverAt(seed, cx, cy);
        });
      }
      function onDragMove(ev) {
        if (pointers.has(ev.pointerId)) {
          pointers.set(ev.pointerId, { cx: ev.clientX, cy: ev.clientY });
        }
        if (pinchDist > 0 && pointers.size >= 2 && vb) {
          const pts = Array.from(pointers.values());
          const d = Math.hypot(pts[0].cx - pts[1].cx, pts[0].cy - pts[1].cy);
          if (d > 0) {
            const u = toView((pts[0].cx + pts[1].cx) / 2, (pts[0].cy + pts[1].cy) / 2);
            vb = zoomViewBox(vb, d / pinchDist, u.x, u.y);
            applyViewBox();
            pinchDist = d;
          }
          return;
        }
        if (!down) return;
        if (!dragging) {
          if (Math.abs(ev.clientX - down.cx) + Math.abs(ev.clientY - down.cy) <= DRAG_THRESHOLD) return;
          dragging = mode === "pan" && opts.zoom ? "pan" : mode === "lasso" && opts.lasso ? "lasso" : opts.brush ? "brush" : "";
          if (dragging === "pan") el.classList.add("vellumwidget-panning");
          if (dragging === "lasso") lassoPts = [clientToScene(down.cx, down.cy)];
          if (dragging === "") return;
          movedDuringDrag = true;
        }
        if (dragging === "brush") {
          const box = el.getBoundingClientRect();
          positionBrush(
            Math.min(down.cx, ev.clientX) - box.left,
            Math.min(down.cy, ev.clientY) - box.top,
            Math.abs(ev.clientX - down.cx),
            Math.abs(ev.clientY - down.cy)
          );
        } else if (dragging === "lasso" && vb) {
          lassoPts.push(clientToScene(ev.clientX, ev.clientY));
          updateLassoPath();
        } else if (dragging === "pan" && vb) {
          const u = toView(ev.clientX, ev.clientY);
          vb.x -= u.x - down.ux;
          vb.y -= u.y - down.uy;
          applyViewBox();
          const u2 = toView(ev.clientX, ev.clientY);
          down.ux = u2.x;
          down.uy = u2.y;
        }
      }
      function onDown(ev) {
        if (ev.pointerType === "mouse" && ev.button !== 0) return;
        pointers.set(ev.pointerId, { cx: ev.clientX, cy: ev.clientY });
        window.addEventListener("pointermove", onDragMove);
        window.addEventListener("pointerup", onDragUp);
        window.addEventListener("pointercancel", onDragUp);
        if (pointers.size >= 2 && opts.zoom) {
          const pts = Array.from(pointers.values());
          pinchDist = Math.hypot(pts[0].cx - pts[1].cx, pts[0].cy - pts[1].cy);
          down = null;
          dragging = "";
          hideBrush();
          el.classList.remove("vellumwidget-panning");
          return;
        }
        const u = toView(ev.clientX, ev.clientY);
        down = { cx: ev.clientX, cy: ev.clientY, ux: u.x, uy: u.y };
        dragging = "";
        movedDuringDrag = false;
      }
      function onDragUp(ev) {
        pointers.delete(ev.pointerId);
        const wasPinch = pinchDist > 0;
        if (pointers.size < 2) pinchDist = 0;
        if (pointers.size === 0) {
          window.removeEventListener("pointermove", onDragMove);
          window.removeEventListener("pointerup", onDragUp);
          window.removeEventListener("pointercancel", onDragUp);
        }
        if (wasPinch) {
          down = null;
          dragging = "";
          el.classList.remove("vellumwidget-panning");
          hideBrush();
          reportView();
          return;
        }
        if (dragging === "brush" && down) {
          const p1 = clientToScene(down.cx, down.cy);
          const p2 = clientToScene(ev.clientX, ev.clientY);
          const rect = {
            x0: Math.min(p1.x, p2.x),
            y0: Math.min(p1.y, p2.y),
            x1: Math.max(p1.x, p2.x),
            y1: Math.max(p1.y, p2.y)
          };
          lastBrush = rect;
          const hitKeys = dropInert(brushKeysIn(rect));
          if (opts.select) setSelection(hitKeys);
          shinyInput("brush", Object.assign(
            { keys: hitKeys, x0: rect.x0, y0: rect.y0, x1: rect.x1, y1: rect.y1 },
            brushDataFields(rect)
          ), { priority: "event" });
          hideBrush();
        } else if (dragging === "lasso") {
          const poly = lassoPts.slice();
          const hitKeys = dropInert(lassoKeysIn(poly));
          if (poly.length >= 3) {
            const b = polyBounds(poly);
            lastBrush = b;
            if (opts.select) setSelection(hitKeys);
            shinyInput("brush", Object.assign(
              { keys: hitKeys, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, lasso: true },
              brushDataFields(b)
            ), { priority: "event" });
          }
          clearLasso();
        }
        if (dragging === "pan") reportView();
        el.classList.remove("vellumwidget-panning");
        down = null;
        dragging = "";
      }
      function emitSource(target) {
        if (!provenance) return;
        const pid = vellumIdOf(target);
        const raw = pid ? provenance.byId[pid] : void 0;
        const rows = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
        if (!pid || !rows.length) {
          hideSourcePopover();
          return;
        }
        shinyInput("source", { id: pid, rows, fields: provenance.fields }, { priority: "event" });
        const values = provenance.values ? rows.map((r) => provenance.values[r - 1]).filter(Boolean) : null;
        el.dispatchEvent(
          new window.CustomEvent("vellum:source", {
            detail: { id: pid, rows, fields: provenance.fields, values },
            bubbles: true
          })
        );
        if (values) showSourcePopover(target, values);
      }
      let sourcePopover = null;
      function hideSourcePopover() {
        if (sourcePopover) {
          sourcePopover.remove();
          sourcePopover = null;
        }
      }
      function showSourcePopover(node, values) {
        hideSourcePopover();
        const fields = provenance.fields;
        const head = "<tr>" + fields.map((f) => "<th>" + stripTags(f) + "</th>").join("") + "</tr>";
        const body = values.slice(0, 12).map(
          (row) => "<tr>" + fields.map((f) => {
            var _a;
            return "<td>" + stripTags(String((_a = row[f]) != null ? _a : "")) + "</td>";
          }).join("") + "</tr>"
        ).join("");
        const extra = values.length > 12 ? "<div class='vw-src-more'>+" + (values.length - 12) + " more</div>" : "";
        const pop = document.createElement("div");
        pop.className = "vellumwidget-source";
        pop.setAttribute("role", "dialog");
        pop.style.cssText = "position:absolute;z-index:20;max-height:220px;overflow:auto;background:var(--vw-bg,#fff);color:var(--vw-fg,#111);border:1px solid rgba(0,0,0,.2);border-radius:6px;padding:6px 8px;font:11px/1.4 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18);max-width:320px;";
        pop.innerHTML = "<table style='border-collapse:collapse'><thead>" + head + "</thead><tbody>" + body + "</tbody></table>" + extra;
        const nb = node.getBoundingClientRect();
        const cb = el.getBoundingClientRect();
        pop.style.left = Math.min(nb.left - cb.left + 8, Math.max(0, cb.width - 220)) + "px";
        pop.style.top = Math.max(0, nb.top - cb.top + 8) + "px";
        el.appendChild(pop);
        sourcePopover = pop;
      }
      function onClick(ev) {
        if (movedDuringDrag) {
          movedDuringDrag = false;
          return;
        }
        let k = keyOf(ev.target);
        if (k == null && rasterMode && opts.nearest !== false && elements.length) {
          const u = clientToScene(ev.clientX, ev.clientY);
          const rad = vb ? vb.w * 0.02 : 8;
          k = nearestKeyAt(u.x, u.y, rad);
          if (k != null && inert(k)) k = null;
        }
        shinyInput("click", { key: k }, { priority: "event" });
        if (provenance && provenance.on === "click") emitSource(ev.target);
        const series = swatchSeries(k);
        if (series != null && legendPolicy() !== "select") {
          if (!(ev.detail && ev.detail >= 2)) legendToggle(series);
          return;
        }
        if (k != null) {
          if (opts.select) toggleSelect(k);
        } else {
          clearSelection();
          lastBrush = null;
        }
      }
      function onDblClick(ev) {
        const series = swatchSeries(keyOf(ev.target));
        if (series != null && legendPolicy() !== "select") legendIsolate(series);
      }
      function onWheel(ev) {
        if (!opts.zoom || !vb) return;
        ev.preventDefault();
        const u = toView(ev.clientX, ev.clientY);
        const factor = ev.deltaY < 0 ? 1.2 : 1 / 1.2;
        vb = zoomViewBox(vb, factor, u.x, u.y);
        applyViewBox();
      }
      function onKey(ev) {
        if (ev.key === "Escape") {
          clearSelection();
          clearHover();
          clearClass("vellumwidget-focus");
          hideBrush();
          lastBrush = null;
          if (markFocused() && typeof el.focus === "function") el.focus();
          focusIdx = -1;
          return;
        }
        if (opts.a11y && markFocused()) {
          const k = focusables[focusIdx].key;
          if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
            focusRoving(focusIdx + 1);
            ev.preventDefault();
            return;
          }
          if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
            focusRoving(focusIdx - 1);
            ev.preventDefault();
            return;
          }
          if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
            const series = swatchSeries(k);
            if (series != null && legendPolicy() !== "select") {
              legendToggle(series);
              announce(a11yLabel(k) + (legendOff[series] ? ", hidden" : ", shown"));
            } else {
              if (opts.select) toggleSelect(k);
              announce(a11yLabel(k) + (selected[k] ? ", selected" : ", not selected"));
            }
            ev.preventDefault();
            return;
          }
        }
        if (!opts.zoom || !vb) return;
        if (ev.key === "0") {
          resetZoom();
          ev.preventDefault();
          return;
        }
        const dx = vb.w * 0.12;
        const dy = vb.h * 0.12;
        const cx = vb.x + vb.w / 2;
        const cy = vb.y + vb.h / 2;
        let handled = true;
        switch (ev.key) {
          case "ArrowLeft":
            vb.x -= dx;
            break;
          case "ArrowRight":
            vb.x += dx;
            break;
          case "ArrowUp":
            vb.y -= dy;
            break;
          case "ArrowDown":
            vb.y += dy;
            break;
          case "+":
          case "=":
            vb = zoomViewBox(vb, 1.2, cx, cy);
            break;
          case "-":
          case "_":
            vb = zoomViewBox(vb, 1 / 1.2, cx, cy);
            break;
          default:
            handled = false;
        }
        if (handled) {
          applyViewBox();
          ev.preventDefault();
        }
      }
      const MODE_ICON = { brush: "\u25AD", lasso: "\u25CC", pan: "\u270B" };
      const MODE_LABEL = { brush: "brush-select", lasso: "lasso-select", pan: "pan" };
      function availableModes() {
        const m = [];
        if (opts.brush) m.push("brush");
        if (opts.lasso) m.push("lasso");
        if (opts.zoom) m.push("pan");
        return m;
      }
      function setMode(m) {
        mode = m;
        el.classList.toggle("vellumwidget-mode-pan", m === "pan");
        el.classList.toggle("vellumwidget-mode-lasso", m === "lasso");
        if (m !== "lasso") clearLasso();
        if (toolbarEl) {
          const b = toolbarEl.querySelector('[data-act="mode"]');
          if (b) {
            const modes = availableModes();
            const next = modes[(modes.indexOf(m) + 1) % modes.length];
            b.textContent = MODE_ICON[m];
            b.title = MODE_LABEL[m][0].toUpperCase() + MODE_LABEL[m].slice(1) + " mode" + (next && next !== m ? " (click for " + MODE_LABEL[next] + ")" : "");
            b.classList.toggle("vellumwidget-active", m !== "brush");
          }
        }
      }
      function cycleMode() {
        const modes = availableModes();
        if (modes.length < 2) return;
        setMode(modes[(modes.indexOf(mode) + 1) % modes.length]);
      }
      function exportName() {
        const n = opts.export && opts.export.filename;
        return n && String(n).length ? String(n) : "plot";
      }
      function exportScale() {
        const s = opts.export && opts.export.scale;
        return s && s > 0 ? s : 1;
      }
      function saveSvg() {
        if (!svgEl) return;
        const s = new XMLSerializer().serializeToString(svgEl);
        download(new Blob([s], { type: "image/svg+xml;charset=utf-8" }), exportName() + ".svg");
      }
      function toCanvas(then, fail) {
        if (!svgEl) return fail();
        const s = new XMLSerializer().serializeToString(svgEl);
        const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml;charset=utf-8" }));
        const img = new Image();
        img.onload = function() {
          const k = exportScale();
          const canvas = document.createElement("canvas");
          canvas.width = Math.round((vb0 ? vb0.w : img.width) * k);
          canvas.height = Math.round((vb0 ? vb0.h : img.height) * k);
          const ctx2 = canvas.getContext("2d");
          URL.revokeObjectURL(url);
          if (ctx2) {
            ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
            then(canvas);
          } else {
            fail();
          }
        };
        img.onerror = function() {
          URL.revokeObjectURL(url);
          fail();
        };
        img.src = url;
      }
      function savePng() {
        toCanvas(
          function(canvas) {
            canvas.toBlob(function(b) {
              if (b) download(b, exportName() + ".png");
            });
          },
          saveSvg
          // canvas tainted / unsupported -> fall back to SVG
        );
      }
      function canCopy() {
        const nav = navigator;
        return !!(nav.clipboard && nav.clipboard.write && typeof ClipboardItem !== "undefined");
      }
      function copyPng() {
        if (!canCopy()) return;
        toCanvas(
          function(canvas) {
            canvas.toBlob(function(b) {
              if (!b) return;
              const nav = navigator;
              nav.clipboard.write([new ClipboardItem({ "image/png": b })]).catch(function() {
              });
            });
          },
          function() {
          }
        );
      }
      function toggleFullscreen() {
        const anyEl = el;
        const anyDoc = document;
        if (anyDoc.fullscreenElement) {
          if (anyDoc.exitFullscreen) anyDoc.exitFullscreen();
        } else if (anyEl.requestFullscreen) {
          anyEl.requestFullscreen();
        }
      }
      function zoomToSelection() {
        const rect = lastBrush || unionBbox(elements, selected);
        if (rect) zoomTo(rect);
      }
      function buildToolbar() {
        if (toolbarEl) {
          toolbarEl.remove();
          toolbarEl = null;
        }
        if (!opts.toolbar) return;
        const bar = document.createElement("div");
        bar.className = "vellumwidget-toolbar";
        const btn = (act, label, title, fn) => {
          const b = document.createElement("button");
          b.setAttribute("data-act", act);
          b.textContent = label;
          b.title = title;
          b.addEventListener("click", function(e) {
            e.stopPropagation();
            fn();
          });
          bar.appendChild(b);
          return b;
        };
        if (availableModes().length >= 2) btn("mode", MODE_ICON[mode], "Drag mode", cycleMode);
        if (opts.zoom) {
          btn("zoomsel", "\u2316", "Zoom to selection", zoomToSelection);
          btn("reset", "\u27F2", "Reset zoom", resetZoom);
        }
        btn("svg", "SVG", "Download SVG", saveSvg);
        btn("png", "PNG", "Download PNG", savePng);
        if (canCopy()) btn("copy", "\u29C9", "Copy PNG to clipboard", copyPng);
        btn("full", "\u26F6", "Fullscreen", toggleFullscreen);
        el.appendChild(bar);
        toolbarEl = bar;
      }
      function applyStyling() {
        const s = opts.style || {};
        const setRoot = (name, v) => {
          if (v != null && v !== "") el.style.setProperty(name, String(v));
          else el.style.removeProperty(name);
        };
        setRoot("--vellumwidget-dim-opacity", s.dimOpacity);
        setRoot("--vellumwidget-selected-stroke", s.selectedColor);
        setRoot("--vellumwidget-tip-bg", s.tipBg);
        setRoot("--vellumwidget-tip-fg", s.tipFg);
        setRoot("--vellumwidget-tip-fontsize", s.tipFontSize);
        setRoot("--vellumwidget-tip-maxwidth", s.tipMaxWidth);
        if (s.hoverColor != null && s.hoverColor !== "") {
          el.style.setProperty("--vellumwidget-hl-stroke", s.hoverColor);
          el.classList.add("vellumwidget-hc-all");
        } else {
          el.style.removeProperty("--vellumwidget-hl-stroke");
          el.classList.remove("vellumwidget-hc-all");
        }
        for (let i = 0; i < elements.length; i++) {
          const e = elements[i];
          if (e.hover_color == null && e.selected_color == null && e.legend_for == null) continue;
          const nodes = elementsForKey(e.key);
          for (let j = 0; j < nodes.length; j++) {
            const n = nodes[j];
            if (e.hover_color != null) {
              n.style.setProperty("--vellumwidget-hl-stroke", e.hover_color);
              n.classList.add("vellumwidget-hc");
            }
            if (e.selected_color != null) {
              n.style.setProperty("--vellumwidget-selected-stroke", e.selected_color);
            }
            if (e.legend_for != null) n.classList.add("vellumwidget-legend");
          }
        }
      }
      function a11yLabel(k) {
        const m = meta[k];
        return m && m.tooltip ? stripTags(m.tooltip) : k;
      }
      function focusLabel(k) {
        return a11yLabel(k) + (selected[k] ? ", selected" : "");
      }
      function announce(msg) {
        if (liveRegion && liveRegion.textContent !== msg) liveRegion.textContent = msg;
      }
      function showMarkFocus(i) {
        focusIdx = i;
        const k = focusables[i].key;
        clearClass("vellumwidget-focus");
        addClassForKeys([k], "vellumwidget-focus");
        setHover(k);
        announce(focusLabel(k));
      }
      function onMarkFocus(ev) {
        const k = keyOf(ev.target);
        if (k == null) return;
        const i = focusables.findIndex((f) => f.key === k);
        if (i >= 0) showMarkFocus(i);
      }
      function onMarkBlur(ev) {
        const to = keyOf(ev.relatedTarget);
        if (to == null) {
          focusIdx = -1;
          clearClass("vellumwidget-focus");
        }
      }
      function focusRoving(i) {
        if (!focusables.length) return;
        const dir = i < focusIdx ? -1 : 1;
        if (i < 0) i = 0;
        if (i >= focusables.length) i = focusables.length - 1;
        while (focusables[i] && inert(focusables[i].key)) {
          i += dir;
          if (i < 0 || i >= focusables.length) return;
        }
        if (focusIdx >= 0 && focusables[focusIdx]) {
          focusables[focusIdx].node.setAttribute("tabindex", "-1");
        }
        const f = focusables[i];
        f.node.setAttribute("tabindex", "0");
        showMarkFocus(i);
        const n = f.node;
        if (typeof n.focus === "function") n.focus();
      }
      function markFocused() {
        return opts.a11y && focusIdx >= 0 && !!focusables[focusIdx];
      }
      function buildDataTable() {
        if (tableEl) {
          tableEl.remove();
          tableEl = null;
        }
        if (!opts.a11y || !elements.length) return;
        const tbl = document.createElement("table");
        tbl.className = "vellumwidget-sr-only vellumwidget-data-table";
        const cap = document.createElement("caption");
        cap.textContent = "Data table";
        tbl.appendChild(cap);
        const head = document.createElement("tr");
        const h1 = document.createElement("th");
        h1.setAttribute("scope", "col");
        h1.textContent = "Item";
        const h2 = document.createElement("th");
        h2.setAttribute("scope", "col");
        h2.textContent = "Description";
        head.appendChild(h1);
        head.appendChild(h2);
        tbl.appendChild(head);
        const seen = {};
        for (let i = 0; i < elements.length; i++) {
          const k = elements[i].key;
          if (seen[k]) continue;
          seen[k] = true;
          const tr = document.createElement("tr");
          const th = document.createElement("th");
          th.setAttribute("scope", "row");
          th.textContent = k;
          const td = document.createElement("td");
          td.textContent = a11yLabel(k);
          tr.appendChild(th);
          tr.appendChild(td);
          tbl.appendChild(tr);
        }
        el.appendChild(tbl);
        tableEl = tbl;
      }
      function setupA11y() {
        focusables = [];
        focusIdx = -1;
        if (!opts.a11y || !svgEl) {
          buildDataTable();
          return;
        }
        if (rasterMode) {
          svgEl.setAttribute("role", "img");
          if (opts.alt) {
            svgEl.removeAttribute("aria-labelledby");
            svgEl.setAttribute("aria-label", opts.alt);
          } else if (!svgEl.getAttribute("aria-labelledby") && !svgEl.getAttribute("aria-label")) {
            svgEl.setAttribute("aria-label", "Chart");
          }
          return;
        }
        svgEl.setAttribute("role", "graphics-document");
        svgEl.setAttribute("aria-roledescription", "interactive chart");
        if (opts.alt) {
          svgEl.removeAttribute("aria-labelledby");
          svgEl.setAttribute("aria-label", opts.alt);
        } else if (!svgEl.getAttribute("aria-labelledby") && !svgEl.getAttribute("aria-label")) {
          svgEl.setAttribute("aria-label", "Interactive chart");
        }
        if (!liveRegion) {
          liveRegion = document.createElement("div");
          liveRegion.className = "vellumwidget-sr-only";
          liveRegion.setAttribute("role", "status");
          liveRegion.setAttribute("aria-live", "polite");
          el.appendChild(liveRegion);
        } else {
          liveRegion.textContent = "";
        }
        const seen = {};
        for (let i = 0; i < elements.length; i++) {
          const k = elements[i].key;
          if (seen[k]) continue;
          const nodes = nodesByKey[k];
          if (!nodes || !nodes.length) continue;
          seen[k] = true;
          const node = nodes[0];
          node.setAttribute("role", "graphics-symbol");
          node.setAttribute("tabindex", "-1");
          node.setAttribute("aria-label", a11yLabel(k));
          node.addEventListener("focus", onMarkFocus);
          node.addEventListener("blur", onMarkBlur);
          focusables.push({ key: k, node });
        }
        if (focusables.length) focusables[0].node.setAttribute("tabindex", "0");
        buildDataTable();
      }
      function wire(svg) {
        svg.addEventListener("pointermove", onHoverMove);
        svg.addEventListener("pointerleave", clearHover);
        svg.addEventListener("pointerdown", onDown);
        svg.addEventListener("click", onClick);
        svg.addEventListener("dblclick", onDblClick);
        if (opts.zoom) svg.addEventListener("wheel", onWheel, { passive: false });
        if (opts.zoom || opts.brush) el.classList.add("vellumwidget-gesture");
        el.setAttribute("tabindex", "0");
        el.addEventListener("keydown", onKey);
      }
      return {
        renderValue: function(x) {
          opts = Object.assign(
            // Interactive-by-default: hover/select/brush/lasso/zoom and axis-aware
            // zoom are on unless the payload overrides them. (as_widget() no longer
            // exposes these as flags; the defaults live here.)
            { tooltip: true, hover: true, select: true, brush: true, lasso: true, zoom: true, toolbar: true, nearest: true, a11y: true, selectMode: "multiple", hoverMode: "closest", crosshair: false, navigator: false, axisZoom: true, zoomMarks: "fixed" },
            x.options || {}
          );
          elements = normalizeElements(x.elements);
          panels = normalizePanels(x.panels);
          colorbar = x.colorbar || null;
          interactions = x.interactions || null;
          provenance = x.provenance || null;
          condTagElems = {};
          filtSelElems = {};
          joinOf = {};
          lastHoverKeys = [];
          meta = {};
          groups = {};
          incidentEdges = {};
          neighbourNodes = {};
          edgeEndpoints = {};
          neighbourExpand = null;
          legendIndex = {};
          legendSwatch = {};
          legendOff = {};
          hiddenKeySet = {};
          filteredKeySet = {};
          selected = {};
          lastBrush = null;
          mode = "brush";
          group = opts.group || null;
          for (let i = 0; i < elements.length; i++) {
            const e = elements[i];
            meta[e.key] = e;
            if (e.hover_group != null) (groups[e.hover_group] = groups[e.hover_group] || []).push(e.key);
            if (e.source != null && e.target != null) {
              edgeEndpoints[e.key] = [e.source, e.target];
              (incidentEdges[e.source] = incidentEdges[e.source] || []).push(e.key);
              (incidentEdges[e.target] = incidentEdges[e.target] || []).push(e.key);
              (neighbourNodes[e.source] = neighbourNodes[e.source] || []).push(e.target);
              (neighbourNodes[e.target] = neighbourNodes[e.target] || []).push(e.source);
            }
            if (e.legend != null) {
              const series = Array.isArray(e.legend) ? e.legend : [e.legend];
              for (let s = 0; s < series.length; s++) {
                (legendIndex[series[s]] = legendIndex[series[s]] || []).push(e.key);
              }
            }
            if (e.legend_for != null) (legendSwatch[e.legend_for] = legendSwatch[e.legend_for] || []).push(e.key);
          }
          const sels = interactions && interactions.selections || [];
          for (let i = 0; i < sels.length; i++) {
            const ex = sels[i].expand;
            if (ex && ex.mode === "neighbours") {
              neighbourExpand = {
                degree: Math.max(1, Math.floor(ex.degree || 1)),
                edges: ex.edges !== false
              };
              break;
            }
          }
          if (!holder) {
            stage = document.createElement("div");
            stage.className = "vellumwidget-stage";
            el.appendChild(stage);
            holder = document.createElement("div");
            holder.className = "vellumwidget-svg-holder";
            stage.appendChild(holder);
            dimLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            dimLayer.setAttribute("class", "vellumwidget-dim-layer");
            dimLayer.setAttribute("aria-hidden", "true");
            crosshairLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            crosshairLayer.setAttribute("class", "vellumwidget-crosshair-layer");
            crosshairLayer.setAttribute("aria-hidden", "true");
            stage.appendChild(crosshairLayer);
            stage.appendChild(dimLayer);
            el.appendChild(brushBox);
            el.appendChild(tip);
            tip.addEventListener("pointerenter", function() {
              if (tipHideTimer) {
                clearTimeout(tipHideTimer);
                tipHideTimer = 0;
              }
            });
            tip.addEventListener("pointerleave", function() {
              hideTip();
            });
          }
          holder.innerHTML = x.svg;
          svgEl = holder.querySelector("svg");
          nodesByKey = {};
          if (holder) {
            const keyed = holder.querySelectorAll("[data-key]");
            for (let i = 0; i < keyed.length; i++) {
              const k = keyed[i].getAttribute("data-key");
              if (k != null) (nodesByKey[k] = nodesByKey[k] || []).push(keyed[i]);
            }
          }
          if (svgEl) {
            vb0 = parseViewBox(svgEl.getAttribute("viewBox"));
            if (!vb0) {
              const w = parseFloat(svgEl.getAttribute("width") || "0");
              const h = parseFloat(svgEl.getAttribute("height") || "0");
              if (w && h) vb0 = { x: 0, y: 0, w, h };
            }
            vb = vb0 ? { x: vb0.x, y: vb0.y, w: vb0.w, h: vb0.h } : null;
            hideHighlightOverlay();
            rasterMode = !!opts.raster;
            largeDim = !rasterMode && elements.length > DIM_OVERLAY_MIN;
            selGroup = null;
            hovGroup = null;
            if (rasterMode && dimLayer) {
              selGroup = document.createElementNS(SVGNS, "g");
              hovGroup = document.createElementNS(SVGNS, "g");
              dimLayer.appendChild(selGroup);
              dimLayer.appendChild(hovGroup);
            }
            if (dimLayer && vb0) dimLayer.setAttribute("viewBox", fmtViewBox(vb0));
            if (crosshairLayer && vb0) crosshairLayer.setAttribute("viewBox", fmtViewBox(vb0));
            clearCrosshair();
            if (rasterMode) {
              ensureCanvas();
              sampleBaseRaster();
            } else {
              clearPointData();
            }
            buildSpatialIndex();
            buildGeometry(x.geometry);
            buildHoverAxis();
            wire(svgEl);
            buildToolbar();
            buildNavigator();
            buildColorbar();
            setupInteractions();
            setupAxisZoom();
            xZoom = !!opts.navigator && !rasterMode;
            applyAspect();
            setMode(availableModes()[0] || "brush");
            tip.classList.toggle("vellumwidget-tip-sticky", !!opts.tooltipSticky);
            applyStyling();
            applyLegend();
            setupA11y();
            setupLinking();
            shinyInput("selected", selectedKeys());
            registerProxyHandler();
          }
        },
        resize: function() {
          drawPoints();
        },
        // Server->client proxy seam: vellumwidget_proxy() reaches this instance via
        // HTMLWidgets.find() and calls `_call` (see the "vellumwidget-calls" handler).
        _call: proxyCall,
        // Test seam: the index-backed query functions + hover-mode flags, so the
        // headless suite can verify the spatial index with explicit coordinates
        // (jsdom has no layout, so client->user coordinate mapping is degenerate).
        _test: {
          nearestKeyAt,
          brushKeysIn,
          indexSize: function() {
            return spatialIndex ? spatialIndex.numItems : 0;
          },
          // True-geometry picking (WI-3): whether the payload carried geometry, and
          // the exact distance to one key, so the suite can assert the ranking that
          // the bbox distance would get wrong.
          haveGeometry: function() {
            return haveGeometry;
          },
          geomVertexCount: function() {
            return gx.length;
          },
          distToKey: function(x, y, key) {
            for (let i = 0; i < elements.length; i++) {
              if (elements[i].key === key) return distToElem(x, y, elements[i]);
            }
            return Infinity;
          },
          largeDim: function() {
            return largeDim;
          },
          rasterMode: function() {
            return rasterMode;
          },
          hasCanvas: function() {
            return !!canvasEl;
          },
          pointCount: function() {
            return ptN;
          },
          hoverMode: function() {
            return opts.hoverMode || "closest";
          },
          columnKeys,
          nearestAxisKey,
          legendOff: function() {
            return Object.keys(legendOff).filter((s) => legendOff[s]);
          },
          lassoKeysIn,
          availableModes,
          mode: function() {
            return mode;
          },
          inert,
          dropInert,
          panelAt,
          dataRangeOf,
          brushDataFields,
          hasNavigator: function() {
            return !!navEl;
          },
          navToView,
          hasColorbar: function() {
            return !!colorbarLayer;
          },
          setColorRange,
          colorHidden: function() {
            return Object.keys(colorHiddenSet);
          },
          cbHandleCount: function() {
            return colorbarLayer ? colorbarLayer.querySelectorAll(".vellumwidget-cb-handle").length : 0;
          },
          navWindowFrac: function() {
            if (!navWindow) return null;
            return { left: parseFloat(navWindow.style.left) || 0, width: parseFloat(navWindow.style.width) || 0 };
          },
          axisZoomActive: function() {
            return axisZoomActive;
          },
          panTransform: function() {
            return panGroup ? panGroup.getAttribute("transform") : null;
          },
          panScaleVars: function() {
            if (!panGroup) return null;
            return { ix: panGroup.style.getPropertyValue("--vw-ix"), iy: panGroup.style.getPropertyValue("--vw-iy") };
          },
          // Re-ticked axis labels (their text + device-px position), for asserting the
          // re-tick output without a real layout engine.
          retickLabels: function() {
            if (!retickLayer) return [];
            return Array.prototype.map.call(retickLayer.querySelectorAll("text"), function(t) {
              return { text: t.textContent, x: parseFloat(t.getAttribute("x") || "NaN"), y: parseFloat(t.getAttribute("y") || "NaN") };
            });
          },
          retickGridCount: function() {
            return retickGrid ? retickGrid.querySelectorAll("line").length : 0;
          },
          staticAxesHidden: function() {
            if (!svgEl) return null;
            const nodes = svgEl.querySelectorAll('[role="grid"], [data-vellum-panel^="axis-x"], [data-vellum-panel^="axis-y"]');
            if (!nodes.length) return null;
            return Array.prototype.every.call(nodes, function(n) {
              return n.style.display === "none";
            });
          },
          setView: function(nvb) {
            vb = { x: nvb.x, y: nvb.y, w: nvb.w, h: nvb.h };
            applyViewBox();
          },
          toView,
          // Graph neighbour highlighting: the projection a hover/click acts on, and
          // the reconstructed adjacency + the select_neighbours() config.
          linkedKeys,
          graphAdjacency: function() {
            return {
              incidentEdges,
              neighbourNodes,
              edgeEndpoints,
              neighbourExpand
            };
          }
        }
      };
    }
  });
  function dispatchProxyCall(msg, findInstance) {
    if (!msg || msg.id == null) return;
    const inst = findInstance(msg.id);
    if (inst && typeof inst._call === "function") inst._call(msg.method, msg.args);
  }
  var proxyHandlerRegistered = false;
  function registerProxyHandler() {
    if (proxyHandlerRegistered) return;
    const sh = window.Shiny;
    if (!sh || typeof sh.addCustomMessageHandler !== "function") return;
    proxyHandlerRegistered = true;
    sh.addCustomMessageHandler("vellumwidget-calls", function(msg) {
      dispatchProxyCall(msg, function(id) {
        return HTMLWidgets.find ? HTMLWidgets.find("#" + id) : null;
      });
    });
  }
  registerProxyHandler();
  window.__vellumwidgetTest = {
    rectsIntersect,
    distToBbox,
    distToSegment2,
    distToGeom,
    brushKeys,
    nearestKey,
    zoomViewBox,
    parseViewBox,
    fmtViewBox,
    unionBbox,
    sanitizeTip,
    dispatchProxyCall,
    normalizeElements,
    isZoomedIn,
    userToCanvas,
    nearestSortedIdx,
    columnTolerance,
    pointInPolygon,
    lassoKeys,
    polyBounds,
    nativeToData,
    pxToDataX,
    pxToDataY,
    normalizePanels,
    viewToPan,
    panToView,
    niceTicks,
    fmtTick,
    dataToNative
  };
})();
