<script>
  import { calculateTotals, invoice, content } from '../js/store.js';

  let htmlFooterContent;

  $: {
    if ($content.defaults) {
      const totals = calculateTotals($invoice.items);
      const formattedTotal =
        $content.defaults.currencySign +
        (totals.totalPrice ? totals.totalPrice.toFixed(2) : 0);
      htmlFooterContent = $content.defaults.footerTemplate
        .replace('{total}', formattedTotal)
        .replace('{date}', $invoice.expirationDate)
        .replace('{id}', $invoice.id);
    }
  }
</script>

<div class="footer">
  {@html htmlFooterContent}
</div>
