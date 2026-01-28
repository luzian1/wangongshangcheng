// 为db.js模块创建mock
jest.mock('../src/config/db', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery
  };
});

const db = require('../src/config/db');

describe('Database Query Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have a query method', () => {
    expect(typeof db.query).toBe('function');
  });

  test('should call the query method with correct parameters', async () => {
    const mockResult = { rows: [{ id: 1, name: 'test' }] };
    db.query.mockResolvedValue(mockResult);

    const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    expect(result).toEqual(mockResult);
  });

  test('should handle query errors', async () => {
    const mockError = new Error('Database error');
    db.query.mockRejectedValue(mockError);

    await expect(db.query('SELECT * FROM users', [])).rejects.toThrow('Database error');
  });
});