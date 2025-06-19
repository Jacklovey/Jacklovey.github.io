import {
  formatDate,
  formatFileSize,
  debounce,
  throttle,
  deepClone,
  generateRandomString,
  isValidEmail,
  isValidPhone,
  getUrlParameter,
  setUrlParameter,
  removeUrlParameter,
  isMobile,
  getDeviceType
} from '../helpers';

describe('helpers', () => {
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2023-12-25T10:30:45');
      const formatted = formatDate(date);
      expect(formatted).toBe('2023-12-25 10:30:45');
    });

    it('should format date with custom format', () => {
      const date = new Date('2023-12-25T10:30:45');
      const formatted = formatDate(date, 'YYYY/MM/DD');
      expect(formatted).toBe('2023/12/25');
    });

    it('should handle date string input', () => {
      const formatted = formatDate('2023-12-25T10:30:45');
      expect(formatted).toBe('2023-12-25 10:30:45');
    });

    it('should handle timestamp input', () => {
      const timestamp = new Date('2023-12-25T10:30:45').getTime();
      const formatted = formatDate(timestamp);
      expect(formatted).toBe('2023-12-25 10:30:45');
    });

    it('should return invalid date message for invalid input', () => {
      expect(formatDate('invalid')).toBe('无效日期');
      expect(formatDate(null)).toBe('无效日期');
      expect(formatDate(undefined)).toBe('无效日期');
      expect(formatDate({})).toBe('无效日期');
    });

    it('should handle single digit months and days', () => {
      const date = new Date('2023-01-05T03:05:09');
      const formatted = formatDate(date);
      expect(formatted).toBe('2023-01-05 03:05:09');
    });
  });

  describe('formatFileSize', () => {
    it('should format zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format terabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    it('should handle decimal precision', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(99);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should execute function immediately on first call', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should ignore subsequent calls within limit', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should allow execution after limit period', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should clone dates', () => {
      const date = new Date('2023-12-25');
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
      expect(cloned instanceof Date).toBe(true);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4]];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone objects', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: [3, 4]
        }
      };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
      expect(cloned.b.d).not.toBe(obj.b.d);
    });

    it('should handle nested complex structures', () => {
      const complex = {
        date: new Date('2023-12-25'),
        array: [1, { nested: true }],
        object: {
          deep: {
            value: 42
          }
        }
      };
      const cloned = deepClone(complex);
      expect(cloned).toEqual(complex);
      expect(cloned.date).not.toBe(complex.date);
      expect(cloned.array).not.toBe(complex.array);
      expect(cloned.object.deep).not.toBe(complex.object.deep);
    });
  });

  describe('generateRandomString', () => {
    it('should generate string with default length', () => {
      const str = generateRandomString();
      expect(str).toHaveLength(8);
      expect(typeof str).toBe('string');
    });

    it('should generate string with custom length', () => {
      const str = generateRandomString(12);
      expect(str).toHaveLength(12);
    });

    it('should generate different strings on multiple calls', () => {
      const str1 = generateRandomString(16);
      const str2 = generateRandomString(16);
      expect(str1).not.toBe(str2);
    });

    it('should only contain valid characters', () => {
      const str = generateRandomString(100);
      const validChars = /^[A-Za-z0-9]+$/;
      expect(validChars.test(str)).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct Chinese phone numbers', () => {
      expect(isValidPhone('13812345678')).toBe(true);
      expect(isValidPhone('15987654321')).toBe(true);
      expect(isValidPhone('18765432109')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('12812345678')).toBe(false); // starts with 12
      expect(isValidPhone('1381234567')).toBe(false); // too short
      expect(isValidPhone('138123456789')).toBe(false); // too long
      expect(isValidPhone('abcdefghijk')).toBe(false); // not numbers
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('URL parameter functions', () => {
    const mockUrl = 'https://example.com?param1=value1&param2=value2';

    describe('getUrlParameter', () => {
      it('should get existing parameter', () => {
        expect(getUrlParameter('param1', mockUrl)).toBe('value1');
        expect(getUrlParameter('param2', mockUrl)).toBe('value2');
      });

      it('should return null for non-existing parameter', () => {
        expect(getUrlParameter('nonexistent', mockUrl)).toBe(null);
      });
    });

    describe('setUrlParameter', () => {
      it('should set new parameter', () => {
        const result = setUrlParameter('newParam', 'newValue', 'https://example.com');
        expect(result).toBe('https://example.com/?newParam=newValue');
      });

      it('should update existing parameter', () => {
        const result = setUrlParameter('param1', 'newValue', mockUrl);
        expect(result).toContain('param1=newValue');
        expect(result).toContain('param2=value2');
      });
    });

    describe('removeUrlParameter', () => {
      it('should remove existing parameter', () => {
        const result = removeUrlParameter('param1', mockUrl);
        expect(result).not.toContain('param1=value1');
        expect(result).toContain('param2=value2');
      });

      it('should handle removing non-existing parameter', () => {
        const result = removeUrlParameter('nonexistent', mockUrl);
        expect(result).toContain('param1=value1');
        expect(result).toContain('param2=value2');
      });
    });
  });

  describe('Device detection', () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      });
    });

    describe('isMobile', () => {
      it('should detect mobile devices', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          writable: true
        });
        expect(isMobile()).toBe(true);

        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Linux; Android 10)',
          writable: true
        });
        expect(isMobile()).toBe(true);
      });

      it('should detect desktop devices', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          writable: true
        });
        expect(isMobile()).toBe(false);
      });
    });

    describe('getDeviceType', () => {
      it('should detect mobile', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          writable: true
        });
        expect(getDeviceType()).toBe('mobile');
      });

      it('should detect tablet', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
          writable: true
        });
        expect(getDeviceType()).toBe('tablet');
      });

      it('should detect desktop', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          writable: true
        });
        expect(getDeviceType()).toBe('desktop');
      });
    });
  });
});
