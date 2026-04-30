// js/loader.js

/**
 * FUNÇÃO 1: Descoberta (Substitui a necessidade do index.json manual)
 * Busca na API do GitHub a lista de arquivos dentro da pasta /dados
 */
async function discoverJsonFiles() {
    const USER = 'seu-usuario-github'; // ⚠️ Altere para seu usuário
    const REPO = 'nome-do-seu-repositorio'; // ⚠️ Altere para o nome do repo
    const FOLDER = 'dados';

    // URL da API de Conteúdos do GitHub
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FOLDER}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao acessar API do GitHub");

        const files = await response.json();

        // Filtra apenas arquivos .json e ignora o index.json (se existir)
        return files
            .filter(file => file.name.endsWith('.json') && file.name !== 'index.json')
            .map(file => file.name);

    } catch (error) {
        console.error("Falha na descoberta de arquivos:", error);
        return [];
    }
}

/**
 * FUNÇÃO 2: Carregamento (Fetch)
 * Recebe uma lista de nomes de arquivos e baixa o conteúdo de cada um
 */
async function loadContentFromFiles(fileList) {
    try {
        const promises = fileList.map(fileName =>
            fetch(`./dados/${fileName}`).then(res => {
                if (!res.ok) throw new Error(`Erro ao baixar ${fileName}`);
                return res.json();
            })
        );

        const results = await Promise.all(promises);
        return results.flat(); // Une as arrays de todos os arquivos em uma só

    } catch (error) {
        console.error("Erro no processamento dos arquivos JSON:", error);
        return [];
    }
}

/**
 * FUNÇÃO EXPORTADA: O "Cérebro" do Loader
 * Orquestra a descoberta e o carregamento para o app.js
 */
export async function fetchAllOffers() {
    // Passo 1: Descobre quais arquivos existem na pasta
    const jsonFiles = await discoverJsonFiles();

    if (jsonFiles.length === 0) return [];

    // Passo 2: Carrega os dados de todos esses arquivos
    return await loadContentFromFiles(jsonFiles);
}