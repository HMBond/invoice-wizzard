export default class State {
  constructor(contentData, { contactId, itemsId, addresseeId, footerId }) {
    this.invoice = {};
    this.defaults = contentData.defaults;
    this.contactInfo = contentData.contactInfo;
    this.contactContainer = this.getContainerById(contactId);
    this.itemsContainer = this.getContainerById(itemsId);
    this.addresseeContainer = this.getContainerById(addresseeId);
    this.footerContainer = this.getContainerById(footerId);
  }

  getContainerById(id) {
    const container = document.getElementById(id);
    return container
      ? container
      : console.error('could not find html container with id: ' + id);
  }

  render(invoice) {
    this.invoice = invoice;
    this.fillContactInfo(invoice);
    this.fillInvoice(invoice);
    this.fillAddressee(invoice);
    this.fillInvoiceDetails(invoice);
    this.fillFooter(invoice);
  }

  fillContactInfo() {
    if (!this.contactContainer) return;
    this.contactContainer.innerHTML = null;
    this.contactInfo.forEach((line) => {
      let element = document.createElement('div');
      element.innerHTML = line;
      this.contactContainer.appendChild(element);
    });
  }

  fillInvoice(invoice) {
    if (!this.itemsContainer) return;
    this.itemsContainer.innerHTML = '';
    this.fillItems(invoice);
    this.fillTotals(invoice);
  }

  fillAddressee(invoice) {
    if (!this.addresseeContainer) return;
    Object.keys(invoice.addressee).map((subKey) => {
      this.fillElement(
        subKey,
        this.addresseeContainer,
        invoice.addressee[subKey]
      );
    });
  }

  fillInvoiceDetails(invoice) {
    Object.keys(invoice).map((key) => {
      if (key != 'items' && key != 'addressee') {
        this.fillElementById(key, invoice[key], document);
      }
    });
  }

  getPopulatedItems(invoice) {
    return invoice.items.map((item) => {
      item.amount = item.amount ? item.amount : this.defaults.itemAmount;
      item.tax = invoice.tax;
      return item;
    });
  }

  fillItems(invoice) {
    const items = this.getPopulatedItems(invoice);
    items.forEach((item) => {
      const price = parseInt(item.price)
        ? parseInt(item.price).toFixed(2)
        : '0';
      this.itemsContainer.appendChild(this.createItemRow(item, price));
    });
  }

  fillTotals(invoice) {
    const items = this.getPopulatedItems(invoice);
    const { subTotalExTax, taxPrice, totalPrice } = this.calculateTotals(items);
    this.itemsContainer.appendChild(this.createSubTotalExTaxRow(subTotalExTax));
    this.itemsContainer.appendChild(
      this.createTaxTotalRow(taxPrice, invoice.tax)
    );
    this.itemsContainer.appendChild(this.createPriceTotalRow(totalPrice));
  }

  fillFooter(invoice) {
    const totals = this.calculateTotals(invoice.items);
    const formattedTotal =
      this.defaults.currencySign +
      (totals.totalPrice ? totals.totalPrice.toFixed(2) : 0);
    this.footerContainer.innerHTML = this.defaults.footerTemplate
      .replace('{total}', formattedTotal)
      .replace('{date}', invoice.expirationDate)
      .replace('{id}', invoice.id);
  }

  fillElement(id, container, value) {
    if (container) {
      this.fillElementById(id, value, container);
    } else {
      console.log('please fix the container with id: ' + parentId);
    }
  }

  fillElementById(id, value, parent) {
    const element = parent.querySelector('#' + id);
    if (parent && element) {
      element.innerHTML = value;
    } else {
      console.log('please fix the slot with id: ' + id);
    }
  }

  createCellElement({ className, classList = [], innerHTML, price }) {
    const element = document.createElement('span');
    classList.unshift(className);
    for (const className of classList) {
      if (className) element.classList.add(className);
    }
    element.innerHTML = innerHTML
      ? innerHTML
      : this.defaults.currencySign + price;
    return element;
  }

  createRowElement({ className = '', classList = [], cells }) {
    const element = document.createElement('div');
    if (className) classList.unshift(className);
    for (const className of classList) {
      element.classList.add(className);
    }
    for (const cell of cells) {
      element.appendChild(cell);
    }
    return element;
  }

  calculateTotals(items) {
    const pricesExTax = items.map((item) => this.calculateItemPriceExTax(item));
    const subTotalExTax = this.sum(pricesExTax);
    const itemPrices = items.map((item) => this.calculateItemPrice(item));
    const totalPrice = this.sum(itemPrices);
    // todo: should provide tax for each tax category (eg. 21%, 6%)
    const taxPrice = totalPrice - subTotalExTax;
    return { subTotalExTax, taxPrice, totalPrice };
  }

  calculateItemPrice({ price, amount }) {
    return price * amount;
  }

  calculateItemPriceExTax({ price, amount, tax }) {
    const itemTotal = price * amount;
    const itemExTax = itemTotal / (1 + tax * 0.01);
    return itemExTax;
  }

  sum(prices) {
    if (prices.length > 0) {
      return prices.reduce((accumulator, price) => accumulator + price);
    }
  }

  createItemRow(item, price) {
    return this.createRowElement({
      className: 'item',
      cells: [
        this.createCellElement({
          innerHTML: item.amount + ' ×'
        }),
        this.createCellElement({
          innerHTML: item.description
        }),
        this.createCellElement({
          className: 'text-align-right',
          price: price
        }),
        this.createCellElement({
          className: 'text-align-right',
          price: this.calculateItemPrice(item).toFixed(2)
        }),
        this.createCellElement({
          className: 'text-align-right',
          innerHTML: item.tax + '%'
        })
      ]
    });
  }

  createPriceTotalRow(totalPrice) {
    return this.createRowElement({
      classList: ['totals', 'text-align-right'],
      cells: [
        this.createCellElement({
          classList: ['header', 'border-top', 'total'],
          innerHTML: this.defaults.lblTotal
        }),
        this.createCellElement({
          classList: ['header', 'border-top'],
          price: totalPrice ? totalPrice.toFixed(2) : 0
        })
      ]
    });
  }

  createTaxTotalRow(taxPrice, tax) {
    return this.createRowElement({
      classList: ['totals', 'text-align-right'],
      cells: [
        this.createCellElement({
          innerHTML: tax + this.defaults.lblTax
        }),
        this.createCellElement({
          price: taxPrice ? taxPrice.toFixed(2) : 0
        })
      ]
    });
  }

  createSubTotalExTaxRow(subTotalExTax) {
    return this.createRowElement({
      classList: ['totals', 'border-top', 'text-align-right'],
      cells: [
        this.createCellElement({
          class: 'header',
          innerHTML: this.defaults.lblSubTotal
        }),
        this.createCellElement({
          price: subTotalExTax ? subTotalExTax.toFixed(2) : 0
        })
      ]
    });
  }
}
