<script>
  export let content;
</script>

<div class="contact">
  {#if $content.contact}
    {#each $content.contact as entry}
      <div>{@html entry}</div>
    {/each}
  {/if}
</div>
