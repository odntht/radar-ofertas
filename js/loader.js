// js/loader.js
import { normalize } from './filters.js';

const USER = 'odntht';
const REPO = 'radar-ofertas';
const FOLDER = 'dados';

// Fallback: canais conhecidos. Usado quando a API do GitHub falha
// (rate-limit de 60 req/h por IP, offline, etc.) — assim o site nunca fica vazio.
const FALLBACK_FILES = [
    'achadinhos3d.json',
    'linguicapromocoes.json',
    'pcdofafapromo.json',
    'peperaiohardware.json',
];

/**
 * Descobre os arquivos .json em /dados via API do GitHub.
 * Em caso de falha, cai no FALLBACK_FILES.
 */
async function discoverJsonFiles() {
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FOLDER}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const files = await response.json();
            const names = files
                .filter(file => file.name.endsWith('.json'))
                .map(file => file.name);
            if (names.length) return names;
        } else {
            console.warn('API do GitHub indisponível:', response.status, response.statusText);
        }
    } catch (error) {
        console.warn('Falha ao descobrir arquivos via API, usando fallback:', error);
    }
    return FALLBACK_FILES;
}

/** Baixa e concatena o conteúdo de cada arquivo (tolerante a falha por arquivo). */
async function loadContentFromFiles(fileList) {
    const results = await Promise.all(
        fileList.map(fileName =>
            fetch(`./${FOLDER}/${fileName}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Erro ao baixar ${fileName}`);
                    return res.json();
                })
                .catch(err => {
                    console.warn(err.message);
                    return []; // um arquivo quebrado não derruba o resto
                })
        )
    );
    return results.flat();
}

/** Pré-computa o campo de busca normalizado (`_s`) uma vez, no carregamento. */
function preparar(itens) {
    for (const i of itens) {
        i._s = normalize((i.produto || '') + ' ' + (i.texto || ''));
    }
    return itens;
}

/** Orquestra descoberta + carregamento + preparo. */
export async function fetchAllOffers() {
    const jsonFiles = await discoverJsonFiles();
    if (jsonFiles.length === 0) return [];
    const itens = await loadContentFromFiles(jsonFiles);
    return preparar(itens);
}
