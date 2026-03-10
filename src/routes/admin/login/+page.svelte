<script lang="ts">
  import { enhance } from '$app/forms';

  let { data } = $props<{ form?: { error?: string } }>();
</script>

<svelte:head>
  <title>Login — Admin</title>
</svelte:head>

<div class="min-h-screen bg-zinc-900 flex items-center justify-center p-8">
  <div class="w-full max-w-sm px-8 py-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 shadow-xl">
    <h1 class="text-2xl font-semibold text-amber-500 mb-8 text-center">Admin Login</h1>
    <form
      method="POST"
      action="/admin/login"
      use:enhance
      class="space-y-6"
    >
      <div class="space-y-2">
        <label for="password" class="block text-sm font-medium text-zinc-400">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          class="w-full px-4 py-3 rounded-lg bg-zinc-900/80 border border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          placeholder="Enter admin password"
          autocomplete="current-password"
        />
      </div>
      {#if data.form?.error}
        <p class="text-sm text-red-400">{data.form.error}</p>
      {/if}
      <button
        type="submit"
        class="w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-900 font-medium transition mt-2"
      >
        Sign in
      </button>
    </form>
    <p class="mt-8 pt-6 text-center border-t border-zinc-700/50">
      <a href="/" class="text-sm text-zinc-500 hover:text-amber-500 transition">← Back to site</a>
    </p>
  </div>
</div>
