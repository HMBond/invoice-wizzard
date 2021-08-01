<script>
  export let onNew;
  export let onEdit;
  export let onLoad;
  export let onSave;
</script>

<nav>
  <button on:click={() => onNew()}>New</button>
  <button on:click={() => onEdit()}>Edit</button>
  <button on:click={() => onLoad()}>Load</button>
  <button on:click={() => onSave()}>Save</button>
  <img src="images/favicon.svg" alt="heart" width="30px" height="30px" />
</nav>
