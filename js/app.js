// js/app.js
import { fetchAllOffers } from './loader.js';
import { filtrarOfertas, valoresUnicos, contarPorCategoria } from './filters.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            itens: [],
            buscaInput: '',       // o que o usuário digita
            busca: '',            // aplicado (com debounce)
            filtroCategoria: '',
            filtroCanal: '',
            filtroLoja: '',
            precoMinInput: '',
            precoMaxInput: '',
            ordem: 'data_desc',   // data_desc | data_asc | preco_asc | preco_desc
            limite: 60,
            carregando: true
        }
    },
    computed: {
        categorias() { return valoresUnicos(this.itens, 'categoria'); },
        canais() { return valoresUnicos(this.itens, 'canal'); },
        lojas() { return valoresUnicos(this.itens, 'loja'); },
        contagem() { return contarPorCategoria(this.itens); },
        ultimaAtualizacao() {
            let mx = '';
            for (const i of this.itens) if (i.data && i.data > mx) mx = i.data;
            return mx;
        },
        filtrosAtivos() {
            return !!(this.busca || this.filtroCategoria || this.filtroCanal ||
                this.filtroLoja || this.precoMinInput || this.precoMaxInput);
        },
        itensFiltrados() {
            const [por, dir] = this.ordem.split('_');
            const num = v => (v === '' || v == null || isNaN(v)) ? null : Number(v);
            return filtrarOfertas(this.itens, {
                busca: this.busca,
                canal: this.filtroCanal,
                loja: this.filtroLoja,
                categoria: this.filtroCategoria,
                precoMin: num(this.precoMinInput),
                precoMax: num(this.precoMaxInput),
                ordenarPor: por,
                ordemAsc: dir === 'asc',
            });
        },
        itensVisiveis() { return this.itensFiltrados.slice(0, this.limite); }
    },
    watch: {
        buscaInput(v) {
            clearTimeout(this._debounce);
            this._debounce = setTimeout(() => { this.busca = v; }, 250);
        },
        busca() { this.limite = 60; },
        filtroCategoria() { this.limite = 60; },
        filtroCanal() { this.limite = 60; },
        filtroLoja() { this.limite = 60; },
        precoMinInput() { this.limite = 60; },
        precoMaxInput() { this.limite = 60; },
        ordem() { this.limite = 60; }
    },
    methods: {
        setCategoria(c) { this.filtroCategoria = (this.filtroCategoria === c) ? '' : c; },
        mais() { this.limite += 60; },
        limparFiltros() {
            this.buscaInput = ''; this.busca = '';
            this.filtroCategoria = ''; this.filtroCanal = ''; this.filtroLoja = '';
            this.precoMinInput = ''; this.precoMaxInput = '';
        }
    },
    async mounted() {
        this.itens = await fetchAllOffers();
        this.carregando = false;
    }
}).mount('#app');
