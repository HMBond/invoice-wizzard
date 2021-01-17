<script>
  export let state;
  export let invoice;
</script>

<div class:hidden={$state.step !== 2}>
  <h1>Details</h1>
  <label for="id"
    ><span>Invoice id</span>
    <input type="text" placeholder="e.g. 2020-0001" bind:value={$invoice.id} />
  </label>
  <label for="description">
    <span>Description</span>
    <input
      type="text"
      placeholder="What is the invoice about?"
      bind:value={$invoice.description}
    />
  </label>
  <div class="flex">
    <label for="invoiceDate">
      <span>Invoice date</span>
      <input
        type="text"
        placeholder="today?"
        id="invoice-date"
        bind:value={$invoice.invoiceDate}
      />
    </label>
    <label for="expirationDate">
      <span>Expiration date</span>
      <input
        type="text"
        placeholder="next month?"
        id="expiration-date"
        bind:value={$invoice.expirationDate}
      />
    </label>
  </div>
  <label for="tax">
    <span>Tax</span>
    <div>
      <input type="number" min="0" max="100" bind:value={$invoice.tax} />
      <span>%</span>
    </div>
  </label>
</div>
