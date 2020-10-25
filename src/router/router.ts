import Vue from "vue";
import VueRouter from "vue-router";
import Home from "@/views/Home.vue";
import Main from "@/views/Main.vue";
import Recipe from "@/components/Recipe.vue";
import * as firebase from "firebase/app";
import "firebase/auth";

Vue.use(VueRouter);

const routes = [
	{
		path: "/",
		name: "home",
		component: Home
	},
	{
		path: "/app",
		name: "app",
		component: Main,
		meta: {
			requireAuth: true
		},
		children: [
			{
				name: "recipe",
				path: "recipe/:id",
				component: Recipe
			}
		]
	}
];

const router = new VueRouter({
	mode: "history",
	base: process.env.BASE_URL,
	routes
});

router.beforeEach((to, from, next) => {
	const requireAuth = to.matched.some(record => record.meta.requireAuth);
	const currentUser = firebase.auth().currentUser;
	if (requireAuth && !currentUser) {
		next({name: "home"});
	} else if (!requireAuth && currentUser) {
		next({name: "app"});
	} else {
		next();
	}
});

export default router;
