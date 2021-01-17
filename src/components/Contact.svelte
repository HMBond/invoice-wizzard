<script>
  export let content;
</script>

<div class="contact">
  {#if $content.contactInfo}
    {#each $content.contactInfo as entry}
      <div>{@html entry}</div>
    {/each}
  {/if}
</div>
