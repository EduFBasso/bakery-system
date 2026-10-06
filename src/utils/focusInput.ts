export function focusAndSelectInput(input: HTMLInputElement): void {
  input.focus({ preventScroll: true });
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const targetTop = window.scrollY + input.getBoundingClientRect().top - window.innerHeight / 2;
  window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });

  window.setTimeout(() => {
    input.select();
  }, 250);
}
