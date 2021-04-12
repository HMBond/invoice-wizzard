<script>
  import { onMount } from 'svelte';
  //import { ipcRenderer } from 'electron';
  import addKeyboardActions from './js/keyboard.js';
  //import print from './js/print.js';
  import { invoice, content, wizzard } from './js/store.js';
  import Contact from './components/Contact.svelte';
  import Invoice from './components/Invoice.svelte';
  import Footer from './components/Footer.svelte';
  import Nav from './components/Nav.svelte';
  import Wizzard from './components/wizzard/Wizzard.svelte';

  function exportAsPfd() {
    window.print();
  }

  onMount(async () => {
    content.set(
      await fetch('/private/content.json')
        .then((r) => r.json())
        .then((data) => {
          return data;
        }),
    );

    invoice.set(
      await fetch('/private/invoice.json')
        .then((r) => r.json())
        .then((data) => {
          return data;
        }),
    );

    addKeyboardActions({ container: document, exportAsPfd: exportAsPfd });
  });

  //todo: https://joshuaj.co.uk/blog/building-desktop-app-svelte-electron
  async function load() {}
  async function save() {}
</script>

<main>
  <div class="logo">
    <img src="images/logo.png" alt="logo" />
  </div>
  <Contact {content} />
  <Invoice {invoice} />
  <Footer />
</main>
<Nav
  OnNew={() => $wizzard.new()}
  OnEdit={() => $wizzard.edit()}
  OnLoad={() => load()}
  OnSave={() => save()}
/>
<Wizzard />
