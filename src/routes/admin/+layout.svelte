<script lang="ts">
  import './admin.css';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  let { data, children } = $props();

  const showNav = $derived($page.url.pathname !== '/admin/login');
</script>

{#if showNav}
  <div class="min-h-screen bg-zinc-900 text-zinc-100">
    <header class="border-b border-zinc-700 bg-zinc-900/95 sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold text-amber-500">Admin</h1>
          <div class="flex gap-4">
            <a href="/" class="text-sm text-zinc-500 hover:text-amber-500">← Home</a>
            <form method="POST" action="/admin/logout" use:enhance>
              <button type="submit" class="text-sm text-zinc-500 hover:text-amber-500">Log out</button>
            </form>
          </div>
        </div>
        <nav class="flex gap-1" role="tablist">
          <a
            href="/admin/newsletters"
            class="px-4 py-2 rounded-t text-sm font-medium transition {$page.url.pathname.startsWith('/admin/newsletters') || $page.url.pathname === '/admin' ? 'bg-zinc-800 text-amber-500 border-b-2 border-amber-500 -mb-px' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}"
          >
            Newsletters
          </a>
          <a
            href="/admin/subscribers"
            class="px-4 py-2 rounded-t text-sm font-medium transition {$page.url.pathname === '/admin/subscribers' ? 'bg-zinc-800 text-amber-500 border-b-2 border-amber-500 -mb-px' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}"
          >
            Subscribers
          </a>
        </nav>
      </div>
    </header>
    <main class="max-w-4xl mx-auto px-6 py-6">
      {@render children()}
    </main>
  </div>
{:else}
  {@render children()}
{/if}
