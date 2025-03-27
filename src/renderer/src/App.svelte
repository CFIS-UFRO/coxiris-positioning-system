<script>
  import { _ } from 'svelte-i18n';
  import Icon from '@iconify/svelte';
  import codeBraces from '@iconify/icons-mdi/code-braces';
  import github from '@iconify/icons-mdi/github';
  
  const repo = window.electron.ipcRenderer.sendSync('get-repo');
</script>

<div class="flex h-screen w-full items-center justify-center">
  <div class="text-center flex flex-col items-center">
    <Icon icon={codeBraces} class="w-12 h-12 mb-4 text-neutral-700 dark:text-neutral-300" />
    <h1 class="mb-6 text-4xl font-bold text-neutral-800 dark:text-neutral-300">
      {$_('title')}
    </h1>
    <a href={repo} class="inline-block rounded bg-neutral-800 px-4 py-2 text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-500 dark:hover:bg-neutral-400 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-300" target="_blank">
      <div class="flex items-center gap-2">
        <Icon icon={github} width="20" height="20" />
        GitHub
      </div>
    </a>
  </div>
</div>