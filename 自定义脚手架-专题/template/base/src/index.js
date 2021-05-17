import './css/base.css';
import './css/index.scss';
import Vue from 'vue';
import App from 'components/App';

new Vue({
  render: (h) => h(App),
}).$mount('#app');
