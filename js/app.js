// js/app.js
import { fetchAllOffers } from './loader.js';
import { filtrarOfertas, valoresUnicos, contarPorCategoria } from './filters.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            itens: [],
            busca: '',
            filtroCategoria: '',
            filtroCanal: '',
            filtroLoja: '',
            ordenarPor: 'data',   // 'data' | 'preco'
            ordemAsc: false,      // data: false = mais recentes primeiro
            limite: 60,
            carregando: true
        }
    },
    computed: {
        categorias() { return valoresUnicos(this.itens, 'categoria'); },
        canais() { return valoresUnicos(this.itens, 'canal'); },
        lojas() { return valoresUnicos(this.itens, 'loja'); },
        contagem() { return contarPorCategoria(this.itens); },
        itensFiltrados() {
            return filtrarOfertas(
                this.itens, this.busca, this.filtroCanal, this.filtroLoja,
                this.filtroCategoria, this.ordenarPor, this.ordemAsc
            );
        },
        itensVisiveis() { return this.itensFiltrados.slice(0, this.limite); }
    },
    watch: {
        busca() { this.limite = 60; },
        filtroCategoria() { this.limite = 60; },
        filtroCanal() { this.limite = 60; },
        filtroLoja() { this.limite = 60; }
    },
    methods: {
        setCategoria(c) { this.filtroCategoria = (this.filtroCategoria === c) ? '' : c; },
        mais() { this.limite += 60; },
        toggleOrdem() {
            // alterna: data recente -> preço menor -> preço maior -> data recente
            if (this.ordenarPor === 'data') { this.ordenarPor = 'preco'; this.ordemAsc = true; }
            else if (this.ordemAsc) { this.ordemAsc = false; }
            else { this.ordenarPor = 'data'; this.ordemAsc = false; }
        },
        rotuloOrdem() {
            if (this.ordenarPor === 'data') return 'Mais recentes';
            return this.ordemAsc ? 'Menor preço' : 'Maior preço';
        }
    },
    async mounted() {
        this.itens = await fetchAllOffers();
        this.carregando = false;
    }
}).mount('#app');
