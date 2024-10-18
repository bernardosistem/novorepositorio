const Clientes = require('../clientes/Cliente2');

// Middleware para calcular o número de clientes agendados
const calcularNumeroClientesAgendados = async (req, res, next) => {
    try {
        // Contar o total de clientes agendados na tabela de Clientes
        const totalClientes = await Clientes.count();

        // Definir o número de clientes agendados na variável de solicitação (req)
        req.numeroClientesAgendados = totalClientes;

        // Chamar o próximo middleware na pilha
        next();
    } catch (error) {
        console.error('Erro ao calcular o número de clientes agendados:', error);
        // Em caso de erro, prosseguir para o próximo middleware
        next();
    }
};

module.exports = calcularNumeroClientesAgendados;
