<template>
  <div id="app">
    <EmailSender />
  </div>
</template>

<script>
import EmailSender from "./components/EmailSender.vue";

export default {
  components: {
    EmailSender,
  },
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
}
</style>
