<script>
  import { content, invoice, wizzard as state } from '../../js/store.js';
  import StepOne from './StepOne.svelte';
  import StepTwo from './StepTwo.svelte';
  $: items = $invoice.items;
  let item = {};
  const stepMax = 3;

  function addItem() {
    invoice.update((invoice) => ({
      ...invoice,
      items: [...items, item]
    }));
  }

  function removeItem(item) {
    const items = $invoice.items.filter((i) => i !== item);
    invoice.update((invoice) => ({
      ...invoice,
      items
    }));
  }
</script>

<wizzard class:hidden={!$state.visible}>
  <form class="form">
    <StepOne {state} {invoice} />
    <StepTwo {state} {invoice} />
    <div class:hidden={$state.step !== 3}>
      <h1>Add Item</h1>
      <label for="amount">
        <span>Amount</span>
        <input
          type="number"
          min="1"
          placeholder="How many?"
          bind:value={item.amount}
        />
      </label>
      <label for="description">
        <span>Description</span>
        <input
          type="text"
          placeholder="What is this item about?"
          bind:value={item.description}
        />
      </label>
      <label for="price">
        <span>Price per item</span>
        <div>
          <input
            type="number"
            placeholder="€€€"
            width="8rem"
            bind:value={item.price}
          />
          <span>€</span>
          <button type="button" on:click={() => addItem()}> Add Item </button>
        </div>
      </label>
      <div class="wizzard-item-container">
        {#each $invoice.items as item (item.description)}
          <div class="wizzard-item-row">
            <span class="amount">{item.amount}</span>
            <span class="times">×</span>
            <span class="description">{item.description}</span>
            <span class="price">{item.price}</span>
            <span class="currencysign">{$content.defaults.currencySign}</span>
            <span
              class="remove icon-trash-bin"
              on:click={() => removeItem(item)}
            />
          </div>
        {/each}
      </div>
    </div>
    <div class="action-buttons">
      <button
        type="button"
        class:hidden={$state.step === 1}
        on:click={() => $state.previous()}> Previous </button>
      <button
        type="button"
        class:hidden={$state.step === stepMax}
        on:click={() => $state.next()}> Next </button>
    </div>
    <div class="action-buttons">
      <button type="button" on:click={() => $state.save()}>done</button>
    </div>
  </form>
</wizzard>
