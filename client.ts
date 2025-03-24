import * as alt from 'alt-client';
import * as native from 'natives';

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class CameraDirector {
    private isDirectorMode: boolean = false;
    private cameraPoints: Array<{position: alt.Vector3, rotation: alt.Vector3}> = [];
    private maxPoints: number = 10;
    private camera: number | null = null;
    private isPlayingSequence: boolean = false;
    private cameraMoveSpeed: number = 1.0;
    private cameraRotSpeed: number = 2.0;
    private mouseSensitivity: number = 0.1;
    private cursorWasVisible: boolean = false;


    constructor() {
        alt.on('keyup', this.handleKeyUp.bind(this));
        alt.everyTick(this.handleCameraMovement.bind(this));
    }

    private handleKeyUp(key: number): void {
        const actions: Record<number, () => void | Promise<void>> = {
            116: () => this.toggleDirectorMode(), // F5
            72: () => this.isDirectorMode && this.saveCurrentPoint(), // H
            79: () => this.isDirectorMode && this.playSequence().catch(err => alt.log(`Błąd: ${err}`)), // O
            67: () => this.isDirectorMode && this.clearPoints(), // C
        };

        if (actions[key]) {
            actions[key]();
        }
    }

    private toggleDirectorMode(): void {
        this.isDirectorMode = !this.isDirectorMode;
        alt.emit('cameraDirector:stateChanged', this.isDirectorMode);

        if (this.isDirectorMode) {
            this.startDirectorMode();

            if (!this.camera) {
                this.isDirectorMode = false;
                alt.emit('cameraDirector:stateChanged', this.isDirectorMode);
            }
        } else {
            this.stopDirectorMode();
        }
    }

    private startDirectorMode(): void {
        this.cursorWasVisible = alt.isCursorVisible();

        const { x, y, z } = alt.Player.local.pos;
        this.camera = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            x, y, z,
            0, 0, 0,
            90,
            true,
            2
        );

        if (!this.camera) {
            this.isDirectorMode = false;
            alt.emit('cameraDirector:stateChanged', this.isDirectorMode);
            return
        }

        native.setCamActive(this.camera, true);
        native.renderScriptCams(true, false, 0, true, false, 0);
        alt.toggleGameControls(false);
        alt.showCursor(false);
        native.displayHud(false);
        native.displayRadar(false);
    }

    private handleCameraMovement(): void {
        if (!this.isDirectorMode || !this.camera) return;

        const camPos = native.getCamCoord(this.camera);
        const camRot = native.getCamRot(this.camera, 2);
        const radZ = camRot.z * Math.PI / 180;
        const radX = camRot.x * Math.PI / 180;

        const forward = { x: -Math.sin(radZ) * Math.cos(radX), y: Math.cos(radZ) * Math.cos(radX), z: Math.sin(radX) };
        const right = { x: Math.cos(radZ) * Math.cos(radX), y: Math.sin(radZ) * Math.cos(radX), z: 0 };

        let moved = false;
        let [newX, newY, newZ] = [camPos.x, camPos.y, camPos.z];

        const move = (key: number, dir: { x: number; y: number; z: number }, sign = 1) => {
            if (alt.isKeyDown(key)) {
                newX += sign * dir.x * this.cameraMoveSpeed;
                newY += sign * dir.y * this.cameraMoveSpeed;
                newZ += sign * dir.z * this.cameraMoveSpeed;
                moved = true;
            }
        };

        move(87, forward); // W
        move(83, forward, -1); // S
        move(65, right, -1); // A
        move(68, right); // D
        move(81, { x: 0, y: 0, z: 1 }, -1); // Q
        move(69, { x: 0, y: 0, z: 1 }); // E

        if (moved) native.setCamCoord(this.camera, newX, newY, newZ);

        const { x: cursorX, y: cursorY } = alt.getCursorPos();
        const { x: screenX, y: screenY } = alt.getScreenResolution();
        const [deltaX, deltaY] = [cursorX - screenX / 2, cursorY - screenY / 2];

        if (deltaX || deltaY) {
            const newRotX = Math.max(-89, Math.min(89, camRot.x - deltaY * this.mouseSensitivity * this.cameraRotSpeed));
            const newRotZ = camRot.z - deltaX * this.mouseSensitivity * this.cameraRotSpeed;
            native.setCamRot(this.camera, newRotX, camRot.y, newRotZ, 2);
            alt.setCursorPos({ x: screenX / 2, y: screenY / 2 });
        }
    }


    private stopDirectorMode(): void {
        if (this.camera !== null) {
            native.setCamActive(this.camera, false);
            native.destroyCam(this.camera, true);
            native.renderScriptCams(false, false, 0, true, false, 0);
            this.camera = null;
        }
        
        if (this.cursorWasVisible && !alt.isCursorVisible()) {
            alt.showCursor(true);
        }
        native.displayHud(true);
        native.displayRadar(true);
        alt.toggleGameControls(true);
    }

    private saveCurrentPoint(): void {
        if (this.isPlayingSequence) {
            return;
        }

        if (this.cameraPoints.length >= this.maxPoints) {
            return;
        }

        if (this.camera === null) return;

        const camCoords = native.getCamCoord(this.camera);
        const camRot = native.getCamRot(this.camera, 2);

        this.cameraPoints.push({
            position: new alt.Vector3(camCoords.x, camCoords.y, camCoords.z),
            rotation: new alt.Vector3(camRot.x, camRot.y, camRot.z)
        });

        alt.emit('cameraDirector:pointSaved', this.cameraPoints.length);
    }

    private clearPoints(): void {
        if (this.isPlayingSequence) {
            return;
        }

        this.cameraPoints = [];
        alt.emit('cameraDirector:pointSaved', 0);
    }

    private async playSequence(): Promise<void> {
        if (this.isPlayingSequence) return;
        if (this.cameraPoints.length < 1) {
            return;
        }

        this.isPlayingSequence = true;
        alt.emit('cameraDirector:playingSequence', true);
        
        let seqCamera = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            this.cameraPoints[0].position.x,
            this.cameraPoints[0].position.y,
            this.cameraPoints[0].position.z,
            this.cameraPoints[0].rotation.x,
            this.cameraPoints[0].rotation.y,
            this.cameraPoints[0].rotation.z,
            90,
            true,
            2
        );
        
        native.setCamActive(seqCamera, true);
        native.renderScriptCams(true, false, 0, true, false, 0);
        
        if (this.cameraPoints.length === 1) {
            await sleep(3000);
        } else {
            for (let i = 0; i < this.cameraPoints.length - 1; i++) {
                const next = this.cameraPoints[i + 1];
                
                let nextCam = native.createCamWithParams(
                    'DEFAULT_SCRIPTED_CAMERA',
                    next.position.x,
                    next.position.y,
                    next.position.z,
                    next.rotation.x,
                    next.rotation.y,
                    next.rotation.z,
                    90,
                    true,
                    2
                );
                
                native.setCamActiveWithInterp(nextCam, seqCamera, 3000, 1, 1);
                await sleep(3000);
                native.destroyCam(seqCamera, true);
                seqCamera = nextCam;
            }
        }
        
        native.setCamActive(seqCamera, false);
        native.destroyCam(seqCamera, true);
        
        if (this.camera !== null) {
            native.setCamActive(this.camera, true);
            native.renderScriptCams(true, false, 0, true, false, 0);
        }

        this.isPlayingSequence = false;
        alt.emit('cameraDirector:playingSequence', false);
    }
}

const webview = new alt.WebView('http://resource/ui/dist/index.html');
alt.on('cameraDirector:stateChanged', (state) => {
    webview.emit('cameraDirector:stateChanged', state);
});

alt.on('cameraDirector:pointSaved', (count) => {
    webview.emit('cameraDirector:pointSaved', count);
});

alt.on('cameraDirector:clearPoints', () => {
    const director = (globalThis as any).cameraDirectorInstance;
    if (director) {
        director.clearPoints();
    }
});

alt.on('cameraDirector:playingSequence', (state) => {
    webview.emit('cameraDirector:playingSequence', state);
});

const director = new CameraDirector();
(globalThis as any).cameraDirectorInstance = director;