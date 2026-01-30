"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/basic";
import { ArrowRight } from "lucide-react";

export default function Preloader() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const router = useRouter();

    const words = [
        { text: "Yap.", sub: "Just talk" },
        { text: "Discuss.", sub: "Deep dives" },
        { text: "Stay Anonymous.", sub: "No traces" },
        { text: "Chat Around.", sub: "Welcome" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % words.length);
                setIsVisible(true);
            }, 300); // Wait for fade out before changing text
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const handleEnter = () => {
        setIsExiting(true);
        setTimeout(() => {
            router.push("/groups");
        }, 600);
    };

    return (
        <div className={`min-h-screen bg-background relative overflow-hidden flex items-center justify-center transition-all duration-700 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        
        .text-transition {
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }
        
        .text-visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .text-hidden {
          opacity: 0;
          transform: translateY(10px);
        }
      `}</style>

            {/* Main Content */}
            <div className="relative z-10 text-center px-6">
                {/* Minimal Center Indicator */}
                <div className="mb-16">
                    {/* <div className="w-2 h-2 bg-foreground rounded-full mx-auto mb-8 animate-pulse" /> */}

                    {/* Cycling Text */}
                    <div className="h-24 flex flex-col items-center justify-center mb-4">
                        <div className={`text-transition ${isVisible ? 'text-visible' : 'text-hidden'}`}>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground font-poppins tracking-tight">
                                {words[currentIndex].text}
                            </h1>
                        </div>

                        <div className={`text-transition delay-75 ${isVisible ? 'text-visible' : 'text-hidden'}`}>
                            <p className="mt-4 text-sm text-muted-foreground font-poppins font-medium tracking-wide uppercase">
                                {words[currentIndex].sub}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    {words.map((_, i) => (
                        <div
                            key={i}
                            className={`h-[2px] rounded-full transition-all duration-700 ${i === currentIndex
                                ? 'w-12 bg-foreground'
                                : 'w-2 bg-muted-foreground/20'
                                }`}
                        />
                    ))}
                </div>

                {/* Enter Button */}
                <div className="flex flex-col items-center gap-4">
                    <Button
                        onClick={handleEnter}
                        className="group rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-10 h-12 text-sm transition-all duration-300 hover:scale-105 font-poppins"
                    >
                        Enter
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <p className="text-xs text-muted-foreground font-poppins">
                        Click anywhere to continue
                    </p>
                </div>
            </div>

            {/* Click Handler */}
            <div
                className="fixed inset-0 cursor-pointer z-0"
                onClick={handleEnter}
            />
        </div>
    );
}