function formatToKwanza(value) {
    // Verifica se o valor é numérico antes de tentar formatar
    if (typeof value === 'number') {
      // Arredonda para dois decimais e adiciona espaços de milhares
      const formattedValue = value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      return `Kz ${formattedValue}`;
    } else {
      // Se não for numérico, retorna o valor original
      return value;
    }
  }
  
  module.exports = formatToKwanza;