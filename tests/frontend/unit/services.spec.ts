import { api } from '../../../apps/frontend/src/services/api';
import { placesService } from '../../../apps/frontend/src/services/places';
import { itinerariesService } from '../../../apps/frontend/src/services/itineraries';

jest.mock('../../../apps/frontend/src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe('FE-API | Contratos dos serviços HTTP', () => {
  const input = { title: 'Roteiro', description: 'Visita', duracaoDias: 2, placeIds: ['p1'] };
  beforeEach(() => {
    jest.resetAllMocks();
    for (const method of ['get', 'post', 'patch', 'delete'] as const) (api[method] as jest.Mock).mockResolvedValue({ data: { id: 'registro-1' } });
  });
  it('FE-API-01 envia os parâmetros de paginação de destinos', async () => {
    await placesService.getPage(2, 20);
    expect(api.get).toHaveBeenCalledWith('/places', { params: { page: 2, limit: 20 } });
  });
  it('FE-API-02 extrai os destinos da resposta paginada', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: 'p1' }], meta: { total: 1 } } });
    await expect(placesService.getAll()).resolves.toEqual([{ id: 'p1' }]);
    expect(api.get).toHaveBeenCalledWith('/places', { params: { page: 1, limit: 100 } });
  });
  it.each([undefined, 'p1'])('FE-API-03 salva multipart de destino com id %s', async (id) => {
    const form = new FormData();
    form.set('name', 'Açude');
    await expect(placesService.save(form, id)).resolves.toEqual({ id: 'registro-1' });
    expect(id ? api.patch : api.post).toHaveBeenCalledWith(id ? '/places/p1' : '/places', form);
    expect(id ? api.post : api.patch).not.toHaveBeenCalled();
  });
  it.each([['public', '/itineraries/public'], ['mine', '/itineraries/meus'], ['all', '/itineraries']] as const)(
    'FE-API-04 consulta escopo %s', async (scope, endpoint) => {
      await itinerariesService.getAll(scope);
      expect(api.get).toHaveBeenCalledWith(endpoint);
    },
  );
  it.each([false, true])('FE-API-05 consulta detalhe público=%s', async (isPublic) => {
    await itinerariesService.getById('i1', isPublic);
    expect(api.get).toHaveBeenCalledWith(`/itineraries/${isPublic ? 'public/' : ''}i1`);
  });
  it.each([undefined, 'i1'])('FE-API-06 salva roteiro com id %s', async (id) => {
    await itinerariesService.save(input, id);
    expect(id ? api.patch : api.post).toHaveBeenCalledWith(id ? '/itineraries/i1' : '/itineraries', input);
  });
  it('FE-API-07 envia motivo da rejeição e não acrescenta corpo na publicação', async () => {
    await itinerariesService.transition('i1', 'reject', 'Ajustar descrição');
    expect(api.patch).toHaveBeenNthCalledWith(1, '/itineraries/i1/reject', { reason: 'Ajustar descrição' });
    await itinerariesService.transition('i1', 'publish');
    expect(api.patch).toHaveBeenNthCalledWith(2, '/itineraries/i1/publish', undefined);
  });
  it('FE-API-08 encaminha falhas HTTP ao consumidor', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API indisponível'));
    await expect(placesService.getById('p1')).rejects.toThrow('API indisponível');
  });
  it('FE-API-09 remove destino e roteiro pelos endpoints correspondentes', async () => {
    await placesService.remove('p1');
    await itinerariesService.remove('i1');
    expect(api.delete).toHaveBeenNthCalledWith(1, '/places/p1');
    expect(api.delete).toHaveBeenNthCalledWith(2, '/itineraries/i1');
  });
});
