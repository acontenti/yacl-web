import {RouteConfig} from "vue-router";
import Login from "layouts/Login.vue";
import Main from "layouts/Main.vue";
import Recipe from "pages/Recipe.vue";
import Home from "pages/Home.vue";
import Register from "layouts/Register.vue";

const routes: RouteConfig[] = [
	{
		path: "/login",
		name: "login",
		component: Login
	},
	{
		path: "/register",
		name: "register",
		component: Register
	},
	{
		path: "/app",
		component: Main,
		meta: {
			requireAuth: true
		},
		children: [
			{
				name: "app",
				path: "",
				component: Home
			},
			{
				name: "recipe",
				path: "recipe/:id",
				component: Recipe
			}
		]
	},
	{
		path: "",
		redirect: {name: "login"}
	}
];

export default routes;
