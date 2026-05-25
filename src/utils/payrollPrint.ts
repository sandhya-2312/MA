/** Activates print-only layout for the salary attendance sheet. */
export function printSalariesSheet() {
  document.body.classList.add('salaries-print-active');

  const cleanup = () => {
    document.body.classList.remove('salaries-print-active');
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(cleanup, 2000);

  window.print();
}
