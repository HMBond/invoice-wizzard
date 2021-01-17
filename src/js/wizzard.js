export default class Wizzard {
  constructor(
    onFinish,
    contentData,
    {
      wizzardId,
      invoideDateInputId,
      expirationDateInputId,
      wizzardItemContainerId
    }
  ) {
    this.visible = true;
    this.step = 1;
    this.items = [];
    this.onFinish = onFinish;
    this.wizzardId = wizzardId;
    this.invoideDateInput = document.getElementById(invoideDateInputId);
    this.expirationDateInput = document.getElementById(expirationDateInputId);
    this.wizzardItemContainer = document.getElementById(wizzardItemContainerId);
    this.firstStep = document.querySelector('*[wizzard="1"]');
    this.secondStep = document.querySelector('*[wizzard="2"]');
    this.thirdStepLabels = document
      .querySelector('*[wizzard="3"]')
      .querySelectorAll('label[for]');
    this.lastStep = this.getLastStep();
    this.defaults = contentData.defaults;
    this.show(this.step);
  }

  new() {
    this.items = [];
    this.wizzardItemContainer.innerHTML = '';
    document.querySelectorAll('input').forEach((input) => {
      input.value = '';
    });
    this.setDates();
    this.step = 1;
    this.show(this.step);
    this.showWizzard();
  }

  edit(invoice) {
    this.firstStep.querySelectorAll('label[for]').forEach((label) => {
      const key = label.htmlFor;
      label.querySelector('input').value = invoice.addressee[key];
    });
    this.secondStep.querySelectorAll('label[for]').forEach((label) => {
      const key = label.htmlFor;
      label.querySelector('input').value = invoice[key];
    });
    this.items = [];
    this.wizzardItemContainer.innerHTML = '';
    invoice.items.forEach((item) => {
      this.addItem(item);
    });
    this.showWizzard();
  }

  done() {
    const addressee = {};
    const invoice = {};
    this.firstStep.querySelectorAll('label[for]').forEach((label) => {
      addressee[label.htmlFor] = label.querySelector('input').value;
    });
    this.secondStep.querySelectorAll('label[for]').forEach((label) => {
      invoice[label.htmlFor] = label.querySelector('input').value;
    });
    invoice.items = this.items;
    invoice.addressee = addressee;
    this.onFinish(invoice);
    this.hideWizzard();
    return false;
  }

  addItem(item) {
    const newItem = item ? item : this.getItemFromInputFields();
    if (Object.values(newItem).some((value) => !value)) return;
    const itemRow = this.createItemRow(newItem);
    const idForDelete = this.getNewId('xxxx');
    newItem.id = idForDelete;
    itemRow.id = idForDelete;
    this.items.push(newItem);
    this.wizzardItemContainer.appendChild(itemRow);
  }

  getItemFromInputFields() {
    return [...this.thirdStepLabels].reduce(
      (object, label) => ({
        ...object,
        [label.htmlFor]: label.querySelector('input').value
      }),
      {}
    );
  }

  removeItem(event) {
    const itemRow = event.target.parentElement;
    this.items = this.items.filter((item) => item.id != itemRow.id);
    itemRow.remove();
  }

  createItemRow(item) {
    const itemCells = this.createItemCells(item);
    const cells = this.withPresentationalCells(itemCells);
    const itemRow = document.createElement('div');
    for (const [key, cell] of Object.entries(cells)) {
      if (key) cell.classList.add(key);
      itemRow.append(cell);
    }
    itemRow.classList.add('wizzard-item-row');
    return itemRow;
  }

  createItemCells(item) {
    return Object.entries(item).reduce((cells, [key, value]) => {
      const cell = document.createElement('span');
      cell.innerHTML = value;
      return {
        ...cells,
        [key]: cell
      };
    }, {});
  }

  withPresentationalCells(cells) {
    const times = document.createElement('span');
    times.innerText = '×';
    const remove = document.createElement('span');
    remove.classList.add('icon-trash-bin');
    remove.onclick = this.removeItem;
    const currency = document.createElement('span');
    currency.innerText = this.defaults.currencySign;
    return {
      ...cells,
      times,
      remove,
      currency
    };
  }

  previous() {
    if (this.step === 1) return;
    this.step--;
    this.show(this.step);
    return false;
  }

  next() {
    if (this.step === this.lastStep) return;
    this.step++;
    this.show(this.step);
    return false;
  }

  getLastStep() {
    return Math.max(
      ...[...document.querySelectorAll('[wizzard]')]
        .map((element) => parseInt(element.getAttribute('wizzard')))
        .filter((n) => n)
    );
  }

  show(index) {
    document.querySelectorAll(`[wizzard]`).forEach((element) => {
      element.classList.add('hidden');
    });
    document.querySelectorAll(`[wizzard="${index}"]`).forEach((element) => {
      element.classList.remove('hidden');
      element.querySelector('input').focus();
    });
    document.querySelectorAll(`[wizzard^="!"]`).forEach((element) => {
      element.classList.remove('hidden');
    });
    document.querySelectorAll(`[wizzard="!${index}"]`).forEach((element) => {
      element.classList.add('hidden');
    });
  }

  showWizzard() {
    this.visible = true;
    document.querySelector(this.wizzardId).classList.remove('hidden');
  }

  hideWizzard() {
    this.visible = false;
    document.querySelector(this.wizzardId).classList.add('hidden');
  }

  setDates() {
    const today = new Date();
    this.invoideDateInput.value = today.toLocaleDateString(
      this.defaults.dateCulture
    );
    this.expirationDateInput.value = new Date(
      today.setMonth(today.getMonth() + 1)
    ).toLocaleDateString('nl');
  }

  //https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
  getNewId(template) {
    return template.replace(/[xy]/g, (c) => {
      let r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
