// js/filters.js

/**
 * Filtra as ofertas com base em múltiplos critérios
 * Implementa busca em dois níveis: primeiro exata, depois parcial.
 */
export function filtrarOfertas(itens, busca, mercado, ordemAsc, categoria) {
    const termo = busca.toLowerCase().trim();

    // 1. Filtros de Categorização (Mercado e Categoria)
    let baseFiltrada = itens.filter(i => {
        const matchMercado = mercado === '' || i.mercado === mercado;
        const matchCategoria = !categoria || i.categoria === categoria;
        return matchMercado && matchCategoria;
    });

    // Se não houver termo de busca, retorna apenas os filtros de categoria/mercado
    if (!termo) {
        return ordenar(baseFiltrada, ordemAsc);
    }

    // 2. Busca Nível 1: Exata (Palavra inteira)
    // \b garante que o termo seja uma palavra isolada (evita Vinho achar Vinha)
    const regexExata = new RegExp(`\\b${termo}\\b`, 'i');
    let resultado = baseFiltrada.filter(i =>
        regexExata.test(i.produto) || regexExata.test(i.marca)
    );

    // 3. Busca Nível 2: Parcial (Fallback)
    // Se não encontrou nada com a palavra exata, tenta encontrar o trecho dentro das palavras
    if (resultado.length === 0) {
        resultado = baseFiltrada.filter(i =>
            i.produto.toLowerCase().includes(termo) ||
            i.marca.toLowerCase().includes(termo)
        );
    }

    return ordenar(resultado, ordemAsc);
}

/**
 * Função auxiliar para ordenação por preço
 */
function ordenar(itens, ordemAsc) {
    return itens.sort((a, b) => {
        return ordemAsc ? a.preco - b.preco : b.preco - a.preco;
    });
}

/**
 * Extrai lista de mercados sem repetição
 */
export function extrairMercadosUnicos(itens) {
    return [...new Set(itens.map(i => i.mercado))].sort();
}