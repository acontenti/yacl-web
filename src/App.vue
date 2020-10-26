<template>
	<div id="app">
		<router-view/>
		<footer>
			&copy; 2019 Alessandro Contenti
		</footer>
	</div>
</template>

<script>
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export default {
	name: "App",
	beforeDestroy() {
		const user = this.$firebase.auth().currentUser;
		const db = this.$firebase.firestore();
		db.collection("users").doc(user.uid).update({
			sessions: this.$firebase.firestore.FieldValue.arrayRemove(this.$sessionId)
		});
	}
};
</script>

<style lang="scss">
@import "assets/style";

#app {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}
</style>
