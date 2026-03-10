<script lang="ts">
  import { enhance } from '$app/forms';

  let { data } = $props<{
    newsletters: { id: string; subject: string; body_html: string; sent_at: string | null; created_at: string }[];
    loadError?: string | null;
    form?: {
      createError?: string;
      createSuccess?: boolean;
      updateError?: string;
      updateSuccess?: boolean;
      deleteError?: string;
      deleteSuccess?: boolean;
      sendError?: string;
      sendSuccess?: boolean;
      sendCount?: number;
    };
  }>();

  let editingId = $state<string | null>(null);
  let editSubject = $state('');
  let editBody = $state('');

  function startEdit(n: { id: string; subject: string; body_html: string }) {
    editingId = n.id;
    editSubject = n.subject;
    editBody = n.body_html;
  }

  function cancelEdit() {
    editingId = null;
  }
</script>

<svelte:head>
  <title>Newsletters — Admin</title>
</svelte:head>

{#if data.loadError}
  <div class="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-300">
    <p class="font-medium">Could not load data</p>
    <p class="text-sm mt-1">{data.loadError}</p>
    <p class="text-xs mt-2 text-zinc-500">Check Supabase config and that tables exist. See README for SQL.</p>
  </div>
{/if}

<!-- Create newsletter -->
<section class="mb-10">
  <h2 class="text-lg font-semibold text-amber-500 mb-4">Create Newsletter</h2>
  <form method="POST" action="?/create" use:enhance class="space-y-3">
    <div>
      <label for="subject" class="block text-sm text-zinc-400 mb-1">Subject</label>
      <input
        id="subject"
        name="subject"
        type="text"
        required
        class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-zinc-100 focus:ring-1 focus:ring-amber-500"
        placeholder="Newsletter subject"
      />
    </div>
    <div>
      <label for="body_html" class="block text-sm text-zinc-400 mb-1">Body (HTML)</label>
      <textarea
        id="body_html"
        name="body_html"
        rows="6"
        required
        class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-zinc-100 font-mono text-sm focus:ring-1 focus:ring-amber-500"
        placeholder="<p>Hello...</p>"
      ></textarea>
    </div>
    <button type="submit" class="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-zinc-900 font-medium">
      Create
    </button>
  </form>
  {#if data.form?.createError}
    <p class="mt-2 text-sm text-red-400">{data.form.createError}</p>
  {/if}
  {#if data.form?.createSuccess}
    <p class="mt-2 text-sm text-green-400">Newsletter created.</p>
  {/if}
</section>

<!-- Newsletters list -->
<section>
  <h2 class="text-lg font-semibold text-amber-500 mb-4">Newsletters</h2>
  <div class="space-y-3">
    {#each data.newsletters as n (n.id)}
      <div class="rounded bg-zinc-800 border border-zinc-700 p-4 flex flex-wrap items-start gap-3">
        {#if editingId === n.id}
          <form method="POST" action="?/update" use:enhance class="flex-1 min-w-0 space-y-2">
            <input type="hidden" name="id" value={n.id} />
            <input
              name="subject"
              bind:value={editSubject}
              class="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-600 text-sm"
            />
            <textarea
              name="body_html"
              bind:value={editBody}
              rows="4"
              class="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-600 text-sm font-mono"
            ></textarea>
            <div class="flex gap-2">
              <button type="submit" class="px-2 py-1 text-sm rounded bg-amber-600 hover:bg-amber-500 text-zinc-900">
                Save
              </button>
              <button type="button" onclick={cancelEdit} class="px-2 py-1 text-sm rounded bg-zinc-600 hover:bg-zinc-500">
                Cancel
              </button>
            </div>
          </form>
        {:else}
          <div class="flex-1 min-w-0">
            <p class="font-medium">{n.subject}</p>
            <p class="text-xs text-zinc-500 mt-1">
              {n.sent_at ? `Sent ${new Date(n.sent_at).toLocaleString()}` : 'Draft'} · {n.body_html.slice(0, 60)}…
            </p>
          </div>
          <div class="flex gap-2">
            <button
              onclick={() => startEdit(n)}
              class="px-2 py-1 text-sm rounded bg-zinc-600 hover:bg-zinc-500"
            >
              Edit
            </button>
            <form method="POST" action="?/send" use:enhance class="inline">
              <input type="hidden" name="id" value={n.id} />
              <button
                type="submit"
                class="px-2 py-1 text-sm rounded bg-green-600 hover:bg-green-500 disabled:opacity-50"
                disabled={!!n.sent_at}
              >
                Send
              </button>
            </form>
            <form method="POST" action="?/delete" use:enhance class="inline">
              <input type="hidden" name="id" value={n.id} />
              <button type="submit" class="px-2 py-1 text-sm rounded bg-red-600/80 hover:bg-red-500">
                Delete
              </button>
            </form>
          </div>
        {/if}
      </div>
    {/each}
  </div>
  {#if data.form?.sendSuccess}
    <p class="mt-2 text-sm text-green-400">Sent to {data.form.sendCount} subscribers.</p>
  {/if}
  {#if data.form?.sendError}
    <p class="mt-2 text-sm text-red-400">{data.form.sendError}</p>
  {/if}
  {#if data.form?.updateSuccess}
    <p class="mt-2 text-sm text-green-400">Updated.</p>
  {/if}
  {#if data.form?.deleteSuccess}
    <p class="mt-2 text-sm text-green-400">Deleted.</p>
  {/if}
</section>
