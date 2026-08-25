import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('não renderiza com 1 página', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('chama onChange ao clicar em uma página', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('3'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('desabilita botão anterior na primeira página', () => {
    render(<Pagination page={1} totalPages={5} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')[0]).toBeDisabled();
  });

  it('marca a página ativa', () => {
    render(<Pagination page={2} totalPages={5} onChange={vi.fn()} />);
    expect(screen.getByText('2').className).toContain('active');
  });
});