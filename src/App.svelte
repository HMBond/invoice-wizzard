<script>
  import { onMount } from 'svelte';
  import { invoice, content, wizzard, calculateTotals } from './js/store.js';
  import Contact from './components/Contact.svelte';
  import Invoice from './components/Invoice.svelte';
  import Footer from './components/Footer.svelte';
  import Nav from './components/Nav.svelte';
  import Wizzard from './components/wizzard/Wizzard.svelte';

  onMount(async () => {
    // issue: Fix keyboard #1
    // addKeyboardActions({
    //     container: document,
    //     exportAsPfd: () => window.print(),
    // });
  });

  // issue: Add storage #2
  async function onLoad() {}
  async function onSave() {}
</script>

<main>
  <div class="logo">
    <img src="images/logo.png" alt="logo" />
  </div>
  <Contact {content} />
  <Invoice {invoice} {content} {calculateTotals} />
  <Footer />
</main>
<Nav onNew={$wizzard.new} onEdit={$wizzard.toggle} {onLoad} {onSave} />
<Wizzard />
