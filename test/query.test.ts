import { encodeQueryParam, type QueryStyle } from '../src/query';

describe('query parameter encoding', () => {
  describe('encodeQueryParam', () => {
    describe('form style', () => {
      it('should encode simple values', () => {
        const result = encodeQueryParam({
          name: 'id',
          value: 123,
          style: 'form',
          explode: false
        });
        expect(result).toBe('id=123');
      });

      it('should encode string values', () => {
        const result = encodeQueryParam({
          name: 'name',
          value: 'John Doe',
          style: 'form',
          explode: false
        });
        expect(result).toBe('name=John%20Doe');
      });

      it('should encode arrays with explode=false', () => {
        const result = encodeQueryParam({
          name: 'ids',
          value: [1, 2, 3],
          style: 'form',
          explode: false
        });
        expect(result).toBe('ids=1%2C2%2C3');
      });

      it('should encode arrays with explode=true', () => {
        const result = encodeQueryParam({
          name: 'ids',
          value: [1, 2, 3],
          style: 'form',
          explode: true
        });
        expect(result).toBe('ids=1&ids=2&ids=3');
      });

      it('should encode objects with explode=false', () => {
        const result = encodeQueryParam({
          name: 'filter',
          value: { name: 'John', age: 30 },
          style: 'form',
          explode: false
        });
        expect(result).toBe('filter=name%2CJohn%2Cage%2C30');
      });

      it('should encode objects with explode=true', () => {
        const result = encodeQueryParam({
          name: 'filter',
          value: { name: 'John', age: 30 },
          style: 'form',
          explode: true
        });
        // Object entries can be in any order
        expect(result).toMatch(/^(name=John&age=30|age=30&name=John)$/);
      });

      it('should handle null objects', () => {
        const result = encodeQueryParam({
          name: 'empty',
          value: null,
          style: 'form',
          explode: false
        });
        expect(result).toBe('empty=');
      });
    });

    describe('spaceDelimited style', () => {
      it('should encode arrays with explode=false using spaces', () => {
        const result = encodeQueryParam({
          name: 'tags',
          value: ['red', 'green', 'blue'],
          style: 'spaceDelimited',
          explode: false
        });
        expect(result).toBe('tags=red%20green%20blue');
      });

      it('should fall back to form style for arrays with explode=true', () => {
        const result = encodeQueryParam({
          name: 'tags',
          value: ['red', 'green', 'blue'],
          style: 'spaceDelimited',
          explode: true
        });
        expect(result).toBe('tags=red&tags=green&tags=blue');
      });

      it('should fall back to form style for non-arrays', () => {
        const result = encodeQueryParam({
          name: 'id',
          value: 123,
          style: 'spaceDelimited',
          explode: false
        });
        expect(result).toBe('id=123');
      });

      it('should fall back to form style for objects', () => {
        const result = encodeQueryParam({
          name: 'filter',
          value: { name: 'John' },
          style: 'spaceDelimited',
          explode: false
        });
        expect(result).toBe('filter=name%2CJohn');
      });
    });

    describe('pipeDelimited style', () => {
      it('should encode arrays with explode=false using pipes', () => {
        const result = encodeQueryParam({
          name: 'categories',
          value: ['tech', 'science', 'art'],
          style: 'pipeDelimited',
          explode: false
        });
        expect(result).toBe('categories=tech%7Cscience%7Cart');
      });

      it('should fall back to form style for arrays with explode=true', () => {
        const result = encodeQueryParam({
          name: 'categories',
          value: ['tech', 'science', 'art'],
          style: 'pipeDelimited',
          explode: true
        });
        expect(result).toBe('categories=tech&categories=science&categories=art');
      });

      it('should fall back to form style for non-arrays', () => {
        const result = encodeQueryParam({
          name: 'id',
          value: 456,
          style: 'pipeDelimited',
          explode: false
        });
        expect(result).toBe('id=456');
      });

      it('should fall back to form style for objects', () => {
        const result = encodeQueryParam({
          name: 'user',
          value: { id: 123, name: 'Jane' },
          style: 'pipeDelimited',
          explode: true
        });
        expect(result).toMatch(/^(id=123&name=Jane|name=Jane&id=123)$/);
      });
    });

    describe('deepObject style', () => {
      it('should encode objects using deep object notation', () => {
        const result = encodeQueryParam({
          name: 'user',
          value: { name: 'John', details: { age: 30, city: 'NYC' } },
          style: 'deepObject',
          explode: false
        });
        expect(result).toContain('user%5Bname%5D=John');
        expect(result).toContain('user%5Bdetails%5D%5Bage%5D=30');
        expect(result).toContain('user%5Bdetails%5D%5Bcity%5D=NYC');
      });

      it('should encode arrays using deep object notation', () => {
        const result = encodeQueryParam({
          name: 'items',
          value: ['apple', 'banana', 'cherry'],
          style: 'deepObject',
          explode: false
        });
        expect(result).toContain('items%5B0%5D=apple');
        expect(result).toContain('items%5B1%5D=banana');
        expect(result).toContain('items%5B2%5D=cherry');
      });

      it('should fall back to form style for primitive values', () => {
        const result = encodeQueryParam({
          name: 'simple',
          value: 'value',
          style: 'deepObject',
          explode: false
        });
        expect(result).toBe('simple=value');
      });

      it('should handle null values', () => {
        const result = encodeQueryParam({
          name: 'nullable',
          value: null,
          style: 'deepObject',
          explode: false
        });
        expect(result).toBe('nullable=');
      });
    });

    describe('unsupported styles', () => {
      it('should throw error for unsupported query styles', () => {
        expect(() => {
          encodeQueryParam({
            name: 'test',
            value: 'value',
            style: 'unsupported' as QueryStyle,
            explode: false
          });
        }).toThrow("query param style 'unsupported' not implemented");
      });
    });

    describe('edge cases', () => {
      it('should handle empty arrays', () => {
        const result = encodeQueryParam({
          name: 'empty',
          value: [],
          style: 'form',
          explode: false
        });
        expect(result).toBe('');
      });

      it('should handle empty objects', () => {
        const result = encodeQueryParam({
          name: 'empty',
          value: {},
          style: 'form',
          explode: false
        });
        expect(result).toBe('');
      });

      it('should handle boolean values', () => {
        const result = encodeQueryParam({
          name: 'active',
          value: true,
          style: 'form',
          explode: false
        });
        expect(result).toBe('active=true');
      });

      it('should handle zero values', () => {
        const result = encodeQueryParam({
          name: 'count',
          value: 0,
          style: 'form',
          explode: false
        });
        expect(result).toBe('count=0');
      });

      it('should handle special characters in strings', () => {
        const result = encodeQueryParam({
          name: 'search',
          value: 'hello world & more',
          style: 'form',
          explode: false
        });
        expect(result).toBe('search=hello%20world%20%26%20more');
      });

      it('should handle mixed type arrays', () => {
        const result = encodeQueryParam({
          name: 'mixed',
          value: [1, 'text', true],
          style: 'form',
          explode: false
        });
        expect(result).toBe('mixed=1%2Ctext%2Ctrue');
      });

      it('should handle nested arrays in objects', () => {
        const result = encodeQueryParam({
          name: 'complex',
          value: { tags: ['tag1', 'tag2'], count: 5 },
          style: 'deepObject',
          explode: false
        });
        expect(result).toContain('complex%5Btags%5D%5B0%5D=tag1');
        expect(result).toContain('complex%5Btags%5D%5B1%5D=tag2');
        expect(result).toContain('complex%5Bcount%5D=5');
      });
    });
  });
});