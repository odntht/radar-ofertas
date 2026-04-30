// js/app.js
import { fetchAllOffers } from './loader.js';
import { filtrarOfertas, extrairMercadosUnicos } from './filters.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            itens: [],
            busca: '',
            filtroMercado: '',
            filtroCategoria: '',
            ordemAsc: true,
            carregando: true
        }
    },
    computed: {
        // Lista dinâmica de mercados para o select
        mercados() {
            return extrairMercadosUnicos(this.itens);
        },
        // Lista dinâmica de categorias para o select
        categorias() {
            return [...new Set(this.itens.map(i => i.categoria))]
                .filter(Boolean)
                .sort();
        },
        // Retorna os itens processados pelos filtros e busca
        itensFiltrados() {
            return filtrarOfertas(
                this.itens,
                this.busca,
                this.filtroMercado,
                this.ordemAsc,
                this.filtroCategoria
            );
        }
    },
    async mounted() {
        // Carrega todos os JSONs da pasta /dados via API do GitHub
        this.itens = await fetchAllOffers();
        this.carregando = false;
    }
}).mount('#app');