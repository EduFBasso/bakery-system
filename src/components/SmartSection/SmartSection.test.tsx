import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SmartSection } from './SmartSection';

describe('SmartSection', () => {
  it('devolve o foco ao controle quando uma seção aberta é fechada externamente', () => {
    const { container, rerender } = render(
      <SmartSection title="Produtos" isOpen>
        <button type="button">Adicionar</button>
      </SmartSection>
    );

    const addButton = container.querySelector('button:not([aria-label])') as HTMLButtonElement;
    addButton.focus();

    rerender(
      <SmartSection title="Produtos" isOpen={false}>
        <button type="button">Adicionar</button>
      </SmartSection>
    );

    expect(container.querySelector('button[aria-label="Abrir seção Produtos"]')).toHaveFocus();
  });

  it('mantém o foco no controle ao fechar a própria seção', () => {
    const { getByRole } = render(
      <SmartSection title="Produtos" defaultOpen>
        <button type="button">Adicionar</button>
      </SmartSection>
    );

    const toggleButton = getByRole('button', { name: 'Fechar seção Produtos' });
    toggleButton.focus();
    fireEvent.click(toggleButton);

    expect(getByRole('button', { name: 'Abrir seção Produtos' })).toHaveFocus();
  });
});
