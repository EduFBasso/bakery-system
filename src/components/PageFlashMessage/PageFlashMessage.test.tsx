import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageFlashMessage } from './PageFlashMessage';

describe('PageFlashMessage', () => {
  it('oferece botão focado para fechar a mensagem persistente com Enter', () => {
    const onClose = vi.fn();

    render(
      <PageFlashMessage
        open
        message="Cadastro descartado com sucesso."
        type="success"
        autoCloseMs={0}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Fechar' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(closeButton, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
