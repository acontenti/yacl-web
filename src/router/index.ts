import {route} from "quasar/wrappers";
import VueRouter from "vue-router";
import routes from "./routes";
import firebase from "firebase";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation
 */

export default route(function ({Vue}) {
	Vue.use(VueRouter);

	const Router = new VueRouter({
		scrollBehavior: () => ({x: 0, y: 0}),
		routes,

		// Leave these as is and change from quasar.conf.js instead!
		// quasar.conf.js -> build -> vueRouterMode
		// quasar.conf.js -> build -> publicPath
		mode: process.env.VUE_ROUTER_MODE,
		base: process.env.VUE_ROUTER_BASE
	});
	Router.beforeEach((to, from, next) => {
		const requireAuth = to.matched.some(record => record.meta.requireAuth);
		const currentUser = firebase.auth().currentUser;
		if (requireAuth) {
			if (!currentUser) {
				next({name: "login", query: {redirect: to.fullPath}});
			} else {
				next();
			}
		} else if (currentUser) {
			next({name: "app"});
		} else {
			next();
		}
	});
	return Router;
});
