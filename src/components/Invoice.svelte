<script>
  export let invoice;
  export let content;
  export let calculateTotals;

  let formattedSubTotal, formattedTax, formattedTotal;

  function formatItemPrice(item) {
    return `${$content.currencySign} ${item.price.toFixed(2)}`;
  }

  function formatItemTotalPrice(item) {
    return `${$content.currencySign} ${(item.amount * item.price).toFixed(2)}`;
  }

  invoice.subscribe((invoice) => {
    const { subTotalExTax, taxPrice, totalPrice } = calculateTotals(
      invoice.items
    );
    formattedSubTotal = `${$content.currencySign} ${subTotalExTax.toFixed(2)}`;
    formattedTax = `${$content.currencySign} ${taxPrice.toFixed(2)}`;
    formattedTotal = `${$content.currencySign} ${totalPrice.toFixed(2)}`;
  });
</script>

<div class="addressee">
  <div>{$invoice.addressee.name}</div>
  {#if $invoice.addressee.extraLine}
    <div>{$invoice.addressee.extraLine}</div>
  {/if}
  <div>{$invoice.addressee.address}</div>
  <div>
    <span>{$invoice.addressee.postcode}</span>
    <span>{$invoice.addressee.city}</span>
  </div>
</div>
<div class="invoice-info">
  <div class="invoice-id">
    <span>Factuur </span>
    <span>{$invoice.id}</span>
  </div>
  <div class="invoice-description">
    <span class="description">Kenmerk: </span>
    <span>{@html $invoice.description}</span>
  </div>
</div>
<div class="dates">
  <div>
    <span>Factuurdatum: </span>
    <span>{$invoice.invoiceDate}</span>
  </div>
  <div>
    <span>Vervaldatum: </span>
    <span>{$invoice.expirationDate}</span>
  </div>
</div>
<div class="items">
  <div class="header row">
    <span>Aantal</span>
    <span>Omschrijving</span>
    <span class="text-align-right">Bedrag</span>
    <span class="text-align-right">Totaal</span>
    <span class="text-align-right">Btw</span>
  </div>
  <div class="row">
    {#each $invoice.items as item}
      <span>{item.amount} ×</span>
      <span>{item.description}</span>
      <span class="text-align-right">{formatItemPrice(item)}</span>
      <span class="text-align-right">{formatItemTotalPrice(item)}</span>
      <span class="text-align-right">{$content.tax}%</span>
    {/each}
  </div>
  <div class="totals row border-top">
    <span class="text-align-right">{$content.lblSubTotal}</span>
    <span class="text-align-right">{formattedSubTotal}</span>
  </div>
  <div class="totals row">
    <span class="text-align-right">{$content.tax + $content.lblTax}</span>
    <span class="text-align-right">{formattedTax}</span>
  </div>
  <div class="totals row">
    <span class="text-align-right total border-top">{$content.lblTotal}</span>
    <span class="text-align-right border-top">{formattedTotal}</span>
  </div>
</div>
