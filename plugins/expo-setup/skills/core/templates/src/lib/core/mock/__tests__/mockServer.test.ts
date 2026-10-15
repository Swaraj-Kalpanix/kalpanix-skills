import { MockResponse, mockError, mockResponse, mockServer, normalizePath } from '../mockServer';

describe('mockServer', () => {
  afterEach(() => mockServer.reset());

  it('matches method + path and extracts decoded params', () => {
    const handler = jest.fn();
    mockServer.get('/leads/:id/notes/:noteId', handler);
    const match = mockServer.match('GET', '/leads/a%20b/notes/7');
    expect(match?.handler).toBe(handler);
    expect(match?.params).toEqual({ id: 'a b', noteId: '7' });
    expect(mockServer.match('POST', '/leads/1/notes/7')).toBeNull();
    expect(mockServer.match('GET', '/leads/1/notes')).toBeNull();
  });

  it('ignores trailing slashes and a missing leading slash', () => {
    mockServer.get('leads/', jest.fn());
    expect(mockServer.match('GET', '/leads/')).not.toBeNull();
    expect(mockServer.match('GET', 'leads')).not.toBeNull();
  });

  it('prefers the most specific route regardless of registration order', () => {
    const byId = jest.fn();
    const stats = jest.fn();
    mockServer.get('/leads/:id', byId);
    mockServer.get('/leads/stats', stats);
    expect(mockServer.match('GET', '/leads/stats')?.handler).toBe(stats);
    expect(mockServer.match('GET', '/leads/42')?.handler).toBe(byId);
  });

  it('replaces a route registered again for the same method + path', () => {
    const first = jest.fn();
    const second = jest.fn();
    mockServer.get('/x', first);
    mockServer.get('/x', second);
    expect(mockServer.match('GET', '/x')?.handler).toBe(second);
    expect(mockServer.list()).toEqual([{ method: 'GET', pattern: '/x' }]);
  });

  it('unregisters with the returned function', () => {
    const off = mockServer.delete('/x/:id', jest.fn());
    off();
    expect(mockServer.match('DELETE', '/x/1')).toBeNull();
  });

  it('escapes regex characters in literal segments', () => {
    mockServer.get('/files/report.pdf', jest.fn());
    expect(mockServer.match('GET', '/files/reportXpdf')).toBeNull();
    expect(mockServer.match('GET', '/files/report.pdf')).not.toBeNull();
  });

  it('keeps per-route options', () => {
    mockServer.post('/slow', jest.fn(), { latencyMs: 2000 });
    expect(mockServer.match('POST', '/slow')?.options).toEqual({ latencyMs: 2000 });
  });
});

describe('mock responses', () => {
  it('mockResponse carries status, body and headers', () => {
    const r = mockResponse(204, undefined, { 'x-a': '1' });
    expect(r).toBeInstanceOf(MockResponse);
    expect(r).toMatchObject({ status: 204, body: undefined, headers: { 'x-a': '1' } });
  });

  it('mockError produces a NestJS-shaped body', () => {
    expect(mockError(404, 'Lead not found').body).toEqual({ statusCode: 404, message: 'Lead not found', error: 'Not Found' });
    expect(mockError(400, ['a', 'b']).body).toEqual({ statusCode: 400, message: ['a', 'b'], error: 'Bad Request' });
    expect(mockError(418, 'teapot', 'Teapot').body).toEqual({ statusCode: 418, message: 'teapot', error: 'Teapot' });
    expect(mockError(499, 'x').body).toMatchObject({ error: 'Error' });
  });
});

describe('normalizePath', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['leads', '/leads'],
    ['/leads///', '/leads'],
  ])('%p → %p', (input, output) => {
    expect(normalizePath(input)).toBe(output);
  });
});
