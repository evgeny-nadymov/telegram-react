/**
 * Write a string to a DataView.
 * @param {DataView} dataView - dataView object to write a string.
 * @param {*} offset - offset in bytes
 * @param {*} string - string to write
 */
function writeString (dataView, offset, string) {
  for (let i = 0; i < string.length; i++) {
    dataView.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * C molloc class interface
 */
class _AllocatedPointer {
  /**
   * Allocate memory
   * @param {emModule} Module - Emscripten module object
   * @param {number} size - size of allocated memory in bytes.
   * @param {boolean} isSigned
   * @param {boolean} isFloat
   */
  constructor (emModule, size, isSigned, isFloat) {
    this._size = size;
    this._module = emModule;

    switch (this._size) {
      case 1:
        this._heapArray = isSigned ? this._module.HEAP8 : this._module.HEAPU8;
        break;
      case 2:
        this._heapArray = isSigned ? this._module.HEAP16 : this._module.HEAPU16;
        break;
      case 4:
        this._heapArray = isSigned ? this._module.HEAP32 : this._module.HEAPU32;
        break;
      default:
        // Pointer is treated as buffer
        this._heapArray = this._module.HEAPU8;
    }

    if (isFloat) {
      // When floating nuber set, override setting.
      this._size = 4;
      this._heapArray = this._module.HEAPF32;
    }

    // Note that is uses the original size parameter.
    this._pointer = this._module._malloc(size);
  }

  /**
   * Free memory
   */
  free () {
    this._module._free(this.pointer);
  }

  /**
   * Get pointer (reference). The pointer is meaningless in the JS context
   * so it is only useful when calling WASM functions.
   */
  get pointer () {
    return this._pointer;
  }

  /**
   * Dereference the pointer to get a value.
   */
  get value () {
    let bitsToShift = 0;
    switch (this._size) {
      case 2:
        bitsToShift = 1;
        break;
      case 4:
        bitsToShift = 2;
        break;
      default:
        throw new Error('Pointer can be only deferenced as integer-sized');
    }
    return this._heapArray[this.pointer >> bitsToShift];
  }

  /**
   * Dereference the pointer to set a value.
   */
  set value (valueToSet) {
    let bitsToShift = 0;
    switch (this._size) {
      case 2:
        bitsToShift = 1;
        break;
      case 4:
        bitsToShift = 2;
        break;
      default:
        throw new Error('Pointer can be only deferenced as integer-sized');
    }
    this._heapArray[this.pointer >> bitsToShift] = valueToSet;
  }
}

/**
 * C malloc allocated signed int32 object
 */
class _Int32Pointer extends _AllocatedPointer {
  /**
   * Allocate and assign number
   * @param {emModule} Module - Emscripten module object
   * @param {number|undefined} value - If undefined the value is not assigned to the memory.
   */
  constructor (emModule, value) {
    super(emModule, 4, true, false);
    if (typeof value !== 'undefined') {
      this.value = value;
    }
  }
}

/**
 * C malloc allocated unsigned int32 object
 */
class _Uint32Pointer extends _AllocatedPointer {
  /**
   * Allocate and assign number
   * @param {emModule} Module - Emscripten module object
   * @param {number|undefined} value - If undefined the value is not assigned to the memory.
   */
  constructor (emModule, value) {
    super(emModule, 4, false, false);
    if (typeof value !== 'undefined') {
      this.value = value;
    }
  }
}

/**
 * C malloc allocated float buffer object
 */
class _AllocatedBuffer extends _AllocatedPointer {
  /**
   * Allocate buffer
   * @param {emModule} Module - Emscripten module object
   * @param {number} length - Size of buffer in the number of units, NOT in bytes
   * @param {number} unitSize - Size of a unit in bytes
   * @param {bool} isSigned
   * @param {bool} isFloat
   */
  constructor (emModule, length, unitSize, isSigned, isFloat) {
    super(emModule, length * unitSize, isSigned, isFloat);
    let bitsToShift = 0;
    switch (unitSize) {
      case 1:
        this._heapArray = isSigned ? this._module.HEAP8 : this._module.HEAPU8;
        bitsToShift = 0;
        break;
      case 2:
        this._heapArray = isSigned ? this._module.HEAP16 : this._module.HEAPU16;
        bitsToShift = 1;
        break;
      case 4:
        this._heapArray = isSigned ? this._module.HEAP32 : this._module.HEAPU32;
        bitsToShift = 2;
        break;
      default:
        throw new Error('Unit size must be an integer-size');
    }
    if (isFloat) {
      this._heapArray = this._module.HEAPF32;
      bitsToShift = 2;
    }
    let offset = this._pointer >> bitsToShift;
    this._buffer = this._heapArray.subarray(offset, offset + length);
    this._length = length;
  }

  set (array, offset) {
    this._buffer.set(array, offset);
  }

  subarray (begin, end) {
    return this._buffer.subarray(begin, end);
  }

  get length () {
    return this._length;
  }
}

/**
 * C malloc allocated float buffer object
 */
class _Float32Buffer extends _AllocatedBuffer {
  constructor (emModule, length) {
    super(emModule, length, 4, true, true);
  }
}

/**
 * C malloc allocated unsigned uint8 buffer object
 */
class _Uint8Buffer extends _AllocatedBuffer {
  /**
   * Allocate and assign number
   * @param {number|undefined} value - If undefined the value is not assigned to the memory.
   */
  constructor (emModule, length) {
    super(emModule, length, 1, false, false);
  }
}

/**
 * Abstracts C pointers and malloc for Emscripten modules.
 */
class EmscriptenMemoryAllocator {
  constructor (emModule) {
    this._module = emModule;
  }

  mallocInt32 (value) {
    return new _Int32Pointer(this._module, value);
  }

  mallocUint32 (value) {
    return new _Uint32Pointer(this._module, value);
  }

  mallocUint8Buffer (length) {
    return new _Uint8Buffer(this._module, length);
  }

  mallocFloat32Buffer (length) {
    return new _Float32Buffer(this._module, length);
  }
}

module.exports = { writeString, EmscriptenMemoryAllocator };
