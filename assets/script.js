const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    menuBtn.textContent = mobileMenu.classList.contains('open') ? '×' : '☰';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuBtn.textContent = '☰';
    });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('show');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

const header = document.querySelector('header');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > 100) {
    header.style.background = 'rgba(7,9,12,.88)';
  } else {
    header.style.background = 'rgba(7,9,12,.72)';
  }
  lastScroll = currentScroll;
});