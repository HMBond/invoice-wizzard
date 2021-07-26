import { get } from 'svelte/store';
import { wizzard } from '../js/store.js';

export default function initKeyboard({ container, exportAsPfd }) {
    const actions = {
        onEscape: get(wizzard).toggle,
        onArrowLeft: get(wizzard).previous,
        onArrowRight: get(wizzard).next,
        onEnter: () => {
            if (get(wizzard).step === get(wizzard).lastStep) {
                get(wizzard).addItem();
            } else {
                get(wizzard).next();
            }
        },
        onCtrlEnter: get(wizzard).save,
        onCtrlS: () => (get(wizzard).visible ? get(wizzard).done() : exportAsPfd()),
        onCtrlO: () => {},
        onCtrlL: () => {},
        onCtrlN: () => get(wizzard).new(),
    };

    container.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'Enter':
                    e.stopPropagation();
                    e.preventDefault();
                    actions.onCtrlEnter(e);
                    break;
                case 's':
                    e.stopPropagation();
                    e.preventDefault();
                    actions.onCtrlS(e);
                    break;
                case 'o':
                    e.stopPropagation();
                    e.preventDefault();
                    actions.onCtrlO(e);
                    break;
                case 'l':
                    e.stopPropagation();
                    e.preventDefault();
                    actions.onCtrlL(e);
                    break;
                case 'n':
                    // can not stop browser to open new window
                    e.stopPropagation();
                    e.preventDefault();
                    actions.onCtrlN(e);
                    break;
                default:
                    break;
            }
        } else {
            switch (e.key) {
                case 'Escape':
                    actions.onEscape(e);
                    break;
                case 'ArrowLeft':
                    actions.onArrowLeft(e);
                    break;
                case 'ArrowRight':
                    actions.onArrowRight(e);
                    break;
                case 'Enter':
                    actions.onEnter(e);
                    break;
                default:
                    break;
            }
        }
    });
}
