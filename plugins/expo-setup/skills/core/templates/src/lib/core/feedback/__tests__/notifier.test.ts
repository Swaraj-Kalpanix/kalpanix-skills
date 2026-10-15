import { notify, setNotifier } from '../notifier';

describe('notifier', () => {
  afterEach(() => setNotifier(null));

  it('routes to the installed notifier', () => {
    const notifier = { success: jest.fn(), error: jest.fn(), info: jest.fn() };
    setNotifier(notifier);
    notify.success('ok');
    notify.error('bad');
    notify.info('fyi');
    expect(notifier.success).toHaveBeenCalledWith('ok');
    expect(notifier.error).toHaveBeenCalledWith('bad');
    expect(notifier.info).toHaveBeenCalledWith('fyi');
  });

  it('falls back to success for info when the notifier has no info', () => {
    const notifier = { success: jest.fn(), error: jest.fn() };
    setNotifier(notifier);
    notify.info('fyi');
    expect(notifier.success).toHaveBeenCalledWith('fyi');
  });

  it('logs to the console in development until a notifier is installed', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    notify.success('saved');
    notify.error('failed');
    expect(log).toHaveBeenCalledWith('[notify:success] saved');
    expect(warn).toHaveBeenCalledWith('[notify:error] failed');
    log.mockRestore();
    warn.mockRestore();
  });
});
