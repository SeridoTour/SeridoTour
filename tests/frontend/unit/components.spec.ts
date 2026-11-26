import { mount, RouterLinkStub } from '@vue/test-utils';
import { nextTick } from 'vue';
import RatingStars from '../../../apps/frontend/src/components/RatingStars.vue';
import ConfirmDialog from '../../../apps/frontend/src/components/ConfirmDialog.vue';
import PlaceCard from '../../../apps/frontend/src/components/PlaceCard.vue';
import { useFavoritesStore } from '../../../apps/frontend/src/stores/favorites';

describe('FE-COMP | Componentes Vue reais', () => {
  it('FE-COMP-01 exibe nota acessível e arredonda estrelas preenchidas', () => {
    const wrapper = mount(RatingStars, { props: { rating: 3.6 } });
    expect(wrapper.attributes('aria-label')).toBe('3.6 de 5 estrelas');
    expect(wrapper.findAll('.filled')).toHaveLength(4);
  });
  it('FE-COMP-02 abre e fecha modal ao mudar propriedade open', async () => {
    const wrapper = mount(ConfirmDialog, { props: { id: 'delete', open: true, title: 'Excluir roteiro' } });
    await nextTick();
    expect((wrapper.element as HTMLDialogElement).open).toBe(true);
    expect(wrapper.attributes('aria-labelledby')).toBe('delete-title');
    await wrapper.setProps({ open: false });
    expect((wrapper.element as HTMLDialogElement).open).toBe(false);
  });
  it('FE-COMP-03 emite confirmação e cancelamento', async () => {
    const wrapper = mount(ConfirmDialog, { props: { id: 'delete', open: false, title: 'Excluir', confirmLabel: 'Excluir agora' } });
    expect(wrapper.get('button[type="submit"]').text()).toBe('Excluir agora');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    await wrapper.get('button[aria-label="Fechar"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
  it('FE-COMP-04 bloqueia botões e Escape durante processamento', async () => {
    const wrapper = mount(ConfirmDialog, { props: { id: 'delete', open: true, title: 'Excluir', busy: true } });
    expect(wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined)).toBe(true);
    expect(wrapper.get('button[type="submit"]').text()).toBe('Aguarde...');
    await wrapper.trigger('cancel');
    expect(wrapper.emitted('close')).toBeUndefined();
  });
  it('FE-COMP-05 Escape emite fechamento quando o modal está livre', async () => {
    const wrapper = mount(ConfirmDialog, { props: { id: 'delete', open: true, title: 'Excluir' } });
    await wrapper.trigger('cancel');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
  it('FE-COMP-06 cartão apresenta destino, link e seleção por foco', async () => {
    const place = { id: 'p1', name: 'Açude', city: 'Caicó', description: 'Paisagem', category: 'Natureza', latitude: -6.4, longitude: -37.1 };
    const wrapper = mount(PlaceCard, { props: { place }, global: { stubs: { RouterLink: RouterLinkStub } } });
    expect(wrapper.text()).toContain('Açude');
    expect(wrapper.text()).toContain('Caicó');
    expect(wrapper.findAllComponents(RouterLinkStub).some((link) => link.props('to') === '/places/p1')).toBe(true);
    await wrapper.trigger('focusin');
    expect(wrapper.emitted('select')).toEqual([['p1']]);
    const favorite = wrapper.get('button');
    expect(favorite.attributes('aria-pressed')).toBe('false');
    await favorite.trigger('click');
    expect(favorite.attributes('aria-pressed')).toBe('true');
    expect(useFavoritesStore().has('places', 'p1')).toBe(true);
    await favorite.trigger('click');
    expect(favorite.attributes('aria-pressed')).toBe('false');
  });
});
