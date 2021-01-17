export default function print({ BrowserWindow, fs, path, os }) {
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
      const pdfPath = path.join(
        os.homedir(),
        'Desktop',
        state.invoice.id + '.pdf'
      );
      fs.writeFile(pdfPath, data, (error) => {
        if (error) throw error;
        console.log(`Wrote PDF successfully to ${pdfPath}`);
      });
    })
    .catch((error) => {
      console.log(`Failed to write PDF to ${pdfPath}: `, error);
    });
}
