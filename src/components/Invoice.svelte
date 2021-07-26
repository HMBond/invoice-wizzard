<script>
    export let invoice;
</script>

<div class="addressee">
    <div>{$invoice.addressee.name}</div>
    <div>{$invoice.addressee.address}</div>
    <div>
        <span>{$invoice.addressee.postcode}</span>
        <span>{$invoice.addressee.city}</span>
    </div>
</div>
Î
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
    <div class="header">
        <span />
        <span>Omschrijving</span>
        <span class="text-align-right">Bedrag</span>
        <span class="text-align-right">Totaal</span>
        <span class="text-align-right">Btw</span>
    </div>
</div>
