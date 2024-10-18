const calculateStartDate = (period) => {
  const currentDate = new Date();

  switch (period) {
    case 'dia':
      return currentDate;
    case 'semana':
      const startDateSemana = new Date(currentDate);
      startDateSemana.setDate(currentDate.getDate() - 7);
      return startDateSemana;
    case 'mes':
      const startDateMes = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      return startDateMes;
    case 'trimestre':
      const quarterStartMonth = Math.floor(currentDate.getMonth() / 3) * 3;
      const startDateTrimestre = new Date(currentDate.getFullYear(), quarterStartMonth, 1);
      return startDateTrimestre;
    case 'ano':
      const startDateAno = new Date(currentDate.getFullYear(), 0, 1);
      return startDateAno;
    default:
      return currentDate;
  }
};

module.exports = calculateStartDate;
