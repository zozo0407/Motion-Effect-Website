export const runBootSequence = ({ initHero, letters }) => {
  const bootScreen = document.getElementById('boot-sequence');
  const bar = document.getElementById('boot-bar');
  const percent = document.getElementById('boot-percent');
  const log = document.getElementById('boot-log');
  const logs = [
    'LOADING CORE MODULES...',
    'MOUNTING FILE SYSTEM...',
    'CONNECTING TO NEURAL NET...',
    'CALIBRATING OPTICS...',
    'OPTIMIZING SHADERS...',
    'SYSTEM READY.',
    'INIT: GPU ACCELERATION ENABLED',
    'ALLOCATING VRAM BUFFER [0x84F2]',
    'LOADING ASSETS: TEXTURES/HDRI',
    'COMPILING WEBGL PROGRAMS...',
    'VERIFYING INTEGRITY CHECKS...',
    'ESTABLISHING SECURE TUNNEL...',
    'SYNCING CLOUD CONFIG...',
    'DECRYPTING USER PREFERENCES...',
    'LOADING PHYSICS ENGINE...',
    'INITIALIZING AUDIO CONTEXT...',
    'PRE-CACHING GEOMETRY DATA...',
    'RENDERING VIEWPORT...',
    'EXECUTING STARTUP SCRIPT...',
  ];

  let progress = 0;
  let logIndex = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 2;
    if (progress > 100) progress = 100;

    bar.style.width = `${progress}%`;
    percent.innerText = `${Math.floor(progress)}%`;

    if (Math.random() > 0.3) {
      const div = document.createElement('div');
      const time = new Date().toISOString().split('T')[1].split('.')[0];
      const hex =
        '0x' +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .toUpperCase()
          .padStart(6, '0');

      const logMsg = logs[logIndex % logs.length];

      div.innerHTML = `<span class="opacity-50">[${time}]</span> <span class="text-white/60">${hex}</span> > ${logMsg}`;
      div.className =
        'mb-1 border-l-2 border-capcut-green/30 pl-2 animate-fade-in';

      log.insertBefore(div, log.firstChild);

      if (log.children.length > 20) {
        log.removeChild(log.lastChild);
      }

      logIndex++;
    }

    if (progress === 100) {
      clearInterval(interval);

      gsap.to(bootScreen, {
        duration: 0.8,
        scaleY: 0,
        transformOrigin: 'center',
        ease: 'power4.inOut',
        delay: 0.5,
        onComplete: () => {
          bootScreen.style.display = 'none';
          document.body.classList.remove('overflow-hidden');

          initHero();
          gsap.from('.animate-fade-in', { opacity: 0, y: 20, duration: 1 });
          gsap.from('h1', {
            opacity: 0,
            y: 50,
            duration: 1,
            delay: 0.2,
            ease: 'power3.out',
            onComplete: () => {
              document.querySelectorAll('.scramble-on-load').forEach((el) => {
                const originalText = el.dataset.value;
                let iteration = 0;
                const interval = setInterval(() => {
                  el.innerText = originalText
                    .split('')
                    .map((letter, index) => {
                      if (index < iteration) {
                        return originalText[index];
                      }
                      return letters[Math.floor(Math.random() * letters.length)];
                    })
                    .join('');

                  if (iteration >= originalText.length) {
                    clearInterval(interval);
                    el.innerText = originalText;
                  }

                  iteration += 1 / 3;
                }, 30);
              });
            },
          });
        },
      });
    }
  }, 20);
};
