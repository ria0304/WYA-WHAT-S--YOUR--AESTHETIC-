
import React, { useState } from 'react';
import { ChevronRight, Sparkles, Check, Camera, Cloud, Box, Leaf, Plane } from 'lucide-react';

interface StyleQuizProps {
  onComplete: (dna: string) => void;
  userGender: string;
}

const StyleQuiz: React.FC<StyleQuizProps> = ({ onComplete, userGender }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const questions = [
    {
      id: 1,
      question: "How would you describe your everyday look?",
      multi: true,
      options: userGender === 'Male' 
        ? ["Minimalist & Sharp", "Streetwear & Bold", "Business Casual", "Athleisure", "Vintage / Retro", "Workwear / Rugged", "Preppy", "Gorpcore", "Skater", "Techwear", "Quiet Luxury"]
        : ["Minimalist & Clean", "Bold & Experimental", "Classic & Sophisticated", "Bohemian & Relaxed", "Streetwear & Edgy", "Cottagecore / Sweet", "Y2K / Cyber", "Dark Academia", "Soft Girl", "Grunge / Alt", "Old Money"]
    },
    {
      id: 2,
      question: "What's your primary color palette preference?",
      multi: true,
      options: ["Monochrome (Black/White)", "Earth Tones (Brown, Olive)", "Vibrant & Bright", "Soft Pastels", "Deep Jewel Tones", "Neutral Sand & Beiges", "Neon / Electric", "Warm Sunrise (Orange, Pink)"]
    },
    {
      id: 4,
      question: "What's your preferred silhouette?",
      multi: false,
      options: ["Oversized & Boxy", "Slim & Tailored", "Draped & Flowing", "Athletic / Compressed", "Structured & Geometric"]
    }
  ];

  const handleToggleOption = (option: string) => {
    const q = questions[currentStep];
    const currentSelected = selections[currentStep] || [];
    
    if (q.multi) {
      if (currentSelected.includes(option)) {
        setSelections({ ...selections, [currentStep]: currentSelected.filter(o => o !== option) });
      } else {
        setSelections({ ...selections, [currentStep]: [...currentSelected, option] });
      }
    } else {
      setSelections({ ...selections, [currentStep]: [option] });
    }
  };

  const handleNext = () => {
    if (!selections[currentStep] || selections[currentStep].length === 0) return;
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsAnalyzing(true);
      
      const looks = (selections[0] || []).join(" & ");
      const colors = (selections[1] || []).join(" & ");
      const sil = (selections[2] || ["your chosen silhouette"])[0];
      const dnaString = `We've mapped your fashion signature. Your matches will now be more personalized to your ${looks} aesthetic and your preference for ${colors}. You lean towards a ${sil} silhouette.`;

      // Faster analysis time for better UX
      setTimeout(() => {
        onComplete(dnaString);
      }, 2500);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[2000] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <Sparkles className="absolute top-[15%] left-[20%] w-10 h-10 -rotate-12" />
          <Cloud className="absolute top-[30%] right-[5%] w-16 h-16" />
          <Box className="absolute top-[48%] right-[10%] w-12 h-12 rotate-12" />
          <Leaf className="absolute bottom-[25%] left-[18%] w-12 h-12 -rotate-45" />
          <Plane className="absolute bottom-[15%] right-[25%] w-14 h-14 -rotate-12" />
          <Sparkles className="absolute top-[10%] right-[30%] w-6 h-6" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-8 text-center">
           <h2 className="text-sm font-black text-slate-700 tracking-[0.4em] uppercase mb-16 animate-pulse">
             Analyzing your style DNA
           </h2>
           
           <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-50" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="3" strokeDasharray="440" strokeDashoffset="110" fill="transparent" className="text-pink-400 animate-spin" style={{ transformOrigin: 'center' }} />
              </svg>
              <div className="relative bg-white p-6 rounded-full">
                 <Camera className="w-12 h-12 text-slate-200" strokeWidth={1.5} />
              </div>
           </div>
        </div>
      </div>
    );
  }

  const q = questions[currentStep];
  const currentSelected = selections[currentStep] || [];

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-10">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Question {currentStep + 1}/{questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-8 h-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-pink-400 w-12' : 'bg-slate-200 w-4'}`} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-10 shadow-xl border border-white animate-fade-in" key={currentStep}>
        <h2 className="text-3xl serif mb-4 leading-tight text-slate-800">{q.question}</h2>
        {q.multi && <p className="text-[10px] font-bold text-slate-400 uppercase mb-8">Select more than one if you like</p>}
        {!q.multi && <div className="h-8"></div>}
        
        <div className="space-y-2 mb-8 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {q.options.map((opt) => {
            const isSelected = currentSelected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => handleToggleOption(opt)}
                className={`w-full p-5 rounded-[24px] border-2 transition-all flex justify-between items-center group ${isSelected ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-pink-600' : 'text-slate-600'}`}>{opt}</span>
                {isSelected ? <Check className="w-5 h-5 text-pink-400" /> : <div className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        <button 
          onClick={handleNext}
          disabled={currentSelected.length === 0}
          className="w-full py-5 rounded-full gradient-bg text-white font-bold text-xs uppercase tracking-[2px] shadow-xl shadow-pink-100 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale transition-all"
        >
          {currentStep === questions.length - 1 ? 'Finish DNA Analysis' : 'Next Step'}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default StyleQuiz;
