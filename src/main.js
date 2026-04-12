        import { initHero } from './site/hero.js';
        import { runBootSequence } from './site/boot.js';
        import { generateAIHTML, generateTemplateHTML } from './site/templates.js';
        import { flipCard, initTextScramble, letters } from './site/ui.js';
        import {
            fetchDemos,
            deleteDemo,
            handleDragEnd,
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDragStart,
            handleDrop,
            initFilters,
            initGridInteractions,
            initSearch,
            moveDemo,
            prependDemo,
            selectSearchResultFactory,
            sortSwitchButtons,
            toggleStudioMode,
        } from './site/demos.js';
        import {
            initLab,
            openLab,
            closeLab,
            updateDemoParam,
            resetDemo,
            triggerSaveImage,
            triggerExportScriptScene,
            triggerExportGameJS,
            openExportSettings,
            toggleRecording,
        } from './site/lab.js';
        import { initAIChat, sendAIChat } from './site/ai-chat.js';
        import { resetAutoHeal } from './site/lab-autoheal.js';
        import {
            initWizard,
            openWizard,
            closeConsole,
            selectTemplate,
            fillRandomPrompt,
            enhancePrompt,
            goToStep,
            updateConfigPreview,
            generateDemo,
            readWizardFile,
        } from './site/wizard.js';

        // Clear safety timeout immediately upon module execution
        if (typeof bootTimeout !== 'undefined') clearTimeout(bootTimeout);

        // --- Clock & FPS Simulation ---
        function updateStats() {
            // FPS Jitter
            const fps = 58 + Math.floor(Math.random() * 4);
            document.getElementById('fps-counter').innerText = `FPS: ${fps}`;
        }
        setInterval(updateStats, 1000);

        window.closeConsole = closeConsole;
        // window.addTag = addTag;
        // window.submitConsole = submitConsole;

        // Expose functions to global window object for HTML onclick handlers
        window.updateDemoParam = updateDemoParam;
        window.resetDemo = resetDemo;
        window.openLab = openLab;
        window.closeLab = closeLab;
        window.initLab = initLab;
        window.triggerSaveImage = triggerSaveImage;
        window.triggerExportScriptScene = triggerExportScriptScene;
        window.triggerExportGameJS = triggerExportGameJS;
        window.openExportSettings = openExportSettings;
        window.toggleRecording = toggleRecording;
        window.flipCard = flipCard;
        window.openWizard = openWizard;
        window.selectTemplate = selectTemplate;
        window.fillRandomPrompt = fillRandomPrompt;
        window.enhancePrompt = enhancePrompt;
        window.goToStep = goToStep;
        window.updateConfigPreview = updateConfigPreview;
        window.generateDemo = generateDemo;
        window.readWizardFile = readWizardFile;
        window.toggleStudioMode = toggleStudioMode;
        window.deleteDemo = deleteDemo;
        window.moveDemo = moveDemo;
        window.handleDragStart = handleDragStart;
        window.handleDragEnd = handleDragEnd;
        window.handleDragOver = handleDragOver;
        window.handleDragEnter = handleDragEnter;
        window.handleDragLeave = handleDragLeave;
        window.handleDrop = handleDrop;
        window.selectSearchResult = selectSearchResultFactory({ openLab });
        window.sendAIChat = () => sendAIChat({ updateDemoParam });

        // --- Init ---
        // Initialize immediately to avoid missing the load event in module scripts
        const init = () => {
            initLab();
            initAIChat({ updateDemoParam });
            initWizard({ openLab, prependDemo, generateAIHTML, generateTemplateHTML });
            initTextScramble();
            fetchDemos();
            sortSwitchButtons();
            initGridInteractions({ openLab });
            initFilters();
            initSearch({ openLab });

            // Lenis
            if (typeof Lenis !== 'undefined') {
                const lenis = new Lenis();
                function raf(time) {
                    lenis.raf(time);
                    requestAnimationFrame(raf);
                }
                requestAnimationFrame(raf);
            }
            
            runBootSequence({ initHero, letters });
        };

        // Run init immediately as module scripts are deferred by default
        init();
