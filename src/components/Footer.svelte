<script>
  import { calculateTotals, invoice, content } from '../js/store.js';

  let htmlFooterContent;

  $: {
    if ($content) {
      const totals = calculateTotals($invoice.items);
      const formattedTotal = `${$content.currencySign} ${
        totals.totalPrice ? totals.totalPrice.toFixed(2) : 0
      }`;
      htmlFooterContent = $content.footerTemplate
        .replace('{total}', formattedTotal)
        .replace('{date}', $invoice.expirationDate)
        .replace('{id}', $invoice.id);
    }
  }
</script>

<div class="footer">
  {@html htmlFooterContent}
</div>
