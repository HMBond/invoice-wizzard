<script>
  import { onMount } from 'svelte';
  import addKeyboardActions from './js/keyboard.js';
  import print from './js/print.js';
  import { invoice, content } from './js/store.js';
  import Contact from './components/Contact.svelte';
  import Footer from './components/Footer.svelte';
  import Wizzard from './components/wizzard/Wizzard.svelte';

  function exportAsPfd() {
    window.print();
    // todo: environment check
    // const electron = require('electron');
    // const fs = require('fs');
    // const path = require('path');
    // const os = require('os');
    // const BrowserWindow = electron.remote.BrowserWindow;
    // print({BrowserWindow, fs, path, os});
  }

  onMount(async () => {
    content.set(
      await fetch('./private/content.json')
        .then((r) => r.json())
        .then((data) => {
          return data;
        })
    );

    invoice.set(
      await fetch('./private/invoice.json')
        .then((r) => r.json())
        .then((data) => {
          return data;
        })
    );

    addKeyboardActions({ container: document, exportAsPfd: exportAsPfd });
  });
</script>

<main>
  <div class="logo">
    <img src="images/logo.png" alt="logo" />
  </div>
  <Contact {content} />
  <div class="addressee">
    <div>{$invoice.addressee.name}</div>
    <div>{$invoice.addressee.address}</div>
    <div>
      <span>{$invoice.addressee.postcode}</span>
      <span>{$invoice.addressee.city}</span>
    </div>
  </div>
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
  <Footer />
</main>
<!--
<nav>
  <button on:click={() => createNew()}>New</button>
  <button on:click={() => edit(state.invoice)}>Edit</button>
  <button on:click={() => load()}>Load</button>
  <button on:click={() => save()}>Save</button>
  <img src="images/favicon.svg" alt="heart" width="30px" height="30px" />
</nav> -->
<Wizzard />
