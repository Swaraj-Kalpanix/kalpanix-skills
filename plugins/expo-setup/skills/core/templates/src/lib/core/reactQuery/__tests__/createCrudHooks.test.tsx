import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as z from 'zod';

import { setNotifier } from '../../feedback/notifier';
import { NestCrudQueryBuilder } from '../../query/nestCrudQuery.builder';
import { CrudService } from '../../services/crud.service';
import { createQueryWrapper } from '../../test/createQueryWrapper';
import { bodyOf, installFakeHttp, type FakeHttp } from '../../test/fakeHttp';
import { createCrudHooks } from '../createCrudHooks';
import { createQueryKeys } from '../queryKeys';

const LeadSchema = z.object({ id: z.number(), name: z.string() });
type Lead = z.infer<typeof LeadSchema>;

const leadService = new CrudService<Lead, unknown, { name: string }>({
  endpoint: '/leads',
  schema: LeadSchema,
  query: new NestCrudQueryBuilder({ limit: 2 }),
});
const leadKeys = createQueryKeys('leads');
const leadQueries = createCrudHooks(leadService, leadKeys);

const page = (data: Lead[], page = 1, pageCount = 1) => ({ data, count: data.length, total: pageCount * 2, page, pageCount });

describe('createCrudHooks', () => {
  let fake: FakeHttp;
  beforeEach(() => {
    fake = installFakeHttp();
    setNotifier({ success: jest.fn(), error: jest.fn() });
  });
  afterEach(() => {
    fake.restore();
    setNotifier(null);
  });

  it('exposes the keys and defaults them from the endpoint', () => {
    expect(leadQueries.keys).toBe(leadKeys);
    expect(createCrudHooks(leadService).keys.lists()).toEqual(['/leads', 'list']);
  });

  it('useList fetches one page under keys.list(params)', async () => {
    fake.reply(() => [200, page([{ id: 1, name: 'A' }])]);
    const { client, wrapper } = createQueryWrapper();
    const { result } = await renderHook(() => leadQueries.useList({ page: 1 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([{ id: 1, name: 'A' }]);
    expect(client.getQueryData(leadKeys.list({ page: 1 }))).toBeDefined();
  });

  it('useList keeps the previous page visible while the next one loads', async () => {
    fake.reply(async (config) => {
      const isPage2 = config.url?.includes('page=2');
      return [200, page([{ id: isPage2 ? 3 : 1, name: 'x' }])];
    });
    const { wrapper } = createQueryWrapper();
    const { result, rerender } = await renderHook(({ p }: { p: number }) => leadQueries.useList({ page: p }), {
      wrapper,
      initialProps: { p: 1 },
    });
    await waitFor(() => expect(result.current.data?.data[0].id).toBe(1));

    fake.reply(() => new Promise(() => {})); // page 2 never resolves
    await rerender({ p: 2 });
    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data?.data[0].id).toBe(1);
  });

  it('useInfiniteList pages through the service', async () => {
    fake.reply((config) => {
      const p = config.url?.includes('page=2') ? 2 : 1;
      return [200, page([{ id: p * 10, name: 'x' }], p, 2)];
    });
    const { wrapper } = createQueryWrapper();
    const { result } = await renderHook(() => leadQueries.useInfiniteList({ search: '' }), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items.map((l) => l.id)).toEqual([10, 20]));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('useDetail fetches by id and is skipped without one', async () => {
    fake.reply(() => [200, { id: 5, name: 'E' }]);
    const { wrapper } = createQueryWrapper();

    const skipped = await renderHook(() => leadQueries.useDetail(null), { wrapper });
    await renderHook(() => leadQueries.useDetail(''), { wrapper });
    expect(skipped.result.current.fetchStatus).toBe('idle');
    expect(fake.requests).toHaveLength(0);

    const { result } = await renderHook(() => leadQueries.useDetail(5), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ id: 5, name: 'E' }));
    expect(fake.requests[0].url).toBe('/leads/5');
  });

  it('useCreate posts, invalidates lists and still calls the caller onSuccess', async () => {
    fake.reply(() => [201, { id: 9, name: 'New' }]);
    const onSuccess = jest.fn();
    const { client, wrapper } = createQueryWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => leadQueries.useCreate({ onSuccess }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'New' });
    });
    expect(bodyOf(fake.requests[0])).toEqual({ name: 'New' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: leadKeys.lists() });
    expect(onSuccess).toHaveBeenCalledWith({ id: 9, name: 'New' }, { name: 'New' }, undefined, expect.anything());
  });

  it('useUpdate patches, writes the detail cache and invalidates lists', async () => {
    fake.reply(() => [200, { id: 3, name: 'Renamed' }]);
    const { client, wrapper } = createQueryWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => leadQueries.useUpdate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 3, data: { name: 'Renamed' } });
    });
    expect(fake.requests[0]).toMatchObject({ method: 'patch', url: '/leads/3' });
    expect(client.getQueryData(leadKeys.detail(3))).toEqual({ id: 3, name: 'Renamed' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: leadKeys.lists() });
  });

  it('useRemove deletes, drops the detail cache and invalidates lists', async () => {
    fake.reply(() => [200, '']);
    const { client, wrapper } = createQueryWrapper();
    client.setQueryData(leadKeys.detail(4), { id: 4, name: 'Old' });
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => leadQueries.useRemove(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(4);
    });
    expect(fake.requests[0]).toMatchObject({ method: 'delete', url: '/leads/4' });
    expect(client.getQueryData(leadKeys.detail(4))).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: leadKeys.lists() });
  });

  it('does not touch the cache when a mutation fails', async () => {
    fake.reply(() => [500, { message: 'down' }]);
    const { client, wrapper } = createQueryWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => leadQueries.useCreate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'x' }).catch(() => undefined);
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
