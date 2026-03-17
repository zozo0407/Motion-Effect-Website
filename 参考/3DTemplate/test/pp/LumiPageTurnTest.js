
import * as THREE from 'three';
import { BaseTest } from './BaseTest.js';
const { PageTurnShaderPass } = require('../../src/pp/LumiPageTurn/PageTurnShaderPass.js');

class LumiPageTurnTest extends BaseTest {
    constructor() {
        super();
        this.params = {};
    }

    async init() {
        this.effect = new PageTurnShaderPass();
        await super.init();
    }

    setupGUI() {
        this.params = {
            classic_ui: 1, // 默认为"Top Left Corner"
            inCornerPosition: [0, 1.57],
            inFoldPosition: [0, 1],
            inFoldDirection: 234,
            foldRadius: 0.3,
            renderFace: 0, // 默认为"Front & Back Page"
            frontTex: null // Back Page layer
        };

        // Controls (classic_ui)
        this.gui.add(this.params, 'classic_ui', {
            'Classic UI': 0,
            'Top Left Corner': 1,
            'Top Right Corner': 2,
            'Bottom Left Corner': 3,
            'Bottom Right Corner': 4
        }).name('Controls').onChange(value => {
            this.effect.setClassicUi(value);
        });

        // inFold position
        const foldPositionFolder = this.gui.addFolder('inFold position');
        foldPositionFolder.add(this.params.inFoldPosition, '0', 0, 100).name('X').onChange(value => {
            this.params.inFoldPosition[0] = value;
            this.effect.setInFoldPosition(this.params.inFoldPosition);
        });
        foldPositionFolder.add(this.params.inFoldPosition, '1', 0, 100).name('Y').onChange(value => {
            this.params.inFoldPosition[1] = value;
            this.effect.setInFoldPosition(this.params.inFoldPosition);
        });

        // inCorner position
        const cornerPositionFolder = this.gui.addFolder('inCorner position');
        cornerPositionFolder.add(this.params.inCornerPosition, '0', 0, 100).name('X').onChange(value => {
            this.params.inCornerPosition[0] = value;
            this.effect.setInCornerPosition(this.params.inCornerPosition);
        });
        cornerPositionFolder.add(this.params.inCornerPosition, '1', 0, 100).name('Y').onChange(value => {
            this.params.inCornerPosition[1] = value;
            this.effect.setInCornerPosition(this.params.inCornerPosition);
        });

        // Fold Direction
        this.gui.add(this.params, 'inFoldDirection', 0, 360).name('Fold Direction').onChange(value => {
            this.effect.setInFoldDirection(value);
        });

        // Fold Radius
        this.gui.add(this.params, 'foldRadius', 0.0, 5.0).name('Fold Radius').onChange(value => {
            this.effect.setFoldRadius(value);
        });

        // Render Face
        this.gui.add(this.params, 'renderFace', {
            'Front & Back Page': 0,
            'Back Page': 1,
            'Front Page': 2
        }).name('Render Face').onChange(value => {
            this.effect.setRenderFace(value);
        });

        super.setupGUI();
    }
}

export { LumiPageTurnTest };
