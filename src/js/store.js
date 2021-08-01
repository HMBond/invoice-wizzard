import { writable, get } from 'svelte/store';
import { contentPlaceholder, invoicePlaceholder } from './placeholders';

export const content = writable(contentPlaceholder);

export const invoice = writable(invoicePlaceholder);

export const wizzard = writable({
  visible: true,
  step: 1,
  lastStep: 3,
  toggle: () =>
    wizzard.update((wizz) => ({
      ...wizz,
      visible: !wizz.visible,
    })),
  new: () => {
    invoice.set(invoicePlaceholder);
    get(wizzard).toggle();
  },
  previous: () =>
    wizzard.update((wizz) => ({
      ...wizz,
      step: wizz.step - 1 > 0 ? wizz.step - 1 : wizz.step,
    })),
  next: () =>
    wizzard.update((wizz) => ({
      ...wizz,
      step: wizz.step + 1 <= wizz.lastStep ? wizz.step + 1 : wizz.step,
    })),
  done: () => get(wizzard).toggle(),
});

export function calculateTotals(items) {
  if (items.length === 0) {
    return { subTotalExTax: 0, taxPrice: 0, totalPrice: 0 };
  }
  const pricesExTax = items.map((item) => calculateItemPriceExTax(item));
  const subTotalExTax = sum(pricesExTax);
  const itemPrices = items.map((item) => calculateItemPrice(item));
  const totalPrice = sum(itemPrices);
  const taxPrice = totalPrice - subTotalExTax;
  return { subTotalExTax, taxPrice, totalPrice };
}

const calculateItemPrice = ({ price, amount }) => price * amount;

const calculateItemPriceExTax = ({ price, amount }) => {
  const itemTotal = price * amount;
  const itemExTax = itemTotal / (1 + get(content).tax * 0.01);
  return itemExTax;
};

const sum = (prices) => {
  if (prices.length > 0) {
    return prices.reduce((accumulator, price) => accumulator + price);
  }
};
