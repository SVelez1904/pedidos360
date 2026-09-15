import { ClpCurrencyPipe } from './clp-currency.pipe';

describe('ClpCurrencyPipe', () => {
  let pipe: ClpCurrencyPipe;

  beforeEach(() => {
    pipe = new ClpCurrencyPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('formats numeric values as Chilean Pesos ($X.XXX)', () => {
    const formatted = pipe.transform(25990);
    expect(formatted).toContain('25.990');
    expect(formatted).toContain('$');
  });

  it('handles zero gracefully', () => {
    const formatted = pipe.transform(0);
    expect(formatted).toContain('0');
  });

  it('handles null or undefined gracefully', () => {
    expect(pipe.transform(null)).toBe('$0');
    expect(pipe.transform(undefined)).toBe('$0');
  });
});
