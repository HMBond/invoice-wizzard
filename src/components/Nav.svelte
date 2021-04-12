
<script>
  export let OnNew;
  export let OnEdit;
  export let OnLoad;
  export let OnSave;
</script>

<nav>
  <button on:click={() => OnNew()}>New</button>
  <button on:click={() => OnEdit()}>Edit</button>
  <button on:click={() => OnLoad()}>Load</button>
  <button on:click={() => OnSave()}>Save</button>
  <img src="images/favicon.svg" alt="heart" width="30px" height="30px" />
</nav>