document.addEventListener('DOMContentLoaded', () => {
  const scrollContainer = document.createElement('div');
  scrollContainer.id = 'scroll-progress-container';

  const scrollBar = document.createElement('div');
  scrollBar.id = 'scroll-progress-bar';
  scrollContainer.appendChild(scrollBar);

  document.body.prepend(scrollContainer);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    scrollBar.style.transform = `scaleX(${clamp(progress / 100, 0, 1)})`;
  };

  updateProgress();

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
});
