<script>
  export let state;
  export let invoice;
</script>

<div class:hidden={$state.step !== 1}>
  <h1>Adressee</h1>
  <label for="name">
    <span>Name adressee</span>
    <input
      type="text"
      placeholder="Who should pay?"
      bind:value={$invoice.addressee.name}
    />
  </label>
  <label for="address"
    ><span>Address</span>
    <input
      type="text"
      placeholder="From where?"
      bind:value={$invoice.addressee.address}
    />
  </label>
  <div class="flex">
    <label for="postcode">
      <span>Postcode</span>
      <input
        type="text"
        placeholder="Zip code?"
        bind:value={$invoice.addressee.postcode}
      />
    </label>
    <label for="city">
      <span>City</span>
      <input
        type="text"
        placeholder="e.g. Rotterdam"
        bind:value={$invoice.addressee.city}
      />
    </label>
  </div>
</div>
