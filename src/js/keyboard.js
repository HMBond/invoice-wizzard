export default class Keyboard {
  constructor(
    container,
    {
      onEscape,
      onArrowLeft,
      onArrowRight,
      onEnter,
      onCtrlEnter,
      onCtrlS,
      onCtrlO,
      onCtrlN,
      onCtrlL
    }
  ) {
    container.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'Enter':
            e.stopPropagation();
            e.preventDefault();
            onCtrlEnter(e);
            break;
          case 's':
            e.stopPropagation();
            e.preventDefault();
            onCtrlS(e);
            break;
          case 'o':
            e.stopPropagation();
            e.preventDefault();
            onCtrlO(e);
            break;
          case 'l':
            e.stopPropagation();
            e.preventDefault();
            onCtrlL(e);
            break;
          case 'n':
            // can not stop browser to open new window
            e.stopPropagation();
            e.preventDefault();
            onCtrlN(e);
            break;
          default:
            break;
        }
      } else {
        switch (e.key) {
          case 'Escape':
            onEscape(e);
            break;
          case 'ArrowLeft':
            onArrowLeft(e);
            break;
          case 'ArrowRight':
            onArrowRight(e);
            break;
          case 'Enter':
            onEnter(e);
            break;
          default:
            break;
        }
      }
    });
  }
}
