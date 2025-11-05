import axios from 'axios';
import "aieditor/dist/style.css";
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';