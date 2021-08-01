export const contentPlaceholder = {
  contact: [
    'Company Name',
    'Address',
    'Zip-code and City',
    '<br />',
    'email',
    'tel',
    '<br />',
    'Company Id',
    'Tax Id',
    'Bank account',
  ],
  currencySign: '€',
  tax: 21,
  lblSubTotal: 'Subtotaal excl. btw',
  lblTax: '% btw',
  lblTotal: 'Totaal',
  footerTemplate:
    'You can change the footer template in placeholders.js. Use total amount to pay {total}, the final date to pay {date} or the invoice id {id}.',
};

export const invoicePlaceholder = {
  id: '',
  description: '',
  invoiceDate: '',
  expirationDate: '',
  addressee: {
    name: '',
    extraLine: '',
    address: '',
    postcode: '',
    city: '',
  },
  tax: 21,
  items: [],
};
