export function getSubTotal(items, tax) {
  return items
    .map((item) => calculateItemPriceExTax(item, tax))
    .reduce((total, price) => total + price, 0);
}

export function getTotal(items) {
  return items.reduce((total, item) => total + item.amount * item.price, 0);
}

function calculateItemPriceExTax({ price, amount }, tax) {
  const itemTotal = price * amount;
  return itemTotal / (1 + tax * 0.01);
}
