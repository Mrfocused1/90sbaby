import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { Play, Pause, FastForward, Rewind, Battery, Disc, Zap, Star, CassetteTape, Radio, Mic, Activity, Search, X, ChevronLeft, Phone, Mail, Send, User, MessageSquare, Youtube, Music, Instagram as InstagramIcon, Linkedin } from 'lucide-react';
import { EPISODE_DB } from './episodeData.js';

/* --- GSAP CDN INJECTION HELPER --- */
const useGSAP = () => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const scripts = [
            "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js"
        ];

        let loadedCount = 0;
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.onload = () => {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    window.gsap.registerPlugin(window.ScrollTrigger, window.TextPlugin);
                    setReady(true);
                }
            };
            document.body.appendChild(script);
        });
    }, []);
    return ready;
};

/* --- REAL 90s BABY SHOW DATA --- */
const SHOW_INFO = {
    description: "90s Baby Show is an award winning entertainment, TV & Film platform hosted by Fred Santana, Temi Alchemy and VP. We provide an unfiltered platform for established and emerging creatives. We aim to bridge the gap between generations through lighthearted conversation about everyday life, relationships, popular culture, TV & films and more.",
    hosts: [
        { name: "FRED SANTANA", role: "THE VIBE", handle: "@Fr3dSantana" },
        { name: "TEMI ALCHEMY", role: "THE SPARK", handle: "@temiAlchemy" },
        { name: "VP", role: "THE ENERGY", handle: "@VPinthecut" }
    ],
    social: {
        youtube: "https://www.youtube.com/@90sBabyShow",
        spotify: "https://open.spotify.com/show/2ENRq1TqQG1wPiGyuC7Bxa",
        instagram: "https://www.instagram.com/90sbabyshow/",
        tiktok: "https://www.tiktok.com/@90sbabyshow",
        linkedin: "https://uk.linkedin.com/company/90s-baby-show"
    }
};

// --- HELPER COMPONENTS ---

const HostCard = React.memo(({ name, role, quote, color, secondary, icon, mt = "mt-0" }) => {
    return (
        <div className={`host-card group relative mt-12 ${mt}`}>
            <div className={`absolute inset-0 ${color} transform translate-x-2 translate-y-2 border-4 border-black`}></div>
            <div className={`relative ${secondary} border-4 border-black p-6 flex flex-col items-center hover:-translate-y-2 transition-transform duration-200`}>
                <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-black mb-4 flex items-center justify-center">
                    {icon}
                </div>
                <h2 className="font-brand text-4xl text-white text-stroke-black mb-2">{name}</h2>
                <p className="font-hud text-black bg-white px-2 text-lg">{role}</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 -left-8 -rotate-12">
                    <div className="bg-white border-2 border-black p-2 font-handwriting shadow-[4px_4px_0px_black]">"{quote}"</div>
                </div>
            </div>
        </div>
    );
});

const TapeSegment = React.memo(({ epNum, title, tags, color, lowerThird, onClick, thumbnail }) => {
    return (
        <div
            onClick={onClick}
            className="tape-segment w-[90vw] md:w-[60vw] h-[45vh] md:h-full bg-zinc-900 border-4 md:border-8 border-white p-2 md:p-4 relative shadow-[10px_10px_0px_rgba(0,0,0,0.5)] shrink-0 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-yellow-400 transition-all"
        >
            {/* Thumbnail Background */}
            {thumbnail && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                </div>
            )}
            <div className={`absolute inset-0 ${color} opacity-20 z-0`}></div>
            <div className="z-10 text-center px-4 w-full">
                <div className="bg-black text-white font-hud text-base md:text-xl inline-block px-2 mb-2 md:mb-4">EPISODE {epNum}</div>
                <h3 className="font-brand text-2xl md:text-6xl text-white mb-4 md:mb-6 leading-tight drop-shadow-[4px_4px_0px_black] line-clamp-3">{title}</h3>
                <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
                    {tags.map((tag, i) => (
                        <span key={i} className={`bg-white text-black font-bold px-2 py-0.5 md:px-3 md:py-1 border border-black text-xs md:text-base ${i % 2 === 0 ? 'rotate-3' : '-rotate-2'}`}>{tag}</span>
                    ))}
                </div>
                <div className="mt-4 md:mt-6 inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full border-2 md:border-4 border-white bg-pink-500 text-white group-hover:bg-yellow-400 group-hover:scale-110 transition-all">
                    <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                </div>
            </div>
            <div className="absolute bottom-6 md:bottom-10 left-0 w-full bg-gradient-to-r from-blue-600 to-transparent p-2 md:p-4 transform skew-x-12 -ml-8 z-20">
                <div className="text-white font-hud text-sm md:text-2xl transform -skew-x-12 ml-10">{lowerThird}</div>
            </div>
        </div>
    );
});

// --- SUB-COMPONENT: HOME VIEW (SCROLLABLE) ---
const HomeFlow = React.memo(({ isPoweredOn, onViewArchive, onViewContact, onVideoSelect }) => {
    const latestEpisodes = useMemo(() => EPISODE_DB.slice(0, 6), []);

    return (
        <div className={`relative z-10 transition-opacity duration-300 ${isPoweredOn ? 'opacity-100' : 'opacity-0'}`}>
            {/* SECTION 1: INTRO */}
            <section className="section-intro h-screen flex flex-col items-center justify-center relative bg-zinc-900 border-b-4 border-pink-500 overflow-hidden">
                <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-400 rounded-full mix-blend-difference animate-bounce" />
                <div className="absolute bottom-20 right-10 w-0 h-0 border-l-[50px] border-l-transparent border-t-[75px] border-t-cyan-400 border-r-[50px] border-r-transparent rotate-12" />

                <h1 className="logo-main font-bungee text-6xl md:text-9xl text-center text-pink-500 drop-shadow-[4px_4px_0px_#00ffff] z-20 mx-4">
                    90'S BABY
                </h1>
                <p className="font-hud text-2xl md:text-4xl text-white mt-8 tracking-widest bg-black/80 px-4 py-1 rotate-1 border-2 border-yellow-400">
                    THE PODCAST
                </p>
                <div className="absolute bottom-10 animate-bounce text-white font-hud text-xl">
                    SCROLL TO INSERT TAPE ▼
                </div>
            </section>

            {/* SECTION 2: ABOUT */}
            <section className="py-20 bg-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 20px)' }}></div>
                <div className="container mx-auto px-6 max-w-4xl relative z-20">
                    <div className="bg-zinc-900 border-4 border-pink-500 p-8 md:p-12 transform -rotate-1 shadow-[12px_12px_0px_#00ffff]">
                        <h2 className="font-brand text-4xl md:text-6xl text-yellow-400 mb-6 text-center">AWARD WINNING SHOW</h2>
                        <p className="font-hud text-xl md:text-2xl text-white leading-relaxed text-center">
                            {SHOW_INFO.description}
                        </p>
                        <div className="mt-8 flex justify-center gap-6 flex-wrap pointer-events-auto">
                            <a href={SHOW_INFO.social.youtube} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 transition-colors">
                                <Youtube className="w-10 h-10" />
                            </a>
                            <a href={SHOW_INFO.social.spotify} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 transition-colors">
                                <Music className="w-10 h-10" />
                            </a>
                            <a href={SHOW_INFO.social.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400 transition-colors">
                                <InstagramIcon className="w-10 h-10" />
                            </a>
                            <a href={SHOW_INFO.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors">
                                <Linkedin className="w-10 h-10" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3: HOSTS */}
            <section className="py-20 bg-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-20">
                    <HostCard name="FRED" role="THE VIBE" quote="Hold tight..." color="bg-yellow-400" secondary="bg-purple-600" icon={<CassetteTape className="w-16 h-16 text-black" />} />
                    <HostCard name="TEMI" role="THE SPARK" quote="Facts Only!" color="bg-cyan-400" secondary="bg-pink-500" icon={<Star className="w-16 h-16 text-black" />} mt="md:mt-0" />
                    <HostCard name="VP" role="THE ENERGY" quote="Let's Go!" color="bg-pink-500" secondary="bg-yellow-400" icon={<Zap className="w-16 h-16 text-black" />} mt="md:mt-24" />
                </div>
            </section>

            {/* SECTION 4: TAPE REEL - REAL EPISODES */}
            <div className="tape-track h-[70vh] md:h-screen w-full bg-blue-900 overflow-hidden relative flex items-center">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)' }}></div>
                <div className="absolute top-10 left-10 z-30 bg-red-600 text-white font-hud px-4 py-2 text-2xl border-4 border-white shadow-[4px_4px_0px_black]">LATEST EPISODES</div>

                <div className="tape-reel flex items-center pl-[5vw] md:pl-[20vw] gap-6 md:gap-[20vw] w-max h-full md:h-[60vh] py-12 md:py-0">
                    {latestEpisodes.map((ep, idx) => (
                        <TapeSegment
                            key={ep.id}
                            epNum={ep.id.toString()}
                            title={ep.title}
                            tags={ep.tags}
                            color={ep.color}
                            lowerThird={`${ep.date} • Click to Watch`}
                            onClick={() => onVideoSelect(ep.youtubeId)}
                            thumbnail={ep.thumbnail}
                        />
                    ))}

                    {/* ARCHIVE LINK CARD */}
                    <div onClick={onViewArchive} className="tape-segment w-[90vw] md:w-[60vw] h-[45vh] md:h-full bg-zinc-800 border-4 md:border-8 border-white p-4 relative shadow-[10px_10px_0px_rgba(0,0,0,0.5)] shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-zinc-700 transition-colors group">
                        <div className="absolute inset-0 bg-yellow-500/10 z-0"></div>
                        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>
                        <div className="z-10 text-center transform group-hover:scale-105 transition-transform duration-300">
                            <div className="bg-white text-black font-hud text-base md:text-xl inline-block px-2 mb-4 border-2 border-black rotate-1">THE VAULT</div>
                            <h3 className="font-brand text-4xl md:text-7xl text-white mb-6 leading-tight drop-shadow-md">VIEW ALL<br />EPISODES</h3>
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-white bg-pink-500 text-white shadow-[4px_4px_0px_black] group-hover:bg-pink-400 group-hover:shadow-[6px_6px_0px_black] transition-all">
                                <FastForward className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                            </div>
                        </div>
                        <div className="absolute bottom-6 md:bottom-10 left-0 w-full bg-gradient-to-r from-white to-transparent p-2 md:p-4 transform skew-x-12 -ml-8">
                            <div className="text-black font-hud text-lg md:text-2xl transform -skew-x-12 ml-10 flex items-center gap-2">
                                <span className="animate-pulse">●</span> Insert Next Tape...
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 5: HIGHLIGHTS */}
            <section className="py-24 bg-black relative">
                <div className="container mx-auto px-6">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-8 h-8 rounded-full bg-red-600 animate-pulse"></div>
                        <h2 className="font-brand text-5xl text-white">COMMUNITY CLIPS</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: "Funniest Moment", icon: <Mic />, color: "bg-pink-500" },
                            { title: "Heated Debate", icon: <Activity />, color: "bg-red-500" },
                            { title: "Wild Take", icon: <Radio />, color: "bg-yellow-400" },
                            { title: "Storytime", icon: <Disc />, color: "bg-blue-400" }
                        ].map((item, i) => (
                            <div key={i} className="aspect-video bg-zinc-800 border-4 border-zinc-700 relative group overflow-hidden cursor-pointer">
                                <div className={`absolute inset-0 opacity-20 ${item.color}`}></div>
                                <div className="absolute top-2 left-2 bg-black/70 text-white font-hud px-2 text-sm">{`00:1${i}:4${i}:00`}</div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <div className="text-white mb-2">{item.icon}</div>
                                    <h4 className="font-brand text-white text-xl text-center px-4">{item.title}</h4>
                                </div>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 6: OUTRO */}
            <section className="section-outro h-[120vh] bg-zinc-900 relative">
                <div className="h-[80vh] flex flex-col items-center justify-center gap-8">
                    <h2 className="font-brand text-6xl text-white text-center">END OF TAPE</h2>
                    <div className="flex gap-6 pointer-events-auto">
                        <a href={SHOW_INFO.social.youtube} target="_blank" rel="noopener noreferrer" className="bg-pink-500 text-white font-brand text-2xl px-8 py-4 border-b-8 border-pink-700 active:border-b-0 active:translate-y-2 transition-all rounded hover:bg-pink-400">SUBSCRIBE</a>
                        <button onClick={onViewArchive} className="bg-cyan-500 text-white font-brand text-2xl px-8 py-4 border-b-8 border-cyan-700 active:border-b-0 active:translate-y-2 transition-all rounded hover:bg-cyan-400">WATCH NEXT</button>
                    </div>
                    <button onClick={onViewContact} className="text-white font-hud text-xl hover:text-yellow-400 transition-colors flex items-center gap-2 mt-4 border-b border-dashed border-white/50 pb-1 pointer-events-auto">
                        &gt; CONTACT STUDIO / GUEST INQUIRY
                    </button>
                </div>
                <div className="blue-screen absolute inset-0 bg-blue-700 z-50 opacity-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white font-retro text-2xl md:text-4xl animate-pulse text-center">
                        <p>EJECTING TAPE...</p>
                        <p className="mt-4 text-sm font-hud">PLEASE REWIND</p>
                    </div>
                </div>
            </section>

            {/* HOME TAPE SCRUB BAR */}
            <div className="fixed bottom-0 left-0 w-full h-16 bg-zinc-900 border-t-4 border-zinc-700 z-40 flex items-center px-4 gap-4 shadow-lg">
                <div className="font-hud text-zinc-500 text-xl hidden md:block">00:00</div>
                <div className="flex-1 h-4 bg-zinc-800 rounded-full relative overflow-hidden border border-zinc-700 group cursor-grab">
                    <div className="absolute left-[10%] h-full w-[2px] bg-zinc-600"></div>
                    <div className="absolute left-[40%] h-full w-[2px] bg-zinc-600"></div>
                    <div className="absolute left-[80%] h-full w-[2px] bg-zinc-600"></div>
                    <div className="h-full bg-gradient-to-r from-pink-500 to-yellow-500 w-[10%] animate-pulse"></div>
                </div>
                <div className="font-hud text-zinc-500 text-xl hidden md:block">45:00</div>
                <div className="text-zinc-400"><Radio className="w-5 h-5 text-red-500 animate-pulse" /></div>
            </div>
        </div>
    );
});

// --- SUB-COMPONENT: ARCHIVE VIEW (FULL PAGE) ---
const ArchiveFlow = React.memo(({ onBack, searchQuery, setSearchQuery, episodes, onVideoSelect }) => {
    const [visibleCount, setVisibleCount] = useState(12);

    // Reset visible count when search changes
    useEffect(() => {
        setVisibleCount(12);
    }, [searchQuery]);

    const visibleEpisodes = episodes.slice(0, visibleCount);
    const totalCount = episodes.length;

    return (
        <div className="min-h-screen bg-zinc-900 pt-24 pb-12 px-4 md:px-12 relative z-30">
            {/* Archive Header */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-white pb-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div onClick={onBack} className="cursor-pointer hover:text-pink-500 transition-colors flex items-center gap-1 text-white font-hud text-xl pointer-events-auto">
                            <ChevronLeft /> EJECT / RETURN
                        </div>
                    </div>
                    <h1 className="font-brand text-5xl md:text-7xl text-white text-stroke-black drop-shadow-[4px_4px_0px_#ff00ff]">TAPE ARCHIVE</h1>
                    <p className="font-hud text-zinc-400 mt-2">TOTAL TAPES: {totalCount}</p>
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-96 mt-6 md:mt-0 pointer-events-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-400 font-bold" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border-4 border-white bg-black text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-hud text-xl uppercase tracking-widest"
                        placeholder="SEARCH TAPES..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setSearchQuery("")}>
                            <X className="h-5 w-5 text-zinc-400 hover:text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleEpisodes.map((ep) => (
                    <div
                        key={ep.id}
                        onClick={() => onVideoSelect(ep.youtubeId)}
                        className="group relative bg-zinc-800 border-4 border-zinc-700 hover:border-white transition-all duration-200 cursor-pointer pointer-events-auto"
                    >
                        {/* Thumbnail */}
                        <div className="relative h-48 overflow-hidden bg-black">
                            <img
                                src={ep.thumbnail}
                                alt={ep.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23000" width="100" height="100"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E90s Baby%3C/text%3E%3C/svg%3E';
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                <Play className="w-16 h-16 text-white fill-current" />
                            </div>
                        </div>

                        {/* Tape Spine Visual */}
                        <div className={`h-4 w-full ${ep.color} border-b-4 border-zinc-900 flex items-center px-2 gap-1`}>
                            <div className="w-full h-[1px] bg-white/30"></div>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <span className="font-hud text-2xl text-yellow-400">EP.{ep.id}</span>
                                <span className="font-hud text-zinc-400 text-lg">{ep.date}</span>
                            </div>

                            <h3 className="font-brand text-2xl text-white mb-6 leading-tight group-hover:text-cyan-400 transition-colors line-clamp-2">{ep.title}</h3>

                            <div className="flex flex-wrap gap-2 mb-8">
                                {ep.tags.map(tag => (
                                    <span key={tag} className="bg-black text-white font-mono text-xs px-2 py-1 border border-zinc-600 uppercase">{tag}</span>
                                ))}
                            </div>

                            <div className="flex justify-between items-center mt-auto">
                                <div className="text-zinc-500 font-hud text-sm">YOUTUBE</div>
                                <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center group-hover:bg-white group-hover:text-black text-white transition-all">
                                    <Play className="w-4 h-4 fill-current" />
                                </div>
                            </div>
                        </div>

                        {/* Hover Noise Overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-white mix-blend-overlay transition-opacity" />
                    </div>
                ))}
            </div>

            {totalCount === 0 && (
                <div className="col-span-full py-20 text-center font-hud text-2xl text-zinc-500">
                    NO TAPES FOUND IN DATABASE...
                </div>
            )}

            {visibleCount < totalCount && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 12)}
                        className="font-brand text-2xl bg-white text-black px-12 py-4 border-4 border-black shadow-[8px_8px_0px_#ff00ff] hover:bg-pink-500 hover:text-white hover:shadow-[12px_12px_0px_white] transition-all pointer-events-auto active:translate-y-1 active:translate-x-1 active:shadow-none"
                    >
                        LOAD MORE TAPES...
                    </button>
                </div>
            )}

            {/* Archive Footer */}
            <div className="mt-20 border-t-2 border-zinc-800 pt-8 text-center">
                <p className="font-hud text-zinc-600">ARCHIVE SYSTEM v2.0 // 90S BABY LLC</p>
            </div>
        </div>
    );
});

// --- SUB-COMPONENT: CONTACT FLOW (REDESIGNED) ---
const ContactFlow = React.memo(({ onBack }) => {
    const [isGuest, setIsGuest] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-900 pt-24 pb-32 px-4 md:px-12 relative z-30 overflow-hidden">
            {/* Background Chaos */}
            <div className="absolute top-20 right-[-100px] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-yellow-400 rotate-12 opacity-10"></div>

            {/* Header Section */}
            <div className="relative mb-12 text-center">
                <div onClick={onBack} className="absolute left-0 top-0 cursor-pointer hover:text-pink-500 transition-colors flex items-center gap-1 text-white font-hud text-xl bg-black/50 px-2 py-1 border border-white/30 z-50 pointer-events-auto">
                    <ChevronLeft /> EJECT
                </div>

                <h1 className="font-brand text-6xl md:text-8xl text-yellow-400 text-stroke-black drop-shadow-[8px_8px_0px_#ff00ff] -rotate-2 inline-block">
                    HIT US UP!
                </h1>
                <div className="bg-cyan-400 text-black font-hud text-2xl px-4 py-1 rotate-2 inline-block border-4 border-black shadow-[4px_4px_0px_black] relative -top-8 -left-4">
                    LINES ARE OPEN
                </div>
            </div>

            <div className="max-w-4xl mx-auto relative">
                {/* Form Container: "The Clipboard/Notebook" Look */}
                <div className="bg-white p-2 md:p-8 transform rotate-1 border-4 border-black shadow-[16px_16px_0px_#00ffff] relative">

                    {/* Decorative Tape/Stickers */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/20 w-32 h-8 rotate-1"></div>
                    <div className="absolute -top-8 right-10 rotate-12 bg-yellow-300 text-black font-handwriting p-4 border-2 border-black shadow-[4px_4px_0px_black] hidden md:block">
                        <p className="font-brand leading-none text-center">DON'T BE<br />SHY!</p>
                    </div>

                    <div className="border-4 border-black border-dashed p-6 md:p-10 bg-zinc-100">

                        <p className="font-hud text-xl md:text-2xl text-black mb-8 text-center leading-relaxed">
                            YO! WANT TO ROAST A HOST? SHARE A 90S MEMORY? <br />
                            OR MAYBE YOU THINK YOU HAVE THE <span className="bg-pink-500 text-white px-1">RIZZ</span> TO BE A GUEST?
                        </p>

                        <form className="flex flex-col gap-8 pointer-events-auto">

                            {/* Inputs Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-focus-within:translate-x-3 group-focus-within:translate-y-3 transition-transform"></div>
                                    <input type="text" className="relative w-full bg-white border-4 border-black p-4 font-hud text-2xl text-black focus:outline-none focus:bg-yellow-50 placeholder-zinc-400 uppercase" placeholder="NAME / ALIAS" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-focus-within:translate-x-3 group-focus-within:translate-y-3 transition-transform"></div>
                                    <input type="email" className="relative w-full bg-white border-4 border-black p-4 font-hud text-2xl text-black focus:outline-none focus:bg-yellow-50 placeholder-zinc-400 uppercase" placeholder="PAGER # (EMAIL)" />
                                </div>
                            </div>

                            {/* Guest Toggle - Big Chunky Button */}
                            <div
                                className={`cursor-pointer border-4 border-black p-4 transition-all duration-200 relative ${isGuest ? 'bg-pink-500 text-white' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`}
                                onClick={() => setIsGuest(!isGuest)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-brand text-2xl md:text-3xl">I WANT TO BE A GUEST</span>
                                    <div className={`w-8 h-8 border-4 border-black bg-white flex items-center justify-center`}>
                                        {isGuest && <div className="w-4 h-4 bg-black"></div>}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Guest Section */}
                            {isGuest && (
                                <div className="relative animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div className="absolute -left-4 top-4 -rotate-90 text-pink-500 font-brand hidden md:block">PITCH IT</div>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-yellow-100 border-4 border-black p-4 font-hud text-xl text-black focus:outline-none focus:bg-yellow-200 placeholder-black/50"
                                        placeholder="WHAT'S THE TOPIC? DON'T BE BORING..."
                                    ></textarea>
                                </div>
                            )}

                            {/* Message Area */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-focus-within:translate-x-3 group-focus-within:translate-y-3 transition-transform"></div>
                                <textarea
                                    rows="5"
                                    className="relative w-full bg-white border-4 border-black p-4 font-hud text-xl text-black focus:outline-none focus:bg-cyan-50 placeholder-zinc-400 uppercase"
                                    placeholder="TYPE YOUR MESSAGE HERE..."
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button type="button" className="relative group mt-4">
                                <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
                                <div className="relative bg-cyan-400 border-4 border-black p-4 flex items-center justify-center gap-4 group-hover:bg-cyan-300 transition-colors">
                                    <Send className="w-8 h-8 text-black" />
                                    <span className="font-brand text-3xl text-black">SEND IT</span>
                                </div>
                            </button>

                        </form>
                    </div>
                </div>

                {/* More Background Decor */}
                <div className="absolute top-1/2 -right-12 w-24 h-24 bg-purple-500 border-4 border-black rotate-45 z-[-1] hidden md:block"></div>
                <div className="absolute bottom-0 -left-8 w-32 h-32 bg-green-400 rounded-full border-4 border-black z-[-1] hidden md:block"></div>
            </div>
        </div>
    );
});

export default function App() {
    const gsapReady = useGSAP();
    const [isPoweredOn, setIsPoweredOn] = useState(false);
    const [timecode, setTimecode] = useState("00:00:00:00");
    const [mode, setMode] = useState("STANDBY");
    const [tapeGlitch, setTapeGlitch] = useState(0);
    const [view, setView] = useState("home"); // 'home' | 'archive' | 'contact'
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReelActive, setIsReelActive] = useState(false);
    const [menuFuzzy, setMenuFuzzy] = useState(false);

    const containerRef = useRef(null);

    // Mobile Menu Fuzzy Interval
    useEffect(() => {
        if (!isMenuOpen) {
            setMenuFuzzy(false);
            return;
        }
        const interval = setInterval(() => {
            setMenuFuzzy(true);
            setTimeout(() => setMenuFuzzy(false), 200 + Math.random() * 400); // Distortion duration
        }, 2000 + Math.random() * 3000); // Frequency
        return () => clearInterval(interval);
    }, [isMenuOpen]);

    // Power On Sequence
    useEffect(() => {
        if (gsapReady) {
            setTimeout(() => setIsPoweredOn(true), 500);
        }
    }, [gsapReady]);

    // Main Scroll Logic & Animation (Only active in 'home' view)
    useLayoutEffect(() => {
        if (!gsapReady || !isPoweredOn || view !== 'home') return;

        const ctx = window.gsap.context(() => {
            const tl = window.gsap.timeline();

            tl.fromTo(".viewfinder-inner",
                { scaleY: 0.01, scaleX: 0.8, opacity: 0 },
                { scaleY: 1, scaleX: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
            )
                .to(".viewfinder-overlay", { opacity: 1, duration: 0.2 })
                .add(() => setMode("REC"));

            window.ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                onUpdate: (self) => {
                    const totalFrames = Math.floor(self.progress * 5000);
                    const hrs = Math.floor(totalFrames / 108000).toString().padStart(2, '0');
                    const mins = Math.floor((totalFrames % 108000) / 1800).toString().padStart(2, '0');
                    const secs = Math.floor((totalFrames % 1800) / 30).toString().padStart(2, '0');
                    const frames = (totalFrames % 30).toString().padStart(2, '0');
                    const newTimecode = `${hrs}:${mins}:${secs}:${frames}`;
                    setTimecode(prev => prev !== newTimecode ? newTimecode : prev);

                    const velocity = Math.abs(self.getVelocity());
                    const glitchAmount = Math.min(velocity / 2000, 1);
                    setTapeGlitch(glitchAmount);

                    if (velocity > 1000) {
                        setMode(self.direction === 1 ? "FF >>" : "<< REW");
                    } else if (velocity > 50) {
                        setMode("PLAY");
                    } else {
                        if (self.progress < 0.9) setMode("REC");
                    }
                }
            });

            window.gsap.from(".logo-main", {
                scrollTrigger: { trigger: ".section-intro", start: "top center", scrub: 1 },
                scale: 0.5, opacity: 0, rotation: -10
            });

            const hosts = window.gsap.utils.toArray(".host-card");
            hosts.forEach((host, i) => {
                window.gsap.from(host, {
                    scrollTrigger: { trigger: host, start: "top 80%", end: "center center", scrub: true },
                    scale: 0.8, opacity: 0, y: 100
                });
            });

            const reel = containerRef.current.querySelector(".tape-reel");
            if (reel) {
                const getScrollAmount = () => -(reel.scrollWidth - window.innerWidth);
                window.gsap.to(reel, {
                    x: getScrollAmount,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".tape-track",
                        pin: true,
                        scrub: 1,
                        invalidateOnRefresh: true,
                        start: window.innerWidth < 768 ? "center center" : "top top",
                        end: "+=3000",
                        onToggle: (self) => setIsReelActive(self.isActive),
                    }
                });
            }

            window.gsap.to(".blue-screen", {
                scrollTrigger: { trigger: ".section-outro", start: "center center", end: "bottom bottom", scrub: true },
                opacity: 1
            });

        }, containerRef);

        return () => ctx.revert();
    }, [gsapReady, isPoweredOn, view]);

    // Handle View Switching
    const handleViewArchive = () => {
        setMode("DB_ACCESS");
        setTapeGlitch(0.8);
        setTimeout(() => {
            setView("archive");
            setTapeGlitch(0);
            window.scrollTo(0, 0);
        }, 500);
    };

    const handleViewContact = () => {
        setMode("INPUT_MODE");
        setTapeGlitch(0.8);
        setTimeout(() => {
            setView("contact");
            setTapeGlitch(0);
            window.scrollTo(0, 0);
        }, 500);
    };

    const handleBackHome = () => {
        setMode("LOAD...");
        setTapeGlitch(0.8);
        setTimeout(() => {
            setView("home");
            setTapeGlitch(0);
            setMode("REC");
        }, 500);
    };

    // Filter Logic - Memoized for Performance
    const filteredEpisodes = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return EPISODE_DB.filter(ep =>
            ep.title.toLowerCase().includes(query) ||
            ep.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    if (!gsapReady) return <div className="bg-black h-screen w-screen flex items-center justify-center text-white font-mono">INSERT TAPE...</div>;

    return (
        <div ref={containerRef} className="bg-zinc-900 min-h-screen relative overflow-x-hidden font-sans selection:bg-pink-500 selection:text-white">

            {/* --- VIEWFINDER HUD (ALWAYS VISIBLE) --- */}
            <div className="fixed inset-0 z-50 pointer-events-none p-4 pt-12 md:p-8 flex flex-col justify-between overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-black/20 mix-blend-overlay pointer-events-none transition-opacity duration-100 ${isPoweredOn ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`absolute inset-0 scanlines pointer-events-none z-10 ${isPoweredOn ? 'opacity-30' : 'opacity-0'}`} />
                <div
                    className="absolute inset-0 bg-noise opacity-0 transition-opacity duration-75 z-20 pointer-events-none mix-blend-hard-light"
                    style={{
                        opacity: tapeGlitch,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`
                    }}
                />

                {/* HUD Top */}
                <div className={`flex justify-between items-start font-hud text-lg md:text-3xl text-white tracking-widest drop-shadow-md transition-opacity duration-500 ${isPoweredOn ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            {mode === "REC" && <div className="w-4 h-4 md:w-6 md:h-6 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]" />}
                            {(mode === "PLAY" || mode === "DB_ACCESS" || mode === "INPUT_MODE") && <Play className="text-green-400 w-6 h-6" fill="currentColor" />}
                            {mode.includes("FF") && <FastForward className="text-yellow-400 w-6 h-6" fill="currentColor" />}
                            {mode.includes("REW") && <Rewind className="text-yellow-400 w-6 h-6" fill="currentColor" />}
                            <span className={`
                ${mode === "REC" ? "text-red-500" : ""}
                ${(mode === "PLAY" || mode === "DB_ACCESS" || mode === "INPUT_MODE") ? "text-green-400" : ""}
                ${(mode.includes("FF") || mode.includes("REW")) ? "text-yellow-400" : ""}
              `}>{mode}</span>
                        </div>
                        <span className="text-white/80 text-lg">
                            {view === 'home' ? 'SP' : view === 'archive' ? 'ARCHIVE' : 'UPLINK'}
                        </span>

                        {/* MOBILE MENU TOGGLE */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="md:hidden mt-2 pointer-events-auto bg-white text-black font-brand text-xs px-2 py-1 border-2 border-black flex items-center gap-2 active:translate-y-0.5"
                        >
                            <CassetteTape className="w-4 h-4" /> MENU
                        </button>

                        {/* --- NAVIGATION MENU (DESKTOP) --- */}
                        <nav className="mt-4 hidden md:flex gap-4 md:gap-8 pointer-events-auto">
                            <button
                                onClick={handleBackHome}
                                className={`font-retro text-[10px] md:text-sm tracking-tighter px-2 py-1 border-2 transition-all ${view === 'home' ? 'bg-pink-500 border-white text-white shadow-[4px_4px_0px_white]' : 'bg-black/50 border-zinc-500 text-zinc-400 hover:border-pink-500 hover:text-white'}`}
                            >
                                HOME
                            </button>
                            <button
                                onClick={handleViewArchive}
                                className={`font-retro text-[10px] md:text-sm tracking-tighter px-2 py-1 border-2 transition-all ${view === 'archive' ? 'bg-cyan-500 border-white text-white shadow-[4px_4px_0px_white]' : 'bg-black/50 border-zinc-500 text-zinc-400 hover:border-cyan-500 hover:text-white'}`}
                            >
                                EPISODES
                            </button>
                            <button
                                onClick={handleViewContact}
                                className={`font-retro text-[10px] md:text-sm tracking-tighter px-2 py-1 border-2 transition-all ${view === 'contact' ? 'bg-yellow-400 border-white text-black shadow-[4px_4px_0px_white]' : 'bg-black/50 border-zinc-500 text-zinc-400 hover:border-yellow-400 hover:text-white'}`}
                            >
                                CONTACT
                            </button>
                        </nav>
                    </div>
                    <div className="flex flex-col items-end gap-1 md:gap-2">
                        <div className="flex items-center gap-2 text-green-400"><Battery className="w-6 h-6 md:w-8 md:h-8" /></div>
                        <span className="font-mono bg-black/50 px-2 rounded backdrop-blur-sm border border-white/20 text-sm md:text-xl">{timecode}</span>
                    </div>
                </div>

                {/* Focus Brackets (Only in Home View - Episodes Section) */}
                {view === 'home' && (
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ${isReelActive ? 'scale-100 opacity-60' : 'scale-110 opacity-0'}`}>
                        <div className="w-[90vw] h-[45vh] md:w-[600px] md:h-[400px] border-2 border-white/30 relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 -mt-1 -ml-1" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 -mt-1 -mr-1" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 -mb-1 -ml-1" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 -mb-1 -mr-1" />
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2">
                                <div className="w-full h-[2px] bg-white/50 absolute top-1/2" />
                                <div className="h-full w-[2px] bg-white/50 absolute left-1/2" />
                            </div>
                        </div>
                    </div>
                )}

                {/* HUD Bottom */}
                <div className={`font-hud text-base md:text-2xl text-white/80 flex justify-between items-end transition-opacity duration-1000 delay-500 pb-20 md:pb-0 ${isPoweredOn ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col">
                        <span className="text-yellow-300">JAN 02 1996</span>
                        <span className="text-xs md:text-sm">MEMPHIS_TAPE_{view === 'home' ? '01' : 'LIB'}</span>
                    </div>
                    {tapeGlitch > 0.5 && <span className="text-red-500 animate-pulse bg-black px-2 text-xs md:text-sm">TRACKING ERROR</span>}
                </div>
            </div>

            {/* --- MOBILE NAVIGATION MENU OVERLAY --- */}
            <div className={`fixed inset-0 z-[100] bg-black/95 transition-all duration-500 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${menuFuzzy ? 'vhs-fuzzy' : ''}`}>
                {/* Visual Chaos/Noise */}
                <div className={`absolute inset-0 bg-noise pointer-events-none transition-opacity duration-75 ${menuFuzzy ? 'opacity-40 animate-pulse-noise' : 'opacity-10'}`} />
                <div className="absolute top-0 right-0 p-8">
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="text-white font-hud text-2xl flex items-center gap-2 hover:text-pink-500 transition-colors"
                    >
                        [X] CLOSE
                    </button>
                </div>

                <div className="h-full flex flex-col justify-center items-center gap-12 p-8">
                    <div className="text-pink-500 font-brand text-xl tracking-tighter -rotate-3 bg-white px-2 border-2 border-black mb-4">SELECT MODE:</div>

                    <button
                        onClick={() => { handleBackHome(); setIsMenuOpen(false); }}
                        className={`group relative text-5xl font-brand ${view === 'home' ? 'text-pink-500' : 'text-white'} hover:scale-110 transition-transform`}
                    >
                        <span className="relative z-10">HOME</span>
                        {view === 'home' && <div className="absolute -inset-2 bg-white -z-10 -rotate-2 border-4 border-black shadow-[4px_4px_0px_#00ffff]" />}
                    </button>

                    <button
                        onClick={() => { handleViewArchive(); setIsMenuOpen(false); }}
                        className={`group relative text-5xl font-brand ${view === 'archive' ? 'text-cyan-400' : 'text-white'} hover:scale-110 transition-transform`}
                    >
                        <span className="relative z-10">ARCHIVE</span>
                        {view === 'archive' && <div className="absolute -inset-2 bg-white -z-10 rotate-2 border-4 border-black shadow-[4px_4px_0px_#ff00ff]" />}
                    </button>

                    <button
                        onClick={() => { handleViewContact(); setIsMenuOpen(false); }}
                        className={`group relative text-5xl font-brand ${view === 'contact' ? 'text-yellow-400' : 'text-white'} hover:scale-110 transition-transform`}
                    >
                        <span className="relative z-10">UPLINK</span>
                        {view === 'contact' && <div className="absolute -inset-2 bg-white -z-10 rotate-1 border-4 border-black shadow-[4px_4px_0px_#00ffff]" />}
                    </button>

                    <div className="mt-12 flex flex-col items-center gap-4 border-t-2 border-white/20 pt-8 w-full max-w-xs">
                        <p className="font-hud text-zinc-500 text-sm">90s BABY OS v2.0</p>
                        <div className="flex gap-4">
                            <div className="h-2 w-12 bg-red-600 animate-pulse" />
                            <div className="h-2 w-12 bg-green-500 animate-pulse" />
                            <div className="h-2 w-12 bg-blue-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT SWITCHER --- */}
            {view === 'home' ? (
                <HomeFlow
                    isPoweredOn={isPoweredOn}
                    onViewArchive={handleViewArchive}
                    onViewContact={handleViewContact}
                    onVideoSelect={setSelectedVideo}
                />
            ) : view === 'archive' ? (
                <ArchiveFlow
                    onBack={handleBackHome}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    episodes={filteredEpisodes}
                    onVideoSelect={setSelectedVideo}
                />
            ) : (
                <ContactFlow onBack={handleBackHome} />
            )}

            {/* YouTube Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 pointer-events-auto" onClick={() => setSelectedVideo(null)}>
                    <div className="relative w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute -top-12 right-0 text-white font-hud text-2xl hover:text-pink-500 transition-colors pointer-events-auto"
                        >
                            CLOSE [X]
                        </button>
                        <iframe
                            className="w-full h-full border-4 border-white"
                            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

        </div>
    );
}
