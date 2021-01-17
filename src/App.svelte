<script>
  import { onMount } from 'svelte';
  import State from './js/state.js';
  import Wizzard from './js/wizzard.js';
  import Keyboard from './js/keyboard.js';

  const electron = require('electron');
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  // Importing BrowserWindow from Main
  const BrowserWindow = electron.remote.BrowserWindow;

  const printOptions = {
    silent: false,
    printBackground: true,
    color: false,
    margin: {
      marginType: 'printableArea'
    },
    landscape: false,
    pagesPerSheet: 1,
    collate: false,
    copies: 1,
    header: 'Header of the Page',
    footer: 'Footer of the Page'
  };

  function print() {
    let win = BrowserWindow.getFocusedWindow();
    win.webContents
      .printToPDF({
        marginsType: 0,
        printBackground: false,
        printSelectionOnly: false,
        landscape: false,
        pageSize: 'A4',
        scaleFactor: 100
      })
      .then((data) => {
        const pdfPath = path.join(os.homedir(), 'Desktop', state.invoice.id + '.pdf');
        fs.writeFile(pdfPath, data, (error) => {
          if (error) throw error;
          console.log(`Wrote PDF successfully to ${pdfPath}`);
        });
      })
      .catch((error) => {
        console.log(`Failed to write PDF to ${pdfPath}: `, error);
      });
  }

  let state;
  let wizzard;

  onMount(async () => {
    const content = await fetch('./private/content.json')
      .then((r) => r.json())
      .then((data) => {
        return data;
      });

    state = new State(content, {
      contactId: 'contact',
      itemsId: 'items',
      addresseeId: 'addressee',
      footerId: 'footer'
    });

    const localStorageInvoice = ''; // = JSON.parse(localStorage.getItem('invoice'));
    const invoice = localStorageInvoice
      ? localStorageInvoice
      : await fetch('./private/invoice.json')
          .then((r) => r.json())
          .then((data) => {
            return data;
          });

    state.render(invoice);

    wizzard = new Wizzard(onFinishWizzard, content, {
      wizzardId: 'wizzard',
      invoideDateInputId: 'invoice-date',
      expirationDateInputId: 'expiration-date',
      wizzardItemContainerId: 'wizzard-item-container'
    });
    wizzard.setDates();

    new Keyboard(document, keyboardFunctions);
  });

  const keyboardFunctions = {
    onEscape: () =>
      wizzard.visible ? wizzard.done() : wizzard.edit(state.invoice),
    onArrowLeft: () => wizzard.previous(),
    onArrowRight: () => wizzard.next(),
    onEnter: (e) => {
      if (wizzard.step === wizzard.lastStep) {
        if (e.target.innerText.toLowerCase().includes('add')) return;
        wizzard.addItem();
      } else {
        wizzard.next();
      }
    },
    onCtrlEnter: () =>
      wizzard.visible ? wizzard.done() : wizzard.edit(state.invoice),
    onCtrlS: () => (wizzard.visible ? wizzard.done() : window.print()),
    onCtrlO: () => load(),
    onCtrlL: () => load(),
    onCtrlN: () => wizzard.new()
  };

  const onFinishWizzard = async (invoice) => {
    if (!invoice) localStorage.setItem(invoice.id, JSON.stringify(invoice));
    state.render(invoice);
    const success = saveFile(invoice, invoice.id);
    if (success) console.log('file saved');
  };

  const save = async () => {
    saveFile(state.invoice, await prompt('file name:'));
  };

  const saveFile = async (invoice, fileName) => {
    print();
    // todo: use fs
    // if (!invoice || !fileName) return;
    // const headers = new Headers();
    // headers.append('Content-Type', 'application/json');
    // return await fetch(`http://localhost:8888/save`, {
    //   method: 'POST',
    //   headers: headers,
    //   body: JSON.stringify({ invoice: invoice, fileName: fileName }),
    //   redirect: 'follow'
    // })
    //   .then((res) => res.ok)
    //   .catch((err) => console.log('save: ', err));
  };

  const load = () => {
    document.getElementById('invoice-file-load').click();
  };

  let loadInputFiles;
  const loadFile = async () => {
    // todo: use fs
    // if (!loadInputFiles) return;
    // const invoice = await fetch(
    //   `../public/private/${loadInputFiles[0].name}`
    // ).then((res) => (res.ok ? res.json() : null));
    // if (!invoice)
    //   return alert(
    //     "The *.invoice.json file can only be loaded from the app's private folder."
    //   );
    // state.render(invoice);
    // wizzard.edit(invoice);
  };
</script>

<main>
  <div class="logo">
    <img src="images/logo.png" alt="logo" />
  </div>
  <div id="contact" />
  <div id="addressee">
    <div id="name" />
    <div id="address" />
    <div>
      <span id="postcode" />
      <span id="city" />
    </div>
  </div>
  <div class="invoice-info">
    <div class="invoice-id">
      <span>Factuur </span>
      <span id="id" />
    </div>
    <div class="invoice-description">
      <span class="description">Kenmerk: </span>
      <span id="description" />
    </div>
  </div>
  <div class="dates">
    <div>
      <span>Factuurdatum: </span>
      <span id="invoiceDate" />
    </div>
    <div>
      <span>Vervaldatum: </span>
      <span id="expirationDate" />
    </div>
  </div>
  <div id="items">
    <div class="header">
      <span />
      <span>Omschrijving</span>
      <span class="text-align-right">Bedrag</span>
      <span class="text-align-right">Totaal</span>
      <span class="text-align-right">Btw</span>
    </div>
  </div>
  <div id="footer" />
  <div class="hidden" id="tax" />
</main>

<nav>
  <button on:click={() => wizzard.new()}>New</button>
  <button on:click={() => wizzard.edit(state.invoice)}>Edit</button>
  <button on:click={() => load()}>Load</button>
  <button on:click={() => save()}>Save</button>
  <img src="images/favicon.svg" alt="heart" width="30px" height="30px" />
</nav>
<wizzard>
  <form class="form">
    <div class="hidden" wizzard="1">
      <h1>Adressee</h1>
      <label for="name">
        <span>Name adressee</span>
        <input type="text" placeholder="Who should pay?" />
      </label>
      <label for="address"
        ><span>Address</span>
        <input type="text" placeholder="From where?" />
      </label>
      <div class="flex">
        <label for="postcode">
          <span>Postcode</span>
          <input type="text" placeholder="Zip code?" />
        </label>
        <label for="city">
          <span>City</span>
          <input type="text" placeholder="e.g. Rotterdam" />
        </label>
      </div>
    </div>
    <div class="hidden" wizzard="2">
      <h1>Details</h1>
      <label for="id"
        ><span>Invoice id</span>
        <input type="text" placeholder="e.g. 2020-0001" />
      </label>
      <label for="description">
        <span>Description</span>
        <input type="text" placeholder="What is the invoice about?" />
      </label>
      <div class="flex">
        <label for="invoiceDate">
          <span>Invoice date</span>
          <input type="text" placeholder="today?" id="invoice-date" />
        </label>
        <label for="expirationDate">
          <span>Expiration date</span>
          <input type="text" placeholder="next month?" id="expiration-date" />
        </label>
      </div>
      <label for="tax">
        <span>Tax</span>
        <div>
          <input type="number" min="0" max="100" />
          <span>%</span>
        </div>
      </label>
    </div>
    <div class="hidden" wizzard="3">
      <h1>Add Item</h1>
      <label for="amount">
        <span>Amount</span>
        <input type="number" min="1" value="1" placeholder="How many?" />
      </label>
      <label for="description">
        <span>Description</span>
        <input type="text" placeholder="What is this item about?" />
      </label>
      <label for="price">
        <span>Price per item</span>
        <div>
          <input class type="number" placeholder="€€€" width="8rem" />
          <span>€</span>
          <button type="button" on:click={() => wizzard.addItem()}>
            Add Item
          </button>
        </div>
      </label>
      <div id="wizzard-item-container" />
    </div>
    <div class="action-buttons">
      <button type="button" wizzard="!1" on:click={() => wizzard.previous()}>
        Previous
      </button>
      <button type="button" wizzard="!3" on:click={() => wizzard.next()}>
        Next
      </button>
    </div>
    <div class="action-buttons">
      <button type="button" on:click={() => wizzard.done()}>done</button>
    </div>
  </form>
</wizzard>
<input
  type="file"
  bind:files={loadInputFiles}
  id="invoice-file-load"
  accept="application/JSON"
  on:change={() => loadFile()}
/>
