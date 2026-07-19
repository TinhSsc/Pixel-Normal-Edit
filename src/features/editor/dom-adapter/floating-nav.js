export function initFloatingNav() {
  const nav = document.getElementById('floatingNav');
  const toggleBtn = document.getElementById('toggleNavBtn');
  if (!nav || !toggleBtn) return;


  toggleBtn.onclick = () => {
    nav.classList.toggle('collapsed');
  };
}



