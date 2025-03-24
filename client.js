import * as alt from 'alt-client';
import * as native from 'natives';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class CameraDirector {
    isDirectorMode = false;
    cameraPoints = [];
    maxPoints = 10;
    camera = null;
    isPlayingSequence = false;
    cameraMoveSpeed = 1.0;
    cameraRotSpeed = 2.0;
    mouseSensitivity = 0.1;
    cursorWasVisible = false;
    constructor() {
        alt.on('keyup', this.handleKeyUp.bind(this));
        alt.everyTick(this.handleCameraMovement.bind(this));
    }
    handleKeyUp(key) {
        const actions = {
            116: () => this.toggleDirectorMode(),
            72: () => this.isDirectorMode && this.saveCurrentPoint(),
            79: () => this.isDirectorMode && this.playSequence().catch(err => alt.log(`Błąd: ${err}`)),
            67: () => this.isDirectorMode && this.clearPoints(),
        };
        if (actions[key]) {
            actions[key]();
        }
    }
    toggleDirectorMode() {
        this.isDirectorMode = !this.isDirectorMode;
        alt.emit('cameraDirector:stateChanged', this.isDirectorMode);
        if (this.isDirectorMode) {
            this.startDirectorMode();
            if (!this.camera) {
                this.isDirectorMode = false;
                alt.emit('cameraDirector:stateChanged', this.isDirectorMode);
            }
        }
        else {
            this.stopDirectorMode();
        }
    }
    startDirectorMode() {
        this.cursorWasVisible = alt.isCursorVisible();
        const { x, y, z } = alt.Player.local.pos;
        this.camera = native.createCamWithParams('DEFAULT_SCRIPTED_CAMERA', x, y, z, 0, 0, 0, 90, true, 2);
        if (!this.camera) {
            this.isDirectorMode = false;
            alt.emit('cameraDirector:stateChanged', this.isDirectorMode);
            return;
        }
        native.setCamActive(this.camera, true);
        native.renderScriptCams(true, false, 0, true, false, 0);
        alt.toggleGameControls(false);
        alt.showCursor(false);
        native.displayHud(false);
        native.displayRadar(false);
    }
    handleCameraMovement() {
        if (!this.isDirectorMode || !this.camera)
            return;
        const camPos = native.getCamCoord(this.camera);
        const camRot = native.getCamRot(this.camera, 2);
        const radZ = camRot.z * Math.PI / 180;
        const radX = camRot.x * Math.PI / 180;
        const forward = { x: -Math.sin(radZ) * Math.cos(radX), y: Math.cos(radZ) * Math.cos(radX), z: Math.sin(radX) };
        const right = { x: Math.cos(radZ) * Math.cos(radX), y: Math.sin(radZ) * Math.cos(radX), z: 0 };
        let moved = false;
        let [newX, newY, newZ] = [camPos.x, camPos.y, camPos.z];
        const move = (key, dir, sign = 1) => {
            if (alt.isKeyDown(key)) {
                newX += sign * dir.x * this.cameraMoveSpeed;
                newY += sign * dir.y * this.cameraMoveSpeed;
                newZ += sign * dir.z * this.cameraMoveSpeed;
                moved = true;
            }
        };
        move(87, forward);
        move(83, forward, -1);
        move(65, right, -1);
        move(68, right);
        move(81, { x: 0, y: 0, z: 1 }, -1);
        move(69, { x: 0, y: 0, z: 1 });
        if (moved)
            native.setCamCoord(this.camera, newX, newY, newZ);
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
    stopDirectorMode() {
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
    saveCurrentPoint() {
        if (this.isPlayingSequence) {
            return;
        }
        if (this.cameraPoints.length >= this.maxPoints) {
            return;
        }
        if (this.camera === null)
            return;
        const camCoords = native.getCamCoord(this.camera);
        const camRot = native.getCamRot(this.camera, 2);
        this.cameraPoints.push({
            position: new alt.Vector3(camCoords.x, camCoords.y, camCoords.z),
            rotation: new alt.Vector3(camRot.x, camRot.y, camRot.z)
        });
        alt.emit('cameraDirector:pointSaved', this.cameraPoints.length);
    }
    clearPoints() {
        if (this.isPlayingSequence) {
            return;
        }
        this.cameraPoints = [];
        alt.emit('cameraDirector:pointSaved', 0);
    }
    async playSequence() {
        if (this.isPlayingSequence)
            return;
        if (this.cameraPoints.length < 1) {
            return;
        }
        this.isPlayingSequence = true;
        alt.emit('cameraDirector:playingSequence', true);
        let seqCamera = native.createCamWithParams('DEFAULT_SCRIPTED_CAMERA', this.cameraPoints[0].position.x, this.cameraPoints[0].position.y, this.cameraPoints[0].position.z, this.cameraPoints[0].rotation.x, this.cameraPoints[0].rotation.y, this.cameraPoints[0].rotation.z, 90, true, 2);
        native.setCamActive(seqCamera, true);
        native.renderScriptCams(true, false, 0, true, false, 0);
        if (this.cameraPoints.length === 1) {
            await sleep(3000);
        }
        else {
            for (let i = 0; i < this.cameraPoints.length - 1; i++) {
                const next = this.cameraPoints[i + 1];
                let nextCam = native.createCamWithParams('DEFAULT_SCRIPTED_CAMERA', next.position.x, next.position.y, next.position.z, next.rotation.x, next.rotation.y, next.rotation.z, 90, true, 2);
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
    const director = globalThis.cameraDirectorInstance;
    if (director) {
        director.clearPoints();
    }
});
alt.on('cameraDirector:playingSequence', (state) => {
    webview.emit('cameraDirector:playingSequence', state);
});
const director = new CameraDirector();
globalThis.cameraDirectorInstance = director;
