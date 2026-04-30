// js/filters.js
export function filtrarOfertas(itens, busca, mercado, ordemAsc) {
    let resultado = itens.filter(i => {
        const termo = busca.toLowerCase();
        const matchBusca = i.produto.toLowerCase().includes(termo) ||
            i.marca.toLowerCase().includes(termo);

        const matchMercado = mercado === '' || i.mercado === mercado;

        return matchBusca && matchMercado;
    });

    // Ordenação
    return resultado.sort((a, b) => {
        return ordemAsc ? a.preco - b.preco : b.preco - a.preco;
    });
}

export function extrairMercadosUnicos(itens) {
    return [...new Set(itens.map(i => i.mercado))].sort();
}