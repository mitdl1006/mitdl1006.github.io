document.addEventListener('DOMContentLoaded', () => {
  const scrollContainer = document.createElement('div');
  scrollContainer.id = 'scroll-progress-container';

  const scrollBar = document.createElement('div');
  scrollBar.id = 'scroll-progress-bar';
  scrollContainer.appendChild(scrollBar);

  document.body.prepend(scrollContainer);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const doc = document.documentElement;
  const readtime = document.querySelector('.readtime');
  const readProgress = readtime
    ? readtime.querySelector('.readtime__progress')
    : null;
  const readProgressSeparator = readtime
    ? readtime.querySelector('.readtime__progress-separator')
    : null;
  const article = document.querySelector('article');
  const progressLabel =
    readtime && readtime.dataset.readProgressLabel
      ? readtime.dataset.readProgressLabel
      : 'read';

  const updateProgress = () => {
    const scrollTop = window.pageYOffset || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    scrollBar.style.transform = `scaleX(${clamp(progress / 100, 0, 1)})`;
  };

  // Update read-time badge with reading progress
  const updateReadIndicator = () => {
    if (!readtime || !article || !readProgress || !readProgressSeparator) {
      return;
    }

    const articleTop = article.getBoundingClientRect().top + window.pageYOffset;
    const articleHeight = Math.max(article.scrollHeight, article.offsetHeight);
    if (articleHeight === 0) {
      return;
    }

    const viewportHeight = window.innerHeight || doc.clientHeight;
    const scrollTop = window.pageYOffset || doc.scrollTop;
    const viewportBottom = scrollTop + viewportHeight;
    const percent = clamp((viewportBottom - articleTop) / articleHeight, 0, 1);
    const display = Math.round(percent * 100);

    if (display <= 0 || display >= 100) {
      readProgress.classList.add('d-none');
      readProgressSeparator.classList.add('d-none');
      return;
    }

    readProgress.textContent = `${display}% ${progressLabel}`;
    readProgress.classList.remove('d-none');
    readProgressSeparator.classList.remove('d-none');
  };

  const handleScroll = () => {
    updateProgress();
    updateReadIndicator();
  };

  updateProgress();
  updateReadIndicator();

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', () => {
    updateProgress();
    updateReadIndicator();
  });

  document.querySelectorAll('.js-post-print').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      window.print();
    });
  });
});
