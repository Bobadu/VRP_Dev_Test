/* eslint-disable */
import { useState, useEffect } from 'react';
    
declare global {
    interface Window {
        alt: any;
    }
}

const alt = window.alt || {
    on: (_event: string, _callback: Function) => {},
    off: (_event: string) => {},
    emit: (_event: string, _data: any) => {},
};

const CameraDirectorUI = () => {
    const [isDirectorMode, setIsDirectorMode] = useState(false);
    const [pointCount, setPointCount] = useState(0);
    const [maxPoints] = useState(10);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        alt.on('cameraDirector:stateChanged', (active: boolean) => {
            setIsDirectorMode(active);
        });

        alt.on('cameraDirector:pointSaved', (count: number) => {
            setPointCount(count);
        });

        alt.on('cameraDirector:playingSequence', (playing: boolean) => {
            setIsPlaying(playing);
        });

        return () => {
            alt.off('cameraDirector:stateChanged');
            alt.off('cameraDirector:pointSaved');
            alt.off('cameraDirector:playingSequence');
        };
    }, []);
    
    // @ts-ignore
    const handleClearPoints = () => {
        if (isPlaying) return;
        alt.emit('cameraDirector:clearPoints');
    };
    
    useEffect(() => {
        if (import.meta.env.DEV) {
            setIsDirectorMode(true);
            setPointCount(3);
        }
    }, []);
    
    if (!isDirectorMode) return null;

    return (
        <div className="fixed bottom-10 right-10 w-96 bg-black/85 backdrop-blur-sm rounded-2xl shadow-2xl text-white p-5 font-sans border border-[#EC1692]/30 transition-all duration-300 ease-in-out">
            <div className="relative -mx-5 -mt-5 px-5 pt-5 pb-3 mb-4 bg-gradient-to-r from-black/80 to-[#EC1692]/20 rounded-t-2xl border-b border-[#EC1692]/30">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#EC1692] flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                        </svg>
                        Tryb Reżysera
                    </h2>
                    <div className={`px-3 py-1 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-green-500'} text-xs font-bold flex items-center`}>
                        {isPlaying ? (
                            <>
                                <span className="mr-1.5 inline-block w-2 h-2 bg-white rounded-full"></span>
                                REC
                            </>
                        ) : 'AKTYWNY'}
                    </div>
                </div>
            </div>

            {/* Points Counter */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                        Zapisane Pozycje:
                    </span>
                    <span className="bg-gray-900 px-3 py-1 rounded-full text-sm font-mono border border-[#EC1692]/30">
                        {pointCount} / {maxPoints}
                    </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                            width: `${(pointCount / maxPoints) * 100}%`,
                            background: 'linear-gradient(90deg, #EC1692 0%, #f771b7 100%)'
                        }}
                    />
                </div>
            </div>
            
            <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-[#EC1692] border-b border-gray-700 pb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                    </svg>
                    Klawiszologia
                </h3>

                <div className="grid grid-cols-2 gap-2 text-sm bg-black/40 p-3 rounded-lg border border-gray-800">
                    <div className="text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
                        </svg>
                        Ruch:
                    </div>
                    <div>
                        <span className="bg-gray-900 px-2 py-1 rounded text-[#EC1692] shadow-inner font-mono">WASD</span>
                    </div>

                    <div className="text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                        </svg>
                        Dół/Góra:
                    </div>
                    <div>
                        <span className="bg-gray-900 px-2 py-1 rounded text-[#EC1692] shadow-inner font-mono">Q</span> /
                        <span className="bg-gray-900 px-2 py-1 rounded text-[#EC1692] shadow-inner font-mono">E</span>
                    </div>

                    <div className="text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                        </svg>
                        Obrót:
                    </div>
                    <div>
                        <span className="bg-gray-900 px-2 py-1 rounded text-[#EC1692] shadow-inner font-mono">Myszka</span>
                    </div>

                    <div className="text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                        </svg>
                        Zapisz Pozycję:
                    </div>
                    <div className="flex items-center">
                        <span className={`bg-gray-900 px-2 py-1 rounded shadow-inner font-mono ${isPlaying ? 'text-gray-600 line-through' : 'text-[#EC1692]'}`}>H</span>
                        {isPlaying && <span className="text-xs text-red-400 ml-1.5">(niedostępne)</span>}
                    </div>

                    <div className="text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                        </svg>
                        Uruchom Sekwencję:
                    </div>
                    <div>
                        <span className="bg-gray-900 px-2 py-1 rounded text-[#EC1692] shadow-inner font-mono">O</span>
                    </div>

                    <div className="text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                        Wyczyść Pozycje:
                    </div>
                    <div className="flex items-center">
                        <span className={`bg-gray-900 px-2 py-1 rounded shadow-inner font-mono ${isPlaying ? 'text-gray-600 line-through' : 'text-[#EC1692]'}`}>C</span>
                        {isPlaying && <span className="text-xs text-red-400 ml-1.5">(niedostępne)</span>}
                    </div>

                    <div className="text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-[#EC1692]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                        Wyjdź:
                    </div>
                    <div>
                        <span className="bg-gray-900 px-2 py-1 rounded text-[#EC1692] shadow-inner font-mono">F5</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraDirectorUI;