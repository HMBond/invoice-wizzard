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
        'anything else?',
    ],
    defaults: {
        currencySign: '€ ',
        tax: 21,
        itemAmount: 1,
        lblSubTotal: 'Subtotaal excl. btw',
        lblTax: '% btw',
        lblTotal: 'Totaal',
        footerTemplate:
            'You can change the footer template here. If you like you can use total amount to pay {total}, the final date to pay {date} or the invoice id {id}.',
    },
};

export const invoicePlaceholder = {
    id: '',
    description: '',
    invoiceDate: '',
    expirationDate: '',
    addressee: {
        name: '',
        address: '',
        postcode: '',
        city: '',
    },
    tax: 21,
    items: [],
};
