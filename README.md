# Invoice Wizzard
Simple invoice manager using Svelte and Electron Forge ()

## How to use

1. Create new directory `/private`
2. Add two files to this directory: `invoice.json` and `content.json`

### invoice.json structure
```
{
  "invoiceNr": "",
  "description": "",
  "invoiceDate": "",
  "paydate": "",
  "addressee": {
    "name": "",
    "address": "",
    "postcode": "",
    "city": ""
  },
  "items": [
    {
      "description": "",
      "price": 123
    }
  ]
}
```

### content.json structure
```
{
  "contact": [
    "Company Name",
    "Address",
    "Zip-code and City",
    "<br />",
    "email",
    "tel",
    "<br />",
    "Company Id",
    "Tax Id",
    "Bank account",
    "anything else?"
  ],
  "defaults": {
    "currencySign": "€ ",
    "tax": 21,
    "itemAmount": 1,
    "lblSubTotal": "Subtotaal excl. btw",
    "lblTax": "% btw",
    "lblTotal": "Totaal",
    "footerTemplate": "We verzoeken u vriendelijk het bovenstaande bedrag van {total} voor {date} te voldoen op onze bankrekening onder vermelding van de omschrijving {id}. Voor vragen kunt u contact opnemen per e-mail."
  }
}
```

## Furthur development

This app was originally made without a framework, so most code has to be rewritten to use the advantages of Svelte and Electron. This setup has been chosen for ease of use. Svelte is a great frontend framework for readable code, offering a complete package of tools to speed up development of a great looking, ultra-fast & small-sized app. Great dev-experience. Electron offers the possibility to save pdf to disk and is easy to setup.

### To Do:
 - Cleanup
 - One-time setup wizzard for uploading logo, contact info and details
 - Embedded DB to store invoices
 - Deployment