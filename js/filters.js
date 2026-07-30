// js/filters.js — filtros para ofertas de tech/promo (Telegram)

/**
 * Filtra por categoria + canal + loja + busca (título e texto),
 * e ordena por data (padrão) ou preço.
 */
export function filtrarOfertas(itens, busca, canal, loja, categoria, ordenarPor, ordemAsc) {
    const termo = busca.toLowerCase().trim();

    let base = itens.filter(i =>
        (!categoria || i.categoria === categoria) &&
        (!canal || i.canal === canal) &&
        (!loja || i.loja === loja)
    );

    if (termo) {
        base = base.filter(i =>
            (i.produto || '').toLowerCase().includes(termo) ||
            (i.texto || '').toLowerCase().includes(termo)
        );
    }

    return ordenar(base, ordenarPor, ordemAsc);
}

function ordenar(itens, por, asc) {
    const arr = itens.slice();
    if (por === 'preco') {
        // itens sem preço vão sempre pro fim
        arr.sort((a, b) => {
            const pa = (a.preco == null) ? Infinity : a.preco;
            const pb = (b.preco == null) ? Infinity : b.preco;
            if (pa === Infinity && pb === Infinity) return 0;
            if (pa === Infinity) return 1;
            if (pb === Infinity) return -1;
            return asc ? pa - pb : pb - pa;
        });
    } else { // data
        arr.sort((a, b) => {
            const da = a.data || '', db = b.data || '';
            return asc ? (da < db ? -1 : da > db ? 1 : 0) : (da > db ? -1 : da < db ? 1 : 0);
        });
    }
    return arr;
}

/** Lista de valores únicos de uma chave (ordenada). */
export function valoresUnicos(itens, chave) {
    return [...new Set(itens.map(i => i[chave]).filter(Boolean))].sort();
}

/** Contagem por categoria. */
export function contarPorCategoria(itens) {
    const m = {};
    for (const i of itens) m[i.categoria] = (m[i.categoria] || 0) + 1;
    return m;
}
