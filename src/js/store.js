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
    save: () => {
        // todo: save invoice to db
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
});

export function calculateTotals(items) {
    const pricesExTax = items.map((item) => calculateItemPriceExTax(item));
    const subTotalExTax = sum(pricesExTax);
    const itemPrices = items.map((item) => calculateItemPrice(item));
    const totalPrice = sum(itemPrices);
    // todo: should provide tax for each tax category (eg. 21%, 6%)
    const taxPrice = totalPrice - subTotalExTax;
    return { subTotalExTax, taxPrice, totalPrice };
}

const calculateItemPrice = ({ price, amount }) => price * amount;

const calculateItemPriceExTax = ({ price, amount, tax }) => {
    const itemTotal = price * amount;
    const itemExTax = itemTotal / (1 + tax * 0.01);
    return itemExTax;
};

const sum = (prices) => {
    if (prices.length > 0) {
        return prices.reduce((accumulator, price) => accumulator + price);
    }
};
