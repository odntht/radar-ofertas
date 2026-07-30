// js/filters.js — filtros para ofertas de tech/promo (Telegram)

/** Normaliza texto: minúsculo e sem acento (para busca tolerante). */
export function normalize(s) {
    return (s == null ? '' : String(s))
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

/**
 * Filtra por categoria + canal + loja + preço + busca (título e texto),
 * e ordena por data ou preço.
 * `opts`: { busca, canal, loja, categoria, soComPreco, precoMin, precoMax, ordenarPor, ordemAsc }
 * Usa o campo pré-normalizado `_s` (montado no loader) para a busca.
 */
export function filtrarOfertas(itens, opts) {
    const {
        busca = '', canal = '', loja = '', categoria = '',
        soComPreco = false, precoMin = null, precoMax = null,
        ordenarPor = 'data', ordemAsc = false,
    } = opts || {};

    const termo = normalize(busca).trim();

    let base = itens.filter(i =>
        (!categoria || i.categoria === categoria) &&
        (!canal || i.canal === canal) &&
        (!loja || i.loja === loja) &&
        (!soComPreco || i.preco != null) &&
        (precoMin == null || (i.preco != null && i.preco >= precoMin)) &&
        (precoMax == null || (i.preco != null && i.preco <= precoMax))
    );

    if (termo) {
        base = base.filter(i => (i._s || '').includes(termo));
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
