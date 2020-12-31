<template>
	<q-layout id="register">
		<q-form class="q-gutter-md column items-center" @submit="register">
			<h3 class="q-my-sm">YACL COOKBOOK</h3>
			<q-input v-model="name" counter label="Name" maxlength="24" type="text"/>
			<q-input v-model="email" label="E-mail" type="email"/>
			<q-input v-model="password" :rules="passwordRules" counter label="Password" no-error-icon type="password"/>
			<q-btn color="primary" label="sign up" type="submit"/>
			<router-link :to="{name:'login'}">Already have an account?</router-link>
		</q-form>
		<q-footer bordered class="bg-grey-14 q-px-sm q-py-xs text-left">
			Copyright &copy; 2019-{{ new Date().getFullYear() }}, Alessandro Contenti
		</q-footer>
	</q-layout>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";

@Component({
	meta: {
		titleTemplate: (title: string) => `${title} - Sign up`
	}
})
export default class Register extends Vue {
	name = "";
	email = "";
	password = "";
	passwordRules = [(val: string) => val.length >= 6 || "At least 6 characters"];

	register() {
		this.$firebase.auth().createUserWithEmailAndPassword(this.email, this.password)
			.then(userCredential => userCredential.user?.updateProfile({
				displayName: this.name
			}))
			.catch(error => {
				if (error.code && error.message) {
					this.$q.dialog({type: "error", message: error.message});
				} else this.$q.dialog({type: "error", message: error.toString()});
			});
	}
};
</script>

<style lang="scss">
#register {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	align-items: center;
	justify-content: center;
	text-align: center;
}
</style>
