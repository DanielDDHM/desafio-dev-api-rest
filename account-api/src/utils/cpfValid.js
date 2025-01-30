export default function isValidCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (factor) =>
    cpf
      .slice(0, factor - 1)
      .split('')
      .reduce((sum, num, index) => sum + parseInt(num) * (factor - index), 0) %
      11 <
    2
      ? 0
      : 11 -
        (cpf
          .slice(0, factor - 1)
          .split('')
          .reduce((sum, num, index) => sum + parseInt(num) * (factor - index), 0) %
          11);

  return calcDigit(10) === parseInt(cpf[9]) && calcDigit(11) === parseInt(cpf[10]);
}
