document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app-container');

  const loadComponent = async (url) => {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  };

  const initComponents = async () => {
    const header = await loadComponent('js/components/header.html');
    const hero = await loadComponent('js/components/hero.html');
    const mainContent = await loadComponent('js/components/mainContent.html');
    const readerModal = await loadComponent('js/components/readerModal.html');
    const footer = await loadComponent('js/components/footer.html');

    appContainer.innerHTML = header + hero + mainContent + readerModal + footer;
  };

  initComponents();
});
