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
            ordemAsc: true,
            carregando: true
        }
    },
    computed: {
        mercados() {
            return extrairMercadosUnicos(this.itens);
        },
        itensFiltrados() {
            return filtrarOfertas(this.itens, this.busca, this.filtroMercado, this.ordemAsc);
        }
    },
    async mounted() {
        this.itens = await fetchAllOffers();
        this.carregando = false;
    }
}).mount('#app');