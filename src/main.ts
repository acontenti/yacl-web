import Vue from "vue";
import App from "./App.vue";
import router from "./router/router";
import store from "./store/store";
import VueSweetalert2 from "vue-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AxiosPlugin from "@/plugins/axios";
import FirebasePlugin from "@/plugins/firebase";
import SessionPlugin from "@/plugins/session";

Vue.config.productionTip = false;
Vue.use(VueSweetalert2);
Vue.use(AxiosPlugin);
Vue.use(FirebasePlugin);
Vue.use(SessionPlugin);

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount("#app");
