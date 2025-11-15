document.addEventListener('DOMContentLoaded', () => {
  const scrollContainer = document.createElement('div');
  scrollContainer.id = 'scroll-progress-container';

  const scrollBar = document.createElement('div');
  scrollBar.id = 'scroll-progress-bar';
  scrollContainer.appendChild(scrollBar);

  const scrollTooltip = document.createElement('div');
  scrollTooltip.id = 'scroll-progress-tooltip';
  scrollTooltip.setAttribute('role', 'status');
  scrollTooltip.setAttribute('aria-live', 'polite');
  scrollContainer.appendChild(scrollTooltip);

  const progressPill = document.createElement('div');
  progressPill.id = 'scroll-progress-pill';
  progressPill.setAttribute('role', 'status');
  progressPill.setAttribute('aria-live', 'polite');

  const pillPercent = document.createElement('span');
  pillPercent.className = 'pill-percent';
  const pillSeparator = document.createElement('span');
  pillSeparator.className = 'pill-separator';
  pillSeparator.setAttribute('aria-hidden', 'true');
  pillSeparator.textContent = '•';
  const pillRemaining = document.createElement('span');
  pillRemaining.className = 'pill-remaining';

  progressPill.append(pillPercent, pillSeparator, pillRemaining);

  document.body.prepend(scrollContainer);
  document.body.appendChild(progressPill);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const doc = document.documentElement;
  const locale =
    document.documentElement.lang ||
    (typeof navigator !== 'undefined' ? navigator.language : 'en') ||
    'en';
  const sidebarCollapseButton = document.getElementById('sidebar-collapse');
  const sidebarTrigger = document.getElementById('sidebar-trigger');
  const SIDEBAR_COLLAPSE_KEY = 'sidebar-collapsed';
  const READING_MODE_KEY = 'reading-mode';
  const lgMediaQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 992px)')
      : null;
  let isSidebarCollapsed = false;
  let readingModeEnabled = false;
  const readtime = document.querySelector('.readtime');
  const readProgress = readtime
    ? readtime.querySelector('.readtime__progress')
    : null;
  const readProgressSeparator = readtime
    ? readtime.querySelector('.readtime__progress-separator')
    : null;
  const readEta = readtime ? readtime.querySelector('.readtime__eta') : null;
  const readEtaSeparator = readtime
    ? readtime.querySelector('.readtime__eta-separator')
    : null;
  const article = document.querySelector('article');
  const progressLabel =
    readtime && readtime.dataset.readProgressLabel
      ? readtime.dataset.readProgressLabel
      : 'read';
  const etaLabel =
    readtime && readtime.dataset.readEtaLabel
      ? readtime.dataset.readEtaLabel
      : 'Finish by';
  const remainingLabel =
    readtime && readtime.dataset.readRemainingLabel
      ? readtime.dataset.readRemainingLabel
      : 'remaining';
  const readMinutes =
    readtime && readtime.dataset.readMinutes
      ? parseInt(readtime.dataset.readMinutes, 10)
      : null;

  let tooltipDetail = false;
  let tooltipDetailTimeout;
  let tooltipPercent = 0;
  let tooltipEta = '';

  const persistState = (key, value) => {
    try {
      if (value) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`${key} persistence failed`, error);
    }
  };

  const getPersistedState = (key, compare = 'true') => {
    try {
      return localStorage.getItem(key) === compare;
    } catch (error) {
      return false;
    }
  };

  const setReadingMode = (enabled, persist = true) => {
    const nextState = !!enabled;

    if (readingModeEnabled === nextState) {
      return;
    }

    readingModeEnabled = nextState;

    if (readingModeEnabled) {
      document.body.setAttribute('data-reading-mode', 'on');
    } else {
      document.body.removeAttribute('data-reading-mode');
    }

    if (persist) {
      persistState(READING_MODE_KEY, readingModeEnabled ? 'on' : null);
    }
  };

  const formatRemaining = (minutes) => {
    if (!minutes || Number.isNaN(minutes) || minutes <= 0) {
      return '';
    }

    const rounded = Math.max(Math.ceil(minutes), 1);

    if (locale.startsWith('ko')) {
      return `약 ${rounded}분`;
    }

    return `~${rounded}m`;
  };

  const updateProgressPill = () => {
    if (!progressPill) {
      return;
    }

    if (tooltipPercent <= 0 || tooltipPercent >= 100) {
      progressPill.classList.remove('is-visible');
      progressPill.removeAttribute('aria-label');
      return;
    }

    const cappedPercent = Math.min(tooltipPercent, 100);
    pillPercent.textContent = `${cappedPercent}%`;

    let remainingText = '';

    if (readMinutes && !Number.isNaN(readMinutes) && readMinutes > 0) {
      const remainingMinutes =
        readMinutes * Math.max(1 - cappedPercent / 100, 0);
      const formatted = formatRemaining(remainingMinutes);

      if (formatted) {
        remainingText = `${formatted} ${remainingLabel}`;
      }
    }

    if (remainingText) {
      pillSeparator.classList.remove('d-none');
      pillRemaining.textContent = remainingText;
      pillRemaining.classList.remove('d-none');
    } else {
      pillSeparator.classList.add('d-none');
      pillRemaining.textContent = '';
      pillRemaining.classList.add('d-none');
    }

    const ariaLabel = remainingText
      ? `${cappedPercent}% ${remainingText}`
      : `${cappedPercent}%`;
    progressPill.setAttribute('aria-label', ariaLabel);
    progressPill.classList.add('is-visible');
  };

  const renderTooltip = () => {
    if (!scrollTooltip) {
      return;
    }

    if (tooltipPercent <= 0) {
      scrollTooltip.classList.remove('is-visible');
      scrollTooltip.textContent = '';
      return;
    }

    const capped = Math.min(tooltipPercent, 100);
    const baseText = `${capped}%`;
    const detailText = tooltipEta ? `${baseText} · ${tooltipEta}` : baseText;
    scrollTooltip.textContent = tooltipDetail ? detailText : baseText;
    scrollTooltip.classList.add('is-visible');
  };

  const calcProgressPercent = () => {
    if (!article) {
      return null;
    }

    const currentScrollTop = window.pageYOffset || doc.scrollTop;
    const articleTop = article.getBoundingClientRect().top + currentScrollTop;
    const articleHeight = Math.max(article.scrollHeight, article.offsetHeight);
    if (articleHeight === 0) {
      return null;
    }

    const viewportHeight = window.innerHeight || doc.clientHeight;
    const viewportBottom = currentScrollTop + viewportHeight;
    const percent = clamp((viewportBottom - articleTop) / articleHeight, 0, 1);
    return Math.round(percent * 100);
  };

  const updateProgress = () => {
    const scrollTop = window.pageYOffset || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    scrollBar.style.transform = `scaleX(${clamp(progress / 100, 0, 1)})`;
  };

  // Update read-time badge with reading progress
  const updateReadIndicator = () => {
    const display = calcProgressPercent();

    if (display === null) {
      tooltipPercent = 0;
      renderTooltip();
      updateProgressPill();
      return;
    }

    tooltipPercent = display;
    renderTooltip();
    updateProgressPill();

    if (!readtime || !readProgress || !readProgressSeparator) {
      return;
    }

    if (display <= 0 || display >= 100) {
      readProgress.classList.add('d-none');
      readProgressSeparator.classList.add('d-none');
      return;
    }

    readProgress.textContent = `${display}% ${progressLabel}`;
    readProgress.classList.remove('d-none');
    readProgressSeparator.classList.remove('d-none');
  };

  const updateEtaIndicator = () => {
    if (!readMinutes || Number.isNaN(readMinutes) || readMinutes <= 0) {
      if (readEta && readEtaSeparator) {
        readEta.classList.add('d-none');
        readEtaSeparator.classList.add('d-none');
      }
      tooltipEta = '';
      renderTooltip();
      return;
    }

    const now = new Date();
    const finish = new Date(now.getTime() + readMinutes * 60000);
    const time = finish.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (readEta && readEtaSeparator) {
      readEta.textContent = `${etaLabel}: ${time}`;
      readEta.classList.remove('d-none');
      readEtaSeparator.classList.remove('d-none');
    }
    tooltipEta = `${etaLabel} ${time}`;
    renderTooltip();
    updateProgressPill();
  };

  const handleScroll = () => {
    updateProgress();
    updateReadIndicator();
  };

  updateProgress();
  updateReadIndicator();
  updateEtaIndicator();

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', () => {
    updateProgress();
    updateReadIndicator();
    updateEtaIndicator();
  });
  window.addEventListener('focus', updateEtaIndicator);

  scrollContainer.addEventListener('pointerenter', () => {
    tooltipDetail = true;
    renderTooltip();
  });

  scrollContainer.addEventListener('pointerleave', () => {
    tooltipDetail = false;
    renderTooltip();
  });

  scrollContainer.addEventListener('pointerdown', () => {
    tooltipDetail = true;
    renderTooltip();

    if (tooltipDetailTimeout) {
      clearTimeout(tooltipDetailTimeout);
    }

    tooltipDetailTimeout = setTimeout(() => {
      tooltipDetail = false;
      renderTooltip();
    }, 1600);
  });

  document.querySelectorAll('.js-post-print').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      window.print();
    });
  });

  const applySidebarCollapsedState = (collapsed, persist = true) => {
    if (!sidebarCollapseButton || !lgMediaQuery) {
      return;
    }

    isSidebarCollapsed = !!collapsed;

    if (isSidebarCollapsed) {
      document.body.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.body.removeAttribute('data-sidebar-collapsed');
    }

    const collapseLabel =
      sidebarCollapseButton.dataset.collapseLabel || 'Collapse sidebar';
    const expandLabel =
      sidebarCollapseButton.dataset.expandLabel || 'Expand sidebar';
    const appliedLabel = isSidebarCollapsed ? expandLabel : collapseLabel;

    sidebarCollapseButton.setAttribute(
      'aria-pressed',
      isSidebarCollapsed ? 'true' : 'false'
    );
    sidebarCollapseButton.setAttribute('aria-label', appliedLabel);
    sidebarCollapseButton.setAttribute('title', appliedLabel);
    sidebarCollapseButton.classList.toggle('is-collapsed', isSidebarCollapsed);

    if (persist) {
      persistState(SIDEBAR_COLLAPSE_KEY, isSidebarCollapsed ? 'true' : null);
    }
  };

  if (sidebarCollapseButton && lgMediaQuery) {
    const initializeSidebarCollapse = () => {
      if (lgMediaQuery.matches) {
        const storedCollapse = getPersistedState(SIDEBAR_COLLAPSE_KEY);
        const storedReading = getPersistedState(READING_MODE_KEY, 'on');
        applySidebarCollapsedState(storedCollapse, false);
        setReadingMode(storedReading, false);
      } else {
        applySidebarCollapsedState(false);
        setReadingMode(false, false);
      }
    };

    initializeSidebarCollapse();

    sidebarCollapseButton.addEventListener('click', () => {
      if (lgMediaQuery.matches) {
        const nextState = !isSidebarCollapsed;
        applySidebarCollapsedState(nextState);
        setReadingMode(nextState);
      } else if (sidebarTrigger) {
        sidebarTrigger.click();
      }
    });

    const handleMediaChange = (event) => {
      if (event.matches) {
        const storedCollapse = getPersistedState(SIDEBAR_COLLAPSE_KEY);
        const storedReading = getPersistedState(READING_MODE_KEY, 'on');
        applySidebarCollapsedState(storedCollapse, false);
        setReadingMode(storedReading, false);
      } else {
        applySidebarCollapsedState(false);
        setReadingMode(false, false);
      }
    };

    if (typeof lgMediaQuery.addEventListener === 'function') {
      lgMediaQuery.addEventListener('change', handleMediaChange);
    } else if (typeof lgMediaQuery.addListener === 'function') {
      lgMediaQuery.addListener(handleMediaChange);
    }
  }
});
